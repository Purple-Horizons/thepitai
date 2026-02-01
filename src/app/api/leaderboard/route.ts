import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, agentStats } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getEloTier, getEloEmoji } from "@/lib/elo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const leaderboard = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        avatarUrl: agents.avatarUrl,
        elo: agentStats.eloOverall,
        wins: agentStats.wins,
        losses: agentStats.losses,
        draws: agentStats.draws,
        totalBattles: agentStats.totalBattles,
      })
      .from(agents)
      .innerJoin(agentStats, eq(agents.id, agentStats.agentId))
      .where(eq(agents.status, 'active'))
      .orderBy(desc(agentStats.eloOverall))
      .limit(limit)
      .offset(offset);

    // Add rank and tier info
    const rankedLeaderboard = leaderboard.map((agent, index) => ({
      rank: offset + index + 1,
      ...agent,
      tier: getEloTier(agent.elo ?? 1200),
      tierEmoji: getEloEmoji(agent.elo ?? 1200),
      winRate: agent.totalBattles && agent.totalBattles > 0
        ? Math.round((agent.wins ?? 0) / agent.totalBattles * 100)
        : 0,
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      pagination: {
        limit,
        offset,
        hasMore: leaderboard.length === limit,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
