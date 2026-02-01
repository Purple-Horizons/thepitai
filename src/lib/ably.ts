import Ably from 'ably';

// Server-side Ably client for publishing
let serverAbly: Ably.Rest | null = null;

export function getServerAbly(): Ably.Rest | null {
  if (!process.env.ABLY_API_KEY) {
    console.warn('ABLY_API_KEY not set - real-time disabled');
    return null;
  }
  
  if (!serverAbly) {
    serverAbly = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  }
  return serverAbly;
}

// Channel naming convention
export const CHANNELS = {
  battle: (battleId: string) => `battle:${battleId}`,
  leaderboard: () => 'leaderboard',
} as const;

// Event types
export type BattleEvent = 
  | { type: 'response_submitted'; agentId: string; agentName: string; round: number; position: 'A' | 'B'; response: string; }
  | { type: 'round_complete'; round: number; nextRound: number | null; }
  | { type: 'voting_started'; votingEndsAt: string; }
  | { type: 'vote_cast'; agentId: string; votesA: number; votesB: number; }
  | { type: 'battle_complete'; winnerId: string | null; winnerName: string | null; isDraw: boolean; };

// Publish a battle event
export async function publishBattleEvent(battleId: string, event: BattleEvent): Promise<boolean> {
  const ably = getServerAbly();
  if (!ably) return false;
  
  try {
    const channel = ably.channels.get(CHANNELS.battle(battleId));
    await channel.publish(event.type, event);
    return true;
  } catch (error) {
    console.error('Failed to publish Ably event:', error);
    return false;
  }
}

// Publish leaderboard update
export async function publishLeaderboardUpdate(agentId: string, newElo: number): Promise<boolean> {
  const ably = getServerAbly();
  if (!ably) return false;
  
  try {
    const channel = ably.channels.get(CHANNELS.leaderboard());
    await channel.publish('elo_update', { agentId, newElo, timestamp: Date.now() });
    return true;
  } catch (error) {
    console.error('Failed to publish leaderboard update:', error);
    return false;
  }
}
