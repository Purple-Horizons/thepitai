import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, votes, agents, agentStats, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { publishBattleEvent, publishLeaderboardUpdate } from "@/lib/ably";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ELO calculation constants
const K_FACTOR = 32; // Standard K-factor for ELO

function calculateEloChange(winnerElo: number, loserElo: number): { winnerGain: number; loserLoss: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  const winnerGain = Math.round(K_FACTOR * (1 - expectedWinner));
  const loserLoss = Math.round(K_FACTOR * (0 - expectedLoser));
  
  return { winnerGain, loserLoss: Math.abs(loserLoss) };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: battleId } = await params;
    const body = await request.json();
    const { visitorId, votedForAgentId } = body;

    // Validate required fields
    if (!visitorId || !votedForAgentId) {
      return NextResponse.json(
        { error: "visitorId and votedForAgentId are required" },
        { status: 400 }
      );
    }

    // Get the battle
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    if (!battle) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }

    // Check battle is in voting phase
    if (battle.status !== 'voting') {
      return NextResponse.json(
        { error: `Battle is not in voting phase. Current status: ${battle.status}` },
        { status: 400 }
      );
    }

    // Check voting hasn't ended
    if (battle.votingEndsAt && new Date() > battle.votingEndsAt) {
      return NextResponse.json(
        { error: "Voting period has ended" },
        { status: 400 }
      );
    }

    // Validate voted agent is in this battle
    if (votedForAgentId !== battle.agentAId && votedForAgentId !== battle.agentBId) {
      return NextResponse.json(
        { error: "Invalid agent - not a participant in this battle" },
        { status: 400 }
      );
    }

    // Get or create anonymous voter user
    let voter = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, `visitor_${visitorId}`))
      .limit(1);

    if (voter.length === 0) {
      const [newVoter] = await db.insert(users).values({
        clerkId: `visitor_${visitorId}`,
        username: `visitor_${visitorId.slice(0, 8)}`,
        displayName: 'Anonymous Voter',
        role: 'user',
      }).returning();
      voter = [newVoter];
    }

    // Check if user already voted in this battle
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.visitorId, voter[0].id),
        eq(votes.battleId, battleId)
      ))
      .limit(1);

    if (existingVote.length > 0) {
      return NextResponse.json(
        { error: "You have already voted in this battle" },
        { status: 400 }
      );
    }

    // Record the vote
    await db.insert(votes).values({
      visitorId: voter[0].id,
      battleId,
      votedForAgentId,
      voteType: 'crowd',
    });

    // Update battle vote counts
    const isVoteForA = votedForAgentId === battle.agentAId;
    await db
      .update(battles)
      .set(isVoteForA 
        ? { crowdVotesA: sql`${battles.crowdVotesA} + 1` }
        : { crowdVotesB: sql`${battles.crowdVotesB} + 1` }
      )
      .where(eq(battles.id, battleId));

    // Get updated vote counts
    const [updatedBattle] = await db
      .select({
        crowdVotesA: battles.crowdVotesA,
        crowdVotesB: battles.crowdVotesB,
      })
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    // Publish vote event in real-time
    await publishBattleEvent(battleId, {
      type: 'vote_cast',
      agentId: votedForAgentId,
      votesA: updatedBattle?.crowdVotesA ?? 0,
      votesB: updatedBattle?.crowdVotesB ?? 0,
    });

    return NextResponse.json({
      success: true,
      vote: {
        battleId,
        votedFor: isVoteForA ? 'A' : 'B',
      },
      currentVotes: {
        agentA: updatedBattle?.crowdVotesA ?? 0,
        agentB: updatedBattle?.crowdVotesB ?? 0,
      },
      message: "Vote recorded!",
    });

  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

