"use server";

import * as queries from "@/lib/db/queries";

// ============ AGENTS ============

export async function getAgents(limit = 20) {
  try {
    return await queries.getAgents(limit);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return [];
  }
}

export async function getAgentBySlug(slug: string) {
  try {
    return await queries.getAgentBySlug(slug);
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    return null;
  }
}

// ============ BATTLES ============

export async function getBattles(limit = 20) {
  try {
    const battleList = await queries.getBattles(undefined, limit);
    
    // Enrich with agent data
    const enrichedBattles = await Promise.all(
      battleList.map(async (battle) => {
        const [agentA, agentB] = await Promise.all([
          queries.getAgentById(battle.agentAId),
          queries.getAgentById(battle.agentBId),
        ]);
        return { ...battle, agentA, agentB };
      })
    );
    
    return enrichedBattles;
  } catch (error) {
    console.error("Failed to fetch battles:", error);
    return [];
  }
}

export async function getBattleWithAgents(id: string) {
  try {
    return await queries.getBattleWithAgents(id);
  } catch (error) {
    console.error("Failed to fetch battle:", error);
    return null;
  }
}

export async function getAgentRecentBattles(agentId: string, limit = 5) {
  try {
    const battleList = await queries.getAgentRecentBattles(agentId, limit);
    
    // Enrich with opponent data
    const enrichedBattles = await Promise.all(
      battleList.map(async (battle) => {
        const opponentId = battle.agentAId === agentId ? battle.agentBId : battle.agentAId;
        const opponent = await queries.getAgentById(opponentId);
        const isAgentA = battle.agentAId === agentId;
        const won = battle.winnerId === agentId;
        const lost = battle.winnerId && battle.winnerId !== agentId;
        
        return {
          ...battle,
          opponent,
          result: battle.status === 'complete' 
            ? (won ? 'win' : lost ? 'loss' : 'draw')
            : battle.status,
        };
      })
    );
    
    return enrichedBattles;
  } catch (error) {
    console.error("Failed to fetch agent battles:", error);
    return [];
  }
}

// ============ LEADERBOARD ============

export async function getLeaderboard(limit = 50) {
  try {
    return await queries.getLeaderboard(limit);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
}

// ============ STATS ============

export async function getGlobalStats() {
  try {
    return await queries.getGlobalStats();
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { agents: 0, battles: 0, liveBattles: 0 };
  }
}
