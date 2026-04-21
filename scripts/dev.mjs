#!/usr/bin/env node
/**
 * Dev entrypoint for `pnpm dev` at the repo root.
 *
 * Loads `<repo>/.env` then `<repo>/.env.local` (override) into `process.env`
 * before spawning Turbo. Without this, a root-only `.env` is invisible to
 * `next dev` (which only auto-loads `apps/web/.env*`) and to packages whose
 * cwd is not the repo root.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env', '.env.local']) {
  const p = resolve(root, name);
  if (existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

const result = spawnSync('pnpm', ['exec', 'turbo', 'run', 'dev', '--parallel'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
