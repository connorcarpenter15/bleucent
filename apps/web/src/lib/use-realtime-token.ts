'use client';
import { useEffect, useState } from 'react';

/** Fetches a fresh realtime JWT for the given interview. Used by the Yjs and
 * telemetry websocket clients in the candidate + God Mode workspaces. */
export function useRealtimeToken(interviewId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      try {
        const res = await fetch(`/api/interviews/${interviewId}/realtime-token`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
        const json = (await res.json()) as { token: string };
        if (!cancelled) setToken(json.token);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }
    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  return { token, error };
}
