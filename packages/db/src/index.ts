import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * as schema from './schema';
export { schema as schemaTables };

let cached: { client: postgres.Sql; db: PostgresJsDatabase<typeof schema> } | undefined;

/**
 * Returns a singleton Drizzle client for the configured DATABASE_URL.
 * Used by the Next.js app and any TS scripts.
 */
export function getDb(databaseUrl = process.env.DATABASE_URL): PostgresJsDatabase<typeof schema> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  if (cached) return cached.db;
  const client = postgres(databaseUrl, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    prepare: false,
  });
  const db = drizzle(client, { schema });
  cached = { client, db };
  return db;
}

/** Closes the underlying postgres client. Useful for scripts and tests. */
export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.client.end({ timeout: 5 });
    cached = undefined;
  }
}
