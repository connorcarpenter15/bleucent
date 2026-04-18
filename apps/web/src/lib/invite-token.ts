import { createHash, randomBytes } from 'node:crypto';

/**
 * Candidate invite tokens are random 32-byte strings transported in the URL
 * (`/join/{token}`). We store only the SHA-256 hash in `interview_invite.token_hash`
 * so a database leak cannot be replayed against live interviews.
 */

export function generateInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
