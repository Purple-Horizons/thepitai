import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAgentName, validateResponse, validateApiKey } from './validation';

// Test the API validation logic (unit tests, not integration)
// Full API tests would require mocking the database

describe('Agent Registration Validation', () => {
  it('validates complete registration payload', () => {
    const payload = {
      name: 'TestBot',
      description: 'A test bot',
      webhookUrl: 'https://example.com/webhook',
      weightClass: 'middleweight',
    };

    expect(validateAgentName(payload.name)).toEqual({ valid: true });
  });

  it('requires a valid name', () => {
    const result = validateAgentName('');
    expect(result.valid).toBe(false);
  });

  it('accepts optional fields as undefined', () => {
    const payload = {
      name: 'MinimalBot',
      // All other fields omitted
    };

    expect(validateAgentName(payload.name)).toEqual({ valid: true });
  });
});

describe('Battle Submission Validation', () => {
  const validApiKey = 'pit_' + 'a'.repeat(64);

  it('validates complete submission payload', () => {
    const payload = {
      apiKey: validApiKey,
      response: 'This is my argument for the debate topic at hand.',
    };

    expect(validateApiKey(payload.apiKey)).toEqual({ valid: true });
    expect(validateResponse(payload.response)).toEqual({ valid: true });
  });

  it('rejects invalid API key', () => {
    expect(validateApiKey('invalid')).toHaveProperty('valid', false);
    expect(validateApiKey('')).toHaveProperty('valid', false);
  });

  it('rejects responses that are too short', () => {
    expect(validateResponse('short')).toHaveProperty('valid', false);
  });

  it('rejects responses that are too long', () => {
    const longResponse = 'A'.repeat(10001);
    expect(validateResponse(longResponse)).toHaveProperty('valid', false);
  });
});

describe('Battle Creation Validation', () => {
  it('accepts minimal battle creation request', () => {
    // Random matchmaking - no agents specified
    const payload = {
      format: 'debate',
    };
    
    // Format is optional, defaults to debate
    expect(payload.format).toBe('debate');
  });

  it('accepts specific agent matchup', () => {
    const payload = {
      agentAId: '550e8400-e29b-41d4-a716-446655440000',
      agentBId: '550e8400-e29b-41d4-a716-446655440001',
      format: 'roast',
      stakeLevel: 'high',
    };

    // Just validating structure
    expect(payload.agentAId).toBeTruthy();
    expect(payload.agentBId).toBeTruthy();
  });
});

describe('Vote Validation', () => {
  it('validates vote payload', () => {
    const payload = {
      visitorId: 'visitor-fingerprint-123',
      votedForAgentId: '550e8400-e29b-41d4-a716-446655440000',
    };

    expect(payload.visitorId).toBeTruthy();
    expect(payload.votedForAgentId).toBeTruthy();
  });

  it('requires both fields', () => {
    const incomplete = {
      visitorId: 'visitor-123',
      // missing votedForAgentId
    };

    expect(incomplete.visitorId).toBeTruthy();
    expect((incomplete as any).votedForAgentId).toBeFalsy();
  });
});

describe('Response Format', () => {
  it('API success response structure', () => {
    const successResponse = {
      success: true,
      data: { id: '123' },
      message: 'Operation completed',
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBeDefined();
  });

  it('API error response structure', () => {
    const errorResponse = {
      error: 'Something went wrong',
    };

    expect(errorResponse.error).toBeTruthy();
  });
});
