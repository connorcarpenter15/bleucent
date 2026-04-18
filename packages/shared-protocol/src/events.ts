import { z } from 'zod';

/** Telemetry event kinds emitted by candidate, interviewer, and AI orchestrator. */
export const EventKind = {
  CodeEdit: 'code_edit',
  CanvasEdit: 'canvas_edit',
  AiPrompt: 'ai_prompt',
  AiResponseChunk: 'ai_response_chunk',
  ExecStart: 'exec_start',
  ExecEnd: 'exec_end',
  InterviewerConstraint: 'interviewer_constraint',
  Presence: 'presence',
} as const;

export type EventKind = (typeof EventKind)[keyof typeof EventKind];

const baseFields = {
  interviewId: z.string().uuid(),
  ts: z.string().datetime(),
  actor: z.enum(['candidate', 'interviewer', 'system', 'ai']),
};

/** Code editor change marker (the actual diff is in the Yjs doc). */
export const CodeEditEvent = z.object({
  kind: z.literal(EventKind.CodeEdit),
  ...baseFields,
  payload: z.object({
    path: z.string(),
    bytesChanged: z.number().int().nonnegative(),
  }),
});

/** Canvas (React Flow) change marker. */
export const CanvasEditEvent = z.object({
  kind: z.literal(EventKind.CanvasEdit),
  ...baseFields,
  payload: z.object({
    nodesAdded: z.number().int().nonnegative().default(0),
    nodesRemoved: z.number().int().nonnegative().default(0),
    edgesAdded: z.number().int().nonnegative().default(0),
    edgesRemoved: z.number().int().nonnegative().default(0),
  }),
});

/** Candidate sent a prompt to the AI orchestrator. */
export const AiPromptEvent = z.object({
  kind: z.literal(EventKind.AiPrompt),
  ...baseFields,
  payload: z.object({
    promptId: z.string().uuid(),
    prompt: z.string(),
    currentFile: z.string().optional(),
  }),
});

/** Single streamed chunk of an AI response (mirrored from orchestrator -> realtime). */
export const AiResponseChunkEvent = z.object({
  kind: z.literal(EventKind.AiResponseChunk),
  ...baseFields,
  payload: z.object({
    promptId: z.string().uuid(),
    chunk: z.string(),
    done: z.boolean(),
  }),
});

/** Exec request started in the sandbox. */
export const ExecStartEvent = z.object({
  kind: z.literal(EventKind.ExecStart),
  ...baseFields,
  payload: z.object({
    execId: z.string().uuid(),
    command: z.string(),
  }),
});

/** Exec request finished. */
export const ExecEndEvent = z.object({
  kind: z.literal(EventKind.ExecEnd),
  ...baseFields,
  payload: z.object({
    execId: z.string().uuid(),
    exitCode: z.number().int(),
    durationMs: z.number().int().nonnegative(),
    stdoutTail: z.string(),
    stderrTail: z.string(),
  }),
});

/** Interviewer injected a new constraint into the AI system prompt. */
export const InterviewerConstraintEvent = z.object({
  kind: z.literal(EventKind.InterviewerConstraint),
  ...baseFields,
  payload: z.object({
    constraintId: z.string().uuid(),
    text: z.string(),
  }),
});

/** Presence/heartbeat for connected clients. */
export const PresenceEvent = z.object({
  kind: z.literal(EventKind.Presence),
  ...baseFields,
  payload: z.object({
    clientId: z.string(),
    role: z.enum(['candidate', 'interviewer']),
    state: z.enum(['joined', 'left', 'heartbeat']),
  }),
});

/** Discriminated union of every telemetry event. */
export const TelemetryEvent = z.discriminatedUnion('kind', [
  CodeEditEvent,
  CanvasEditEvent,
  AiPromptEvent,
  AiResponseChunkEvent,
  ExecStartEvent,
  ExecEndEvent,
  InterviewerConstraintEvent,
  PresenceEvent,
]);

export type TelemetryEvent = z.infer<typeof TelemetryEvent>;
export type CodeEditEvent = z.infer<typeof CodeEditEvent>;
export type CanvasEditEvent = z.infer<typeof CanvasEditEvent>;
export type AiPromptEvent = z.infer<typeof AiPromptEvent>;
export type AiResponseChunkEvent = z.infer<typeof AiResponseChunkEvent>;
export type ExecStartEvent = z.infer<typeof ExecStartEvent>;
export type ExecEndEvent = z.infer<typeof ExecEndEvent>;
export type InterviewerConstraintEvent = z.infer<typeof InterviewerConstraintEvent>;
export type PresenceEvent = z.infer<typeof PresenceEvent>;
