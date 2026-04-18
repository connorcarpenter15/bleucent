'use client';

import { useRef, useState } from 'react';
import { Button, Input } from '@bleucent/ui';

const AI_URL = process.env.NEXT_PUBLIC_AI_ORCHESTRATOR_URL ?? 'http://localhost:5000';

type ChatMessage = {
  id: string;
  role: 'candidate' | 'ai';
  text: string;
};

/**
 * Streaming AI chat panel for the candidate. Posts to the orchestrator's
 * `POST /ai/stream` endpoint and renders SSE chunks. The orchestrator is
 * responsible for mirroring chunks onto the realtime telemetry channel so
 * God Mode sees them too — no extra fan-out from the browser.
 */
export function AiChatPanel({ interviewId }: { interviewId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    if (!input.trim() || streaming) return;
    const promptText = input.trim();
    const promptId = crypto.randomUUID();
    const aiId = crypto.randomUUID();

    setMessages((m) => [
      ...m,
      { id: promptId, role: 'candidate', text: promptText },
      { id: aiId, role: 'ai', text: '' },
    ]);
    setInput('');
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(`${AI_URL}/ai/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          prompt_id: promptId,
          prompt: promptText,
          actor: 'candidate',
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`AI request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const evt of events) {
          const dataLine = evt.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          const json = dataLine.replace(/^data:\s*/, '');
          if (json === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json) as { chunk?: string };
            if (parsed.chunk) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === aiId ? { ...msg, text: msg.text + parsed.chunk } : msg,
                ),
              );
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aiId
            ? { ...msg, text: msg.text + `\n\n[error: ${(err as Error).message}]` }
            : msg,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-400">
        AI co-pilot
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
        {messages.length === 0 && (
          <p className="text-slate-500">
            Ask the AI to scaffold endpoints, debug a stack trace, or explain a section of code.
            Every prompt and response is mirrored to the interviewer in real time.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'candidate'
                ? 'rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2'
                : 'rounded-md border border-blue-700/60 bg-blue-900/20 px-3 py-2'
            }
          >
            <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">
              {m.role === 'candidate' ? 'You' : 'AI'}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-slate-100">{m.text || '...'}</pre>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI..."
            disabled={streaming}
          />
          <Button type="submit" disabled={streaming || !input.trim()}>
            {streaming ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}
