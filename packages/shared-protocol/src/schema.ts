import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  TelemetryEvent,
  CodeEditEvent,
  CanvasEditEvent,
  AiPromptEvent,
  AiResponseChunkEvent,
  ExecStartEvent,
  ExecEndEvent,
  InterviewerConstraintEvent,
  PresenceEvent,
} from './events';
import { InterviewSnapshot } from './snapshot';
import { RealtimeJwtClaims, CandidateJoinResponse } from './tokens';

export const schemas = {
  TelemetryEvent: zodToJsonSchema(TelemetryEvent, 'TelemetryEvent'),
  CodeEditEvent: zodToJsonSchema(CodeEditEvent, 'CodeEditEvent'),
  CanvasEditEvent: zodToJsonSchema(CanvasEditEvent, 'CanvasEditEvent'),
  AiPromptEvent: zodToJsonSchema(AiPromptEvent, 'AiPromptEvent'),
  AiResponseChunkEvent: zodToJsonSchema(AiResponseChunkEvent, 'AiResponseChunkEvent'),
  ExecStartEvent: zodToJsonSchema(ExecStartEvent, 'ExecStartEvent'),
  ExecEndEvent: zodToJsonSchema(ExecEndEvent, 'ExecEndEvent'),
  InterviewerConstraintEvent: zodToJsonSchema(
    InterviewerConstraintEvent,
    'InterviewerConstraintEvent',
  ),
  PresenceEvent: zodToJsonSchema(PresenceEvent, 'PresenceEvent'),
  InterviewSnapshot: zodToJsonSchema(InterviewSnapshot, 'InterviewSnapshot'),
  RealtimeJwtClaims: zodToJsonSchema(RealtimeJwtClaims, 'RealtimeJwtClaims'),
  CandidateJoinResponse: zodToJsonSchema(CandidateJoinResponse, 'CandidateJoinResponse'),
};
