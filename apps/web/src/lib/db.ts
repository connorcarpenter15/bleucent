import { getDb } from '@bleucent/db';
import { env } from './env.js';

/** Lazy singleton Drizzle client for the Next.js app. */
export function db() {
  return getDb(env().DATABASE_URL);
}
