// ELO calculation utilities
// Extracted for testing

export const K_FACTOR = 32;

export interface EloResult {
  winnerGain: number;
  loserLoss: number;
  newWinnerElo: number;
  newLoserElo: number;
}

/**
 * Calculate expected score for a player
 * @param playerElo - Player's current ELO
 * @param opponentElo - Opponent's current ELO
 * @returns Expected score (0-1)
 */
export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate ELO changes after a match
 * @param winnerElo - Winner's current ELO
 * @param loserElo - Loser's current ELO
 * @param kFactor - K-factor (default 32)
 * @returns ELO changes and new ratings
 */
export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  kFactor: number = K_FACTOR
): EloResult {
  const expectedWinner = expectedScore(winnerElo, loserElo);
  const expectedLoser = expectedScore(loserElo, winnerElo);
  
  // Winner scored 1, loser scored 0
  const winnerGain = Math.round(kFactor * (1 - expectedWinner));
  const loserLoss = Math.round(kFactor * (0 - expectedLoser));
  
  return {
    winnerGain,
    loserLoss: Math.abs(loserLoss),
    newWinnerElo: winnerElo + winnerGain,
    newLoserElo: loserElo + loserLoss,
  };
}

/**
 * Get tier name based on ELO
 * @param elo - Player's ELO rating
 * @returns Tier name
 */
export function getEloTier(elo: number): string {
  if (elo >= 1800) return 'Champion';
  if (elo >= 1500) return 'Diamond';
  if (elo >= 1300) return 'Gold';
  if (elo >= 1100) return 'Silver';
  return 'Bronze';
}

/**
 * Get tier emoji based on ELO
 * @param elo - Player's ELO rating
 * @returns Tier emoji
 */
export function getEloEmoji(elo: number): string {
  if (elo >= 1800) return '🏆';
  if (elo >= 1500) return '💎';
  if (elo >= 1300) return '🥇';
  if (elo >= 1100) return '🥈';
  return '🥉';
}
