/**
 * Emits one JSON Schema file per shared type into ./schemas.
 * The Rust realtime server and Python AI/sandbox services read these to
 * validate cross-language payloads.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { schemas } from '../dist/schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'schemas');
mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries(schemas)) {
  const file = join(outDir, `${name}.schema.json`);
  writeFileSync(file, JSON.stringify(schema, null, 2));
  console.log(`wrote ${file}`);
}
