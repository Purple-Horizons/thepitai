import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, agentStats, battles } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getEloTier, getEloEmoji } from "@/lib/elo";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Try to find by slug first, then by ID
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        description: agents.description,
        persona: agents.persona,
        avatarUrl: agents.avatarUrl,
        status: agents.status,
        weightClass: agents.weightClass,
        modelProvider: agents.modelProvider,
        modelName: agents.modelName,
        endpointType: agents.endpointType,
        createdAt: agents.createdAt,
        elo: agentStats.eloOverall,
        wins: agentStats.wins,
        losses: agentStats.losses,
        draws: agentStats.draws,
        totalBattles: agentStats.totalBattles,
      })
      .from(agents)
      .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
      .where(or(eq(agents.slug, slug), eq(agents.id, slug)))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get recent battles
    const recentBattles = await db
      .select({
        id: battles.id,
        topic: battles.topic,
        status: battles.status,
        format: battles.format,
        winnerId: battles.winnerId,
        agentAId: battles.agentAId,
        agentBId: battles.agentBId,
        crowdVotesA: battles.crowdVotesA,
        crowdVotesB: battles.crowdVotesB,
        createdAt: battles.createdAt,
      })
      .from(battles)
      .where(or(eq(battles.agentAId, agent.id), eq(battles.agentBId, agent.id)))
      .orderBy(desc(battles.createdAt))
      .limit(10);

    // Determine win/loss for each battle
    const battlesWithResult = recentBattles.map(battle => {
      const isAgentA = battle.agentAId === agent.id;
      let result: 'win' | 'loss' | 'draw' | 'pending' = 'pending';
      
      if (battle.status === 'complete') {
        if (battle.winnerId === agent.id) {
          result = 'win';
        } else if (battle.winnerId === null) {
          result = 'draw';
        } else {
          result = 'loss';
        }
      }

      return {
        id: battle.id,
        topic: battle.topic,
        status: battle.status,
        format: battle.format,
        result,
        position: isAgentA ? 'A' : 'B',
        votes: isAgentA ? battle.crowdVotesA : battle.crowdVotesB,
        opponentVotes: isAgentA ? battle.crowdVotesB : battle.crowdVotesA,
        createdAt: battle.createdAt,
      };
    });

    return NextResponse.json({
      agent: {
        ...agent,
        tier: getEloTier(agent.elo ?? 1200),
        tierEmoji: getEloEmoji(agent.elo ?? 1200),
        winRate: agent.totalBattles && agent.totalBattles > 0
          ? Math.round((agent.wins ?? 0) / agent.totalBattles * 100)
          : 0,
      },
      recentBattles: battlesWithResult,
    });
  } catch (error) {
    console.error("Get agent error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}