// Finalize battle and update ELO
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: battleId } = await params;

    // Get the battle
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    if (battle.status !== 'voting') {
      return NextResponse.json(
        { error: `Cannot finalize - battle status is ${battle.status}` },
        { status: 400 }
      );
    }

    const votesA = battle.crowdVotesA ?? 0;
    const votesB = battle.crowdVotesB ?? 0;

    // Determine winner
    let winnerId: string | null = null;
    let isDraw = false;

    if (votesA > votesB) {
      winnerId = battle.agentAId;
    } else if (votesB > votesA) {
      winnerId = battle.agentBId;
    } else {
      isDraw = true;
    }

    // Get agent stats
    const [statsA] = await db.select().from(agentStats).where(eq(agentStats.agentId, battle.agentAId)).limit(1);
    const [statsB] = await db.select().from(agentStats).where(eq(agentStats.agentId, battle.agentBId)).limit(1);

    const eloA = statsA?.eloOverall ?? 1200;
    const eloB = statsB?.eloOverall ?? 1200;

    let newEloA = eloA;
    let newEloB = eloB;
    let eloChangeA = 0;
    let eloChangeB = 0;

    if (!isDraw && winnerId) {
      const { winnerGain, loserLoss } = calculateEloChange(
        winnerId === battle.agentAId ? eloA : eloB,
        winnerId === battle.agentAId ? eloB : eloA
      );

      if (winnerId === battle.agentAId) {
        newEloA = eloA + winnerGain;
        newEloB = eloB - loserLoss;
        eloChangeA = winnerGain;
        eloChangeB = -loserLoss;
      } else {
        newEloB = eloB + winnerGain;
        newEloA = eloA - loserLoss;
        eloChangeB = winnerGain;
        eloChangeA = -loserLoss;
      }
    }

    // Update agent stats
    await db.update(agentStats).set({
      eloOverall: newEloA,
      eloDebate: newEloA,
      totalBattles: sql`${agentStats.totalBattles} + 1`,
      wins: winnerId === battle.agentAId ? sql`${agentStats.wins} + 1` : agentStats.wins,
      losses: winnerId === battle.agentBId ? sql`${agentStats.losses} + 1` : agentStats.losses,
      draws: isDraw ? sql`${agentStats.draws} + 1` : agentStats.draws,
      updatedAt: new Date(),
    }).where(eq(agentStats.agentId, battle.agentAId));

    await db.update(agentStats).set({
      eloOverall: newEloB,
      eloDebate: newEloB,
      totalBattles: sql`${agentStats.totalBattles} + 1`,
      wins: winnerId === battle.agentBId ? sql`${agentStats.wins} + 1` : agentStats.wins,
      losses: winnerId === battle.agentAId ? sql`${agentStats.losses} + 1` : agentStats.losses,
      draws: isDraw ? sql`${agentStats.draws} + 1` : agentStats.draws,
      updatedAt: new Date(),
    }).where(eq(agentStats.agentId, battle.agentBId));

    // Mark battle complete
    await db.update(battles).set({
      status: 'complete',
      winnerId,
      endedAt: new Date(),
    }).where(eq(battles.id, battleId));

    // Get agent names for response
    const [agentA] = await db.select({ name: agents.name }).from(agents).where(eq(agents.id, battle.agentAId)).limit(1);
    const [agentB] = await db.select({ name: agents.name }).from(agents).where(eq(agents.id, battle.agentBId)).limit(1);

    // Publish battle complete event
    await publishBattleEvent(battleId, {
      type: 'battle_complete',
      winnerId,
      winnerName: isDraw ? null : (winnerId === battle.agentAId ? agentA?.name ?? null : agentB?.name ?? null),
      isDraw,
    });

    // Publish leaderboard updates
    await publishLeaderboardUpdate(battle.agentAId, newEloA);
    await publishLeaderboardUpdate(battle.agentBId, newEloB);

    return NextResponse.json({
      success: true,
      result: {
        battleId,
        winner: isDraw ? null : (winnerId === battle.agentAId ? agentA?.name : agentB?.name),
        isDraw,
        votes: { agentA: votesA, agentB: votesB },
        eloChanges: {
          [agentA?.name || 'Agent A']: { before: eloA, after: newEloA, change: eloChangeA },
          [agentB?.name || 'Agent B']: { before: eloB, after: newEloB, change: eloChangeB },
        },
      },
      message: isDraw 
        ? "Battle ended in a draw! No ELO changes."
        : `${winnerId === battle.agentAId ? agentA?.name : agentB?.name} wins!`,
    });

  } catch (error) {
    console.error("Finalize battle error:", error);
    return NextResponse.json(
      { error: "Failed to finalize battle" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: battleId } = await params;
  
  return NextResponse.json({
    message: `Vote or finalize battle ${battleId}`,
    endpoints: {
      "POST /vote": {
        description: "Cast a vote",
        body: {
          visitorId: "unique-visitor-id (fingerprint or session)",
          votedForAgentId: "uuid of agent to vote for",
        },
      },
      "PUT /vote": {
        description: "Finalize voting and update ELO (admin)",
        body: {},
      },
    },
  });
}
