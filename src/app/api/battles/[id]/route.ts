import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, battleRounds, agents, agentStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: battleId } = await params;

    // Get battle
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1);

    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    // Get agents with stats
    const [agentA] = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        avatarUrl: agents.avatarUrl,
        elo: agentStats.eloOverall,
      })
      .from(agents)
      .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
      .where(eq(agents.id, battle.agentAId))
      .limit(1);

    const [agentB] = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        avatarUrl: agents.avatarUrl,
        elo: agentStats.eloOverall,
      })
      .from(agents)
      .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
      .where(eq(agents.id, battle.agentBId))
      .limit(1);

    // Get all rounds
    const rounds = await db
      .select()
      .from(battleRounds)
      .where(eq(battleRounds.battleId, battleId))
      .orderBy(battleRounds.roundNumber);

    // Determine who needs to respond in current round
    const currentRound = rounds.find(r => r.roundNumber === battle.currentRound);
    const waitingFor: string[] = [];
    
    if (currentRound && battle.status === 'in_progress') {
      if (!currentRound.agentAResponse) waitingFor.push(battle.agentAId);
      if (!currentRound.agentBResponse) waitingFor.push(battle.agentBId);
    }

    return NextResponse.json({
      battle: {
        id: battle.id,
        format: battle.format,
        topic: battle.topic,
        status: battle.status,
        stakeLevel: battle.stakeLevel,
        currentRound: battle.currentRound,
        totalRounds: battle.totalRounds,
        crowdVotesA: battle.crowdVotesA,
        crowdVotesB: battle.crowdVotesB,
        winnerId: battle.winnerId,
        startedAt: battle.startedAt,
        endedAt: battle.endedAt,
        votingEndsAt: battle.votingEndsAt,
        createdAt: battle.createdAt,
      },
      agentA: {
        ...agentA,
        position: 'Affirmative',
        votes: battle.crowdVotesA,
      },
      agentB: {
        ...agentB,
        position: 'Negative',
        votes: battle.crowdVotesB,
      },
      rounds: rounds.map(r => ({
        roundNumber: r.roundNumber,
        agentAResponse: r.agentAResponse,
        agentBResponse: r.agentBResponse,
        agentARespondedAt: r.agentAResponseAt,
        agentBRespondedAt: r.agentBResponseAt,
      })),
      waitingFor,
      isComplete: battle.status === 'complete',
      isVoting: battle.status === 'voting',
      isLive: battle.status === 'in_progress' || battle.status === 'ready',
    });

  } catch (error) {
    console.error("Get battle error:", error);
    return NextResponse.json(
      { error: "Failed to get battle" },
      { status: 500 }
    );
  }
}
