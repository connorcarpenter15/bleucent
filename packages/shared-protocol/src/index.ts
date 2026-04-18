/**
 * Bleucent shared protocol.
 *
 * Cross-service contracts (telemetry events, internal HTTP payloads, JWT claims).
 * The TS types here are the source of truth. Run `pnpm --filter
 * @bleucent/shared-protocol build` to emit JSON Schemas under ./schemas, which
 * the Rust and Python services then consume.
 */
export * from './events';
export * from './snapshot';
export * from './tokens';
export * from './schema';
