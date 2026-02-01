import { describe, it, expect } from 'vitest';
import {
  validateAgentName,
  validateResponse,
  validateApiKey,
  validateUUID,
  validateBattleFormat,
  validateStakeLevel,
  slugify,
} from './validation';

describe('validateAgentName', () => {
  it('accepts valid names', () => {
    expect(validateAgentName('TestBot')).toEqual({ valid: true });
    expect(validateAgentName('My Agent 2000')).toEqual({ valid: true });
    expect(validateAgentName("O'Reilly Bot")).toEqual({ valid: true });
    expect(validateAgentName('Agent-X_1')).toEqual({ valid: true });
  });

  it('rejects empty or missing names', () => {
    expect(validateAgentName('')).toHaveProperty('valid', false);
    expect(validateAgentName(null)).toHaveProperty('valid', false);
    expect(validateAgentName(undefined)).toHaveProperty('valid', false);
  });

  it('rejects names that are too short', () => {
    expect(validateAgentName('A')).toHaveProperty('valid', false);
    expect(validateAgentName('A').error).toContain('at least 2');
  });

  it('rejects names that are too long', () => {
    const longName = 'A'.repeat(101);
    expect(validateAgentName(longName)).toHaveProperty('valid', false);
    expect(validateAgentName(longName).error).toContain('100 characters');
  });

  it('rejects names with invalid characters', () => {
    expect(validateAgentName('Bot<script>')).toHaveProperty('valid', false);
    expect(validateAgentName('Bot@evil')).toHaveProperty('valid', false);
    expect(validateAgentName('Bot;DROP TABLE')).toHaveProperty('valid', false);
  });
});

describe('validateResponse', () => {
  it('accepts valid responses', () => {
    expect(validateResponse('This is a valid response.')).toEqual({ valid: true });
    expect(validateResponse('A'.repeat(10000))).toEqual({ valid: true });
  });

  it('rejects empty or missing responses', () => {
    expect(validateResponse('')).toHaveProperty('valid', false);
    expect(validateResponse(null)).toHaveProperty('valid', false);
  });

  it('rejects responses that are too short', () => {
    expect(validateResponse('Too short')).toHaveProperty('valid', false);
    expect(validateResponse('123456789')).toHaveProperty('valid', false); // 9 chars
  });

  it('rejects responses that are too long', () => {
    const longResponse = 'A'.repeat(10001);
    expect(validateResponse(longResponse)).toHaveProperty('valid', false);
  });
});

describe('validateApiKey', () => {
  it('accepts valid API keys', () => {
    const validKey = 'pit_' + 'a'.repeat(64);
    expect(validateApiKey(validKey)).toEqual({ valid: true });
  });

  it('rejects missing keys', () => {
    expect(validateApiKey('')).toHaveProperty('valid', false);
    expect(validateApiKey(null)).toHaveProperty('valid', false);
  });

  it('rejects keys with wrong prefix', () => {
    const wrongPrefix = 'api_' + 'a'.repeat(64);
    expect(validateApiKey(wrongPrefix)).toHaveProperty('valid', false);
    expect(validateApiKey(wrongPrefix).error).toContain('format');
  });

  it('rejects keys with wrong length', () => {
    const shortKey = 'pit_' + 'a'.repeat(32);
    expect(validateApiKey(shortKey)).toHaveProperty('valid', false);
  });
});

describe('validateUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toEqual({ valid: true });
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toEqual({ valid: true });
  });

  it('rejects invalid UUIDs', () => {
    expect(validateUUID('not-a-uuid')).toHaveProperty('valid', false);
    expect(validateUUID('123')).toHaveProperty('valid', false);
    expect(validateUUID('')).toHaveProperty('valid', false);
  });
});

describe('validateBattleFormat', () => {
  it('accepts valid formats', () => {
    expect(validateBattleFormat('debate')).toEqual({ valid: true });
    expect(validateBattleFormat('roast')).toEqual({ valid: true });
    expect(validateBattleFormat('code')).toEqual({ valid: true });
    expect(validateBattleFormat('creative')).toEqual({ valid: true });
  });

  it('accepts empty/null (optional field)', () => {
    expect(validateBattleFormat('')).toEqual({ valid: true });
    expect(validateBattleFormat(null)).toEqual({ valid: true });
  });

  it('rejects invalid formats', () => {
    expect(validateBattleFormat('trivia')).toHaveProperty('valid', false);
    expect(validateBattleFormat('fighting')).toHaveProperty('valid', false);
  });
});

describe('validateStakeLevel', () => {
  it('accepts valid stake levels', () => {
    expect(validateStakeLevel('casual')).toEqual({ valid: true });
    expect(validateStakeLevel('deathmatch')).toEqual({ valid: true });
  });

  it('accepts empty/null (optional field)', () => {
    expect(validateStakeLevel('')).toEqual({ valid: true });
    expect(validateStakeLevel(null)).toEqual({ valid: true });
  });

  it('rejects invalid levels', () => {
    expect(validateStakeLevel('extreme')).toHaveProperty('valid', false);
  });
});

describe('slugify', () => {
  it('converts names to slugs', () => {
    expect(slugify('Test Bot')).toBe('test-bot');
    expect(slugify('MyAgent2000')).toBe('myagent2000');
    expect(slugify('  Spaces  ')).toBe('spaces');
  });

  it('handles special characters', () => {
    expect(slugify("O'Reilly")).toBe('o-reilly');
    expect(slugify('Bot@2000!')).toBe('bot-2000');
  });

  it('removes leading/trailing dashes', () => {
    expect(slugify('---test---')).toBe('test');
  });
});
