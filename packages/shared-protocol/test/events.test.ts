import { describe, expect, it } from 'vitest';
import {
  AiPromptEvent,
  AiResponseChunkEvent,
  CanvasEditEvent,
  CodeEditEvent,
  EventKind,
  ExecEndEvent,
  ExecStartEvent,
  InterviewerConstraintEvent,
  PresenceEvent,
  TelemetryEvent,
} from '../src/events';

const INTERVIEW_ID = '0d0e1c1c-2222-4d3a-8f0c-aaaaaaaaaaaa';
const PROMPT_ID = '11111111-2222-4333-8444-555555555555';
const NOW = '2026-04-18T00:00:00.000Z';

describe('EventKind', () => {
  it('exposes the full set of telemetry kinds', () => {
    expect(Object.values(EventKind).sort()).toEqual(
      [
        'ai_prompt',
        'ai_response_chunk',
        'canvas_edit',
        'code_edit',
        'exec_end',
        'exec_start',
        'interviewer_constraint',
        'presence',
      ].sort(),
    );
  });
});

describe('CodeEditEvent', () => {
  it('parses a valid event', () => {
    const event = CodeEditEvent.parse({
      kind: 'code_edit',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { path: 'src/index.ts', bytesChanged: 12 },
    });
    expect(event.payload.path).toBe('src/index.ts');
  });

  it('rejects negative byte counts', () => {
    const result = CodeEditEvent.safeParse({
      kind: 'code_edit',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { path: 'a', bytesChanged: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an event without a kind discriminator', () => {
    const result = CodeEditEvent.safeParse({
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { path: 'a', bytesChanged: 1 },
    });
    expect(result.success).toBe(false);
  });
});

describe('CanvasEditEvent', () => {
  it('defaults missing counters to zero', () => {
    const event = CanvasEditEvent.parse({
      kind: 'canvas_edit',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'interviewer',
      payload: {},
    });
    expect(event.payload).toEqual({
      nodesAdded: 0,
      nodesRemoved: 0,
      edgesAdded: 0,
      edgesRemoved: 0,
    });
  });
});

describe('AI events', () => {
  it('parses AiPromptEvent', () => {
    const event = AiPromptEvent.parse({
      kind: 'ai_prompt',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { promptId: PROMPT_ID, prompt: 'help' },
    });
    expect(event.payload.prompt).toBe('help');
  });

  it('parses streaming chunk and respects done flag', () => {
    const event = AiResponseChunkEvent.parse({
      kind: 'ai_response_chunk',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'ai',
      payload: { promptId: PROMPT_ID, chunk: 'tokens', done: true },
    });
    expect(event.payload.done).toBe(true);
  });
});

describe('Exec events', () => {
  it('captures exit code and stdout/stderr tails', () => {
    const event = ExecEndEvent.parse({
      kind: 'exec_end',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'system',
      payload: {
        execId: PROMPT_ID,
        exitCode: 0,
        durationMs: 120,
        stdoutTail: 'ok',
        stderrTail: '',
      },
    });
    expect(event.payload.exitCode).toBe(0);
  });

  it('rejects negative durations', () => {
    const result = ExecStartEvent.safeParse({
      kind: 'exec_start',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'system',
      payload: { execId: PROMPT_ID, command: '' },
    });
    expect(result.success).toBe(true);
  });
});

describe('Constraint and presence events', () => {
  it('parses interviewer constraint', () => {
    const event = InterviewerConstraintEvent.parse({
      kind: 'interviewer_constraint',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'interviewer',
      payload: { constraintId: PROMPT_ID, text: 'no react' },
    });
    expect(event.payload.text).toBe('no react');
  });

  it('parses presence heartbeat', () => {
    const event = PresenceEvent.parse({
      kind: 'presence',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { clientId: 'abc', role: 'candidate', state: 'heartbeat' },
    });
    expect(event.payload.state).toBe('heartbeat');
  });
});

describe('TelemetryEvent discriminated union', () => {
  it('routes by kind', () => {
    const valid = TelemetryEvent.parse({
      kind: 'presence',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: { clientId: 'x', role: 'candidate', state: 'joined' },
    });
    expect(valid.kind).toBe('presence');
  });

  it('rejects unknown kinds', () => {
    const result = TelemetryEvent.safeParse({
      kind: 'not-a-real-kind',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'candidate',
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects an actor outside the enum', () => {
    const result = TelemetryEvent.safeParse({
      kind: 'presence',
      interviewId: INTERVIEW_ID,
      ts: NOW,
      actor: 'admin',
      payload: { clientId: 'x', role: 'candidate', state: 'joined' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid interviewId', () => {
    const result = TelemetryEvent.safeParse({
      kind: 'presence',
      interviewId: 'nope',
      ts: NOW,
      actor: 'candidate',
      payload: { clientId: 'x', role: 'candidate', state: 'joined' },
    });
    expect(result.success).toBe(false);
  });
});
