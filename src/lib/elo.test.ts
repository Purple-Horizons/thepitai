import { describe, it, expect } from 'vitest';
import { 
  calculateEloChange, 
  expectedScore, 
  getEloTier, 
  getEloEmoji,
  K_FACTOR 
} from './elo';

describe('ELO Calculations', () => {
  describe('expectedScore', () => {
    it('returns 0.5 for equal ratings', () => {
      const score = expectedScore(1200, 1200);
      expect(score).toBeCloseTo(0.5, 2);
    });

    it('returns higher score for higher-rated player', () => {
      const score = expectedScore(1400, 1200);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(1);
    });

    it('returns lower score for lower-rated player', () => {
      const score = expectedScore(1000, 1200);
      expect(score).toBeLessThan(0.5);
      expect(score).toBeGreaterThan(0);
    });

    it('complements to 1 for both players', () => {
      const scoreA = expectedScore(1300, 1100);
      const scoreB = expectedScore(1100, 1300);
      expect(scoreA + scoreB).toBeCloseTo(1, 5);
    });
  });

  describe('calculateEloChange', () => {
    it('calculates equal change for equal ratings', () => {
      const result = calculateEloChange(1200, 1200);
      expect(result.winnerGain).toBe(16); // K/2 for 50% expected
      expect(result.loserLoss).toBe(16);
      expect(result.newWinnerElo).toBe(1216);
      expect(result.newLoserElo).toBe(1184);
    });

    it('gives smaller gain for upset (lower beats higher)', () => {
      const upset = calculateEloChange(1000, 1400); // 1000 beats 1400
      const expected = calculateEloChange(1400, 1000); // 1400 beats 1000
      
      // Upset winner gains more
      expect(upset.winnerGain).toBeGreaterThan(expected.winnerGain);
    });

    it('respects custom K-factor', () => {
      const defaultK = calculateEloChange(1200, 1200, K_FACTOR);
      const doubleK = calculateEloChange(1200, 1200, K_FACTOR * 2);
      
      expect(doubleK.winnerGain).toBe(defaultK.winnerGain * 2);
    });

    it('winner gain and loser loss are complementary', () => {
      const result = calculateEloChange(1500, 1300);
      // Due to rounding, they may not be exactly equal but should be close
      expect(Math.abs(result.winnerGain - result.loserLoss)).toBeLessThanOrEqual(1);
    });

    it('handles extreme rating differences', () => {
      const result = calculateEloChange(2000, 800);
      // Very high rated player beating very low rated gains almost nothing
      expect(result.winnerGain).toBeGreaterThanOrEqual(0);
      expect(result.winnerGain).toBeLessThanOrEqual(5);
      // When winner expected ~99%, both changes are small due to rounding
      expect(result.loserLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getEloTier', () => {
    it('returns Champion for 1800+', () => {
      expect(getEloTier(1800)).toBe('Champion');
      expect(getEloTier(2000)).toBe('Champion');
    });

    it('returns Diamond for 1500-1799', () => {
      expect(getEloTier(1500)).toBe('Diamond');
      expect(getEloTier(1799)).toBe('Diamond');
    });

    it('returns Gold for 1300-1499', () => {
      expect(getEloTier(1300)).toBe('Gold');
      expect(getEloTier(1499)).toBe('Gold');
    });

    it('returns Silver for 1100-1299', () => {
      expect(getEloTier(1100)).toBe('Silver');
      expect(getEloTier(1299)).toBe('Silver');
    });

    it('returns Bronze for below 1100', () => {
      expect(getEloTier(1099)).toBe('Bronze');
      expect(getEloTier(800)).toBe('Bronze');
    });
  });

  describe('getEloEmoji', () => {
    it('returns correct emoji for each tier', () => {
      expect(getEloEmoji(1800)).toBe('🏆');
      expect(getEloEmoji(1500)).toBe('💎');
      expect(getEloEmoji(1300)).toBe('🥇');
      expect(getEloEmoji(1100)).toBe('🥈');
      expect(getEloEmoji(1000)).toBe('🥉');
    });
  });
});

describe('ELO System Properties', () => {
  it('starting ELO of 1200 is Silver tier', () => {
    expect(getEloTier(1200)).toBe('Silver');
  });

  it('10 consecutive wins against equal opponents promotes tier', () => {
    let elo = 1200;
    for (let i = 0; i < 10; i++) {
      const result = calculateEloChange(elo, 1200);
      elo = result.newWinnerElo;
    }
    // After 10 wins, should be in Gold
    expect(getEloTier(elo)).toBe('Gold');
  });

  it('convergence: weaker player eventually catches up', () => {
    let strongElo = 1400;
    let weakElo = 1000;
    
    // Simulate 20 games where they trade wins
    for (let i = 0; i < 10; i++) {
      // Strong wins
      let result = calculateEloChange(strongElo, weakElo);
      strongElo = result.newWinnerElo;
      weakElo = result.newLoserElo;
      
      // Weak wins (upset)
      result = calculateEloChange(weakElo, strongElo);
      weakElo = result.newWinnerElo;
      strongElo = result.newLoserElo;
    }
    
    // Ratings should converge toward each other
    expect(Math.abs(strongElo - weakElo)).toBeLessThan(400);
  });
});
