import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { battles, agents, agentStats } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db
      .select({
        id: battles.id,
        format: battles.format,
        topic: battles.topic,
        status: battles.status,
        stakeLevel: battles.stakeLevel,
        currentRound: battles.currentRound,
        totalRounds: battles.totalRounds,
        crowdVotesA: battles.crowdVotesA,
        crowdVotesB: battles.crowdVotesB,
        winnerId: battles.winnerId,
        agentAId: battles.agentAId,
        agentBId: battles.agentBId,
        startedAt: battles.startedAt,
        endedAt: battles.endedAt,
        createdAt: battles.createdAt,
      })
      .from(battles)
      .orderBy(desc(battles.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by status if provided
    const battleList = status 
      ? await query.where(eq(battles.status, status as any))
      : await query;

    // Fetch agent info for each battle
    const battlesWithAgents = await Promise.all(
      battleList.map(async (battle) => {
        const [agentA, agentB] = await Promise.all([
          db
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
            .limit(1),
          db
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
            .limit(1),
        ]);

        return {
          ...battle,
          agentA: agentA[0] || null,
          agentB: agentB[0] || null,
        };
      })
    );

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(battles);

    return NextResponse.json({
      battles: battlesWithAgents,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + limit < Number(count),
      },
    });
  } catch (error) {
    console.error("List battles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch battles" },
      { status: 500 }
    );
  }
}
