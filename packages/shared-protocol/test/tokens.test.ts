import { describe, expect, it } from 'vitest';
import { CandidateJoinResponse, RealtimeJwtClaims } from '../src/tokens';

const INTERVIEW_ID = '11111111-2222-4333-8444-555555555555';

describe('RealtimeJwtClaims', () => {
  it('parses a well-formed JWT body', () => {
    const claims = RealtimeJwtClaims.parse({
      sub: 'user_123',
      interviewId: INTERVIEW_ID,
      role: 'candidate',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
    expect(claims.role).toBe('candidate');
  });

  it('rejects an unknown role', () => {
    const result = RealtimeJwtClaims.safeParse({
      sub: 'u',
      interviewId: INTERVIEW_ID,
      role: 'admin',
      iat: 1,
      exp: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects float exp/iat', () => {
    const result = RealtimeJwtClaims.safeParse({
      sub: 'u',
      interviewId: INTERVIEW_ID,
      role: 'candidate',
      iat: 1.5,
      exp: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe('CandidateJoinResponse', () => {
  it('parses a complete response', () => {
    const res = CandidateJoinResponse.parse({
      interviewId: INTERVIEW_ID,
      realtimeToken: 'eyJ...',
      realtimeWsUrl: 'wss://realtime.example.com',
      aiOrchestratorUrl: 'https://ai.example.com',
    });
    expect(res.realtimeToken).toBe('eyJ...');
  });

  it('rejects non-URL endpoints', () => {
    const result = CandidateJoinResponse.safeParse({
      interviewId: INTERVIEW_ID,
      realtimeToken: 'x',
      realtimeWsUrl: 'not-a-url',
      aiOrchestratorUrl: 'https://ai.example.com',
    });
    expect(result.success).toBe(false);
  });
});
