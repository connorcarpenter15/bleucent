import { describe, expect, it } from 'vitest';
import { schemas } from '../src/schema';

describe('JSON schemas', () => {
  it('exposes a JSON schema for every cross-service contract', () => {
    expect(Object.keys(schemas).sort()).toEqual(
      [
        'AiPromptEvent',
        'AiResponseChunkEvent',
        'CanvasEditEvent',
        'CandidateJoinResponse',
        'CodeEditEvent',
        'ExecEndEvent',
        'ExecStartEvent',
        'InterviewSnapshot',
        'InterviewerConstraintEvent',
        'PresenceEvent',
        'RealtimeJwtClaims',
        'TelemetryEvent',
      ].sort(),
    );
  });

  it('produces draft-07-style JSON schemas with a $schema key', () => {
    for (const [name, schema] of Object.entries(schemas)) {
      expect(schema, `${name} should be an object`).toBeTypeOf('object');
      expect((schema as { $schema?: string }).$schema).toMatch(/json-schema/);
    }
  });

  it('round-trips through JSON serialization', () => {
    const json = JSON.stringify(schemas.TelemetryEvent);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
