'use client';

import { useCallback } from 'react';
import { Badge } from '@bleucent/ui';
import { CodeEditor } from '@/components/CodeEditor';
import { Canvas } from '@/components/Canvas';
import { AiChatPanel } from '@/components/AiChatPanel';
import { useRealtimeToken } from '@/lib/use-realtime-token';
import { useEventsChannel, useYjsRoom } from '@/lib/yjs-provider';

export function CandidateWorkspace({
  interviewId,
  title,
}: {
  interviewId: string;
  title: string;
}) {
  const { token, error: tokenError } = useRealtimeToken(interviewId);
  const { doc, provider, synced } = useYjsRoom(interviewId, token);

  const sendEvent = useEventsChannel(interviewId, token, () => {
    // Candidate doesn't need to consume incoming telemetry — it's outbound only.
  });

  const onCodeEdit = useCallback(
    (bytes: number) => {
      sendEvent({
        kind: 'code_edit',
        actor: 'candidate',
        payload: { path: 'main.py', bytesChanged: bytes },
      });
    },
    [sendEvent],
  );

  const onCanvasEdit = useCallback(
    (delta: { nodes: number; edges: number }) => {
      sendEvent({
        kind: 'canvas_edit',
        actor: 'candidate',
        payload: { nodesAdded: delta.nodes, edgesAdded: delta.edges },
      });
    },
    [sendEvent],
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
          <Badge tone={synced ? 'success' : 'warning'}>
            {tokenError
              ? 'auth error'
              : !token
                ? 'connecting'
                : synced
                  ? 'synced'
                  : 'syncing'}
          </Badge>
        </div>
        <span className="text-xs text-slate-500">candidate workspace</span>
      </header>

      <div className="grid flex-1 grid-cols-12">
        <div className="col-span-5 border-r border-slate-800">
          <div className="h-full">
            <CodeEditor doc={doc} provider={provider} onLocalEdit={onCodeEdit} />
          </div>
        </div>
        <div className="col-span-4 border-r border-slate-800">
          <Canvas doc={doc} onChange={onCanvasEdit} />
        </div>
        <div className="col-span-3">
          <AiChatPanel interviewId={interviewId} />
        </div>
      </div>
    </div>
  );
}
