import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, votes, agentStats } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Simple ELO calculation
function calculateEloChange(winnerElo: number, loserElo: number, k = 32): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(k * (1 - expectedWinner));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: battleId } = await params;
    const body = await request.json();
    const { votedForAgentId, visitorId } = body;

    if (!votedForAgentId) {
      return NextResponse.json(
        { error: "votedForAgentId is required" },
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

    if (battle.status !== 'voting') {
      return NextResponse.json(
        { error: "Battle is not in voting phase" },
        { status: 400 }
      );
    }

    // Verify vote is for one of the battle participants
    if (votedForAgentId !== battle.agentAId && votedForAgentId !== battle.agentBId) {
      return NextResponse.json(
        { error: "Invalid agent to vote for" },
        { status: 400 }
      );
    }

    // For MVP: Use anonymous voting with simple vote counting
    // Update vote counts directly on the battle
    const isVoteForA = votedForAgentId === battle.agentAId;
    
    if (isVoteForA) {
      await db.update(battles)
        .set({ crowdVotesA: (battle.crowdVotesA || 0) + 1 })
        .where(eq(battles.id, battleId));
    } else {
      await db.update(battles)
        .set({ crowdVotesB: (battle.crowdVotesB || 0) + 1 })
        .where(eq(battles.id, battleId));
    }

    // Get updated vote counts
    const [updatedBattle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Vote recorded!",
      votes: {
        agentA: updatedBattle.crowdVotesA || 0,
        agentB: updatedBattle.crowdVotesB || 0,
      },
    });

  } catch (error) {
    console.error("Voting error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

// Endpoint to finalize voting and declare winner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: battleId } = await params;

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

    if (battle.status !== 'voting') {
      return NextResponse.json(
        { error: "Battle is not in voting phase" },
        { status: 400 }
      );
    }

    // Determine winner
    const votesA = battle.crowdVotesA || 0;
    const votesB = battle.crowdVotesB || 0;

    let winnerId: string | null = null;
    let isDraw = false;

    if (votesA > votesB) {
      winnerId = battle.agentAId;
    } else if (votesB > votesA) {
      winnerId = battle.agentBId;
    } else {
      isDraw = true;
    }

    // Update battle status
    await db.update(battles)
      .set({ 
        status: 'complete',
        winnerId,
        endedAt: new Date(),
      })
      .where(eq(battles.id, battleId));

    // Update ELO ratings
    const [statsA] = await db.select().from(agentStats).where(eq(agentStats.agentId, battle.agentAId)).limit(1);
    const [statsB] = await db.select().from(agentStats).where(eq(agentStats.agentId, battle.agentBId)).limit(1);

    const eloA = statsA?.eloOverall || 1200;
    const eloB = statsB?.eloOverall || 1200;

    if (isDraw) {
      // Small ELO changes for draw
      await db.update(agentStats)
        .set({ 
          totalBattles: (statsA?.totalBattles || 0) + 1,
          draws: (statsA?.draws || 0) + 1,
        })
        .where(eq(agentStats.agentId, battle.agentAId));

      await db.update(agentStats)
        .set({ 
          totalBattles: (statsB?.totalBattles || 0) + 1,
          draws: (statsB?.draws || 0) + 1,
        })
        .where(eq(agentStats.agentId, battle.agentBId));
    } else {
      const eloChange = calculateEloChange(
        winnerId === battle.agentAId ? eloA : eloB,
        winnerId === battle.agentAId ? eloB : eloA
      );

      // Winner gains ELO
      const winnerIsA = winnerId === battle.agentAId;
      await db.update(agentStats)
        .set({ 
          eloOverall: eloA + (winnerIsA ? eloChange : -eloChange),
          eloDebate: eloA + (winnerIsA ? eloChange : -eloChange),
          totalBattles: (statsA?.totalBattles || 0) + 1,
          wins: (statsA?.wins || 0) + (winnerIsA ? 1 : 0),
          losses: (statsA?.losses || 0) + (winnerIsA ? 0 : 1),
        })
        .where(eq(agentStats.agentId, battle.agentAId));

      await db.update(agentStats)
        .set({ 
          eloOverall: eloB + (winnerIsA ? -eloChange : eloChange),
          eloDebate: eloB + (winnerIsA ? -eloChange : eloChange),
          totalBattles: (statsB?.totalBattles || 0) + 1,
          wins: (statsB?.wins || 0) + (winnerIsA ? 0 : 1),
          losses: (statsB?.losses || 0) + (winnerIsA ? 1 : 0),
        })
        .where(eq(agentStats.agentId, battle.agentBId));
    }

    return NextResponse.json({
      success: true,
      message: isDraw ? "Battle ended in a draw!" : "Battle complete! Winner declared.",
      result: {
        winnerId,
        isDraw,
        finalVotes: { agentA: votesA, agentB: votesB },
      },
    });

  } catch (error) {
    console.error("Finalize voting error:", error);
    return NextResponse.json(
      { error: "Failed to finalize voting" },
      { status: 500 }
    );
  }
}
