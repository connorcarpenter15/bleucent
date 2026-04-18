'use client';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const NEXT_PUBLIC_REALTIME_WS_URL =
  process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? 'ws://localhost:4000';

/**
 * Connects to the Rust realtime server's `/yjs/{interviewId}` endpoint using
 * the standard y-websocket protocol. Returns the doc + provider once ready.
 *
 * The realtime token is appended as a `?token=` query param; the Rust server
 * validates it on upgrade.
 */
export function useYjsRoom(interviewId: string, token: string | null) {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!token) return;
    const url = `${NEXT_PUBLIC_REALTIME_WS_URL}/yjs`;
    const wsProvider = new WebsocketProvider(url, interviewId, doc, {
      params: { token },
    });
    wsProvider.on('sync', (isSynced: boolean) => setSynced(isSynced));
    setProvider(wsProvider);
    return () => {
      wsProvider.destroy();
    };
  }, [doc, interviewId, token]);

  return { doc, provider, synced };
}

/** Connects to `/events/{interviewId}` with the same token. JSON event objects
 * are dispatched via the supplied callback, and `send` lets the caller publish. */
export function useEventsChannel(
  interviewId: string,
  token: string | null,
  onEvent: (event: unknown) => void,
) {
  const [send, setSend] = useState<(payload: unknown) => void>(() => () => {});

  useEffect(() => {
    if (!token) return;
    const url = `${NEXT_PUBLIC_REALTIME_WS_URL}/events/${interviewId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      setSend(() => (payload: unknown) => {
        try {
          ws.send(JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      });
    };
    ws.onmessage = (msg) => {
      try {
        const text =
          typeof msg.data === 'string'
            ? msg.data
            : new TextDecoder().decode(msg.data as ArrayBuffer);
        onEvent(JSON.parse(text));
      } catch {
        /* ignore malformed event */
      }
    };
    return () => ws.close();
  }, [interviewId, token, onEvent]);

  return send;
}
