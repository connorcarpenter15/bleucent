import { z } from 'zod';

/**
 * Shape returned by the realtime server's `GET /internal/snapshot/{interview_id}`
 * route. The Rust handler walks the room's `yrs` doc, extracts the canvas
 * sub-doc, and serializes it into this plain JSON shape so the Python AI
 * orchestrator can build a system prompt without knowing anything about CRDTs.
 */

export const ReactFlowNode = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()),
});
export type ReactFlowNode = z.infer<typeof ReactFlowNode>;

export const ReactFlowEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});
export type ReactFlowEdge = z.infer<typeof ReactFlowEdge>;

export const FileSnapshotEntry = z.object({
  path: z.string(),
  contents: z.string(),
});
export type FileSnapshotEntry = z.infer<typeof FileSnapshotEntry>;

export const InterviewSnapshot = z.object({
  interviewId: z.string().uuid(),
  capturedAt: z.string().datetime(),
  canvas: z.object({
    nodes: z.array(ReactFlowNode),
    edges: z.array(ReactFlowEdge),
  }),
  code: z.array(FileSnapshotEntry),
});
export type InterviewSnapshot = z.infer<typeof InterviewSnapshot>;
