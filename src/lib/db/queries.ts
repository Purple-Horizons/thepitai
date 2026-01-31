import { db } from './index';
import { agents, agentStats, battles, battleRounds, votes, debateTopics, users } from './schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';

// ============ AGENTS ============

export async function getAgents(limit = 20) {
  return db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      description: agents.description,
      avatarUrl: agents.avatarUrl,
      status: agents.status,
      weightClass: agents.weightClass,
      createdAt: agents.createdAt,
      elo: agentStats.eloOverall,
      wins: agentStats.wins,
      losses: agentStats.losses,
      draws: agentStats.draws,
      totalBattles: agentStats.totalBattles,
    })
    .from(agents)
    .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
    .where(eq(agents.status, 'active'))
    .orderBy(desc(agentStats.eloOverall))
    .limit(limit);
}

export async function getAgentBySlug(slug: string) {
  const result = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      description: agents.description,
      persona: agents.persona,
      avatarUrl: agents.avatarUrl,
      status: agents.status,
      weightClass: agents.weightClass,
      endpointType: agents.endpointType,
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
    .where(eq(agents.slug, slug))
    .limit(1);
  
  return result[0] || null;
}

export async function getAgentById(id: string) {
  const result = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      description: agents.description,
      avatarUrl: agents.avatarUrl,
      elo: agentStats.eloOverall,
    })
    .from(agents)
    .leftJoin(agentStats, eq(agents.id, agentStats.agentId))
    .where(eq(agents.id, id))
    .limit(1);
  
  return result[0] || null;
}

// ============ LEADERBOARD ============

export async function getLeaderboard(limit = 50) {
  return db
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
    .limit(limit);
}

// ============ BATTLES ============

export async function getBattles(status?: string, limit = 20) {
  const baseQuery = db
    .select({
      id: battles.id,
      topic: battles.topic,
      format: battles.format,
      status: battles.status,
      currentRound: battles.currentRound,
      totalRounds: battles.totalRounds,
      crowdVotesA: battles.crowdVotesA,
      crowdVotesB: battles.crowdVotesB,
      createdAt: battles.createdAt,
      startedAt: battles.startedAt,
      agentAId: battles.agentAId,
      agentBId: battles.agentBId,
      winnerId: battles.winnerId,
    })
    .from(battles)
    .orderBy(desc(battles.createdAt))
    .limit(limit);

  if (status) {
    return baseQuery.where(eq(battles.status, status as any));
  }
  return baseQuery;
}

export async function getBattleById(id: string) {
  const result = await db
    .select()
    .from(battles)
    .where(eq(battles.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getBattleWithAgents(id: string) {
  const battle = await getBattleById(id);
  if (!battle) return null;

  const [agentA, agentB, rounds] = await Promise.all([
    getAgentById(battle.agentAId),
    getAgentById(battle.agentBId),
    getBattleRounds(id),
  ]);

  return {
    ...battle,
    agentA,
    agentB,
    rounds,
  };
}

export async function getBattleRounds(battleId: string) {
  return db
    .select()
    .from(battleRounds)
    .where(eq(battleRounds.battleId, battleId))
    .orderBy(battleRounds.roundNumber);
}

export async function getAgentRecentBattles(agentId: string, limit = 5) {
  return db
    .select({
      id: battles.id,
      topic: battles.topic,
      status: battles.status,
      winnerId: battles.winnerId,
      agentAId: battles.agentAId,
      agentBId: battles.agentBId,
      createdAt: battles.createdAt,
    })
    .from(battles)
    .where(
      or(
        eq(battles.agentAId, agentId),
        eq(battles.agentBId, agentId)
      )
    )
    .orderBy(desc(battles.createdAt))
    .limit(limit);
}

// ============ TOPICS ============

export async function getRandomTopic() {
  const topics = await db
    .select()
    .from(debateTopics)
    .where(eq(debateTopics.isActive, true));
  
  if (topics.length === 0) return null;
  return topics[Math.floor(Math.random() * topics.length)];
}

// ============ STATS ============

export async function getGlobalStats() {
  const [agentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agents)
    .where(eq(agents.status, 'active'));

  const [battleCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(battles);

  const [liveBattleCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(battles)
    .where(eq(battles.status, 'in_progress'));

  return {
    agents: Number(agentCount?.count || 0),
    battles: Number(battleCount?.count || 0),
    liveBattles: Number(liveBattleCount?.count || 0),
  };
}
