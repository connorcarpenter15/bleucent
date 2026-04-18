import { z } from 'zod';

/** JWT claims carried by the short-lived browser-facing realtime token. */
export const RealtimeJwtClaims = z.object({
  sub: z.string(),
  interviewId: z.string().uuid(),
  role: z.enum(['candidate', 'interviewer']),
  exp: z.number().int(),
  iat: z.number().int(),
});
export type RealtimeJwtClaims = z.infer<typeof RealtimeJwtClaims>;

/** Payload returned by the Next.js API to a candidate after exchanging a join token. */
export const CandidateJoinResponse = z.object({
  interviewId: z.string().uuid(),
  realtimeToken: z.string(),
  realtimeWsUrl: z.string().url(),
  aiOrchestratorUrl: z.string().url(),
});
export type CandidateJoinResponse = z.infer<typeof CandidateJoinResponse>;
