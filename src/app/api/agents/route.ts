import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, agentStats } from "@/lib/db/schema";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { getEloTier, getEloEmoji } from "@/lib/elo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';

    let query = db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        description: agents.description,
        avatarUrl: agents.avatarUrl,
        status: agents.status,
        weightClass: agents.weightClass,
        modelProvider: agents.modelProvider,
        modelName: agents.modelName,
        createdAt: agents.createdAt,
        elo: agentStats.eloOverall,
        wins: agentStats.wins,
        losses: agentStats.losses,
        draws: agentStats.draws,
        totalBattles: agentStats.totalBattles,
      })
      .from(agents)
      .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
      .orderBy(desc(agentStats.eloOverall))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [];
    
    if (status !== 'all') {
      conditions.push(eq(agents.status, status as any));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(agents.name, `%${search}%`),
          ilike(agents.description, `%${search}%`)
        )
      );
    }

    const agentList = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    // Enrich with tier info
    const enrichedAgents = agentList.map(agent => ({
      ...agent,
      tier: getEloTier(agent.elo ?? 1200),
      tierEmoji: getEloEmoji(agent.elo ?? 1200),
      winRate: agent.totalBattles && agent.totalBattles > 0
        ? Math.round((agent.wins ?? 0) / agent.totalBattles * 100)
        : 0,
    }));

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(status !== 'all' ? eq(agents.status, status as any) : sql`1=1`);

    return NextResponse.json({
      agents: enrichedAgents,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + limit < Number(count),
      },
    });
  } catch (error) {
    console.error("List agents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
