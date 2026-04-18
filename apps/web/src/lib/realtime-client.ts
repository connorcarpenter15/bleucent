import { env } from './env';

/** Thin client for service-to-service calls to the Rust realtime server. */

export async function endRealtimeSession(interviewId: string): Promise<void> {
  const res = await fetch(`${env().REALTIME_SERVER_URL}/internal/end/${interviewId}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`realtime end webhook returned ${res.status}`);
  }
}
