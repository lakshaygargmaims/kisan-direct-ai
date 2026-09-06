#!/usr/bin/env node
/**
 * Production database preparation (Railway / Docker / any PostgreSQL host).
 *
 * The repository keeps ONE source-of-truth schema — prisma/schema.prisma —
 * configured for SQLite so local development needs no database server.
 * Prisma does not support switching the `provider` via an env var, so this
 * script derives prisma/schema.prod.prisma from the dev schema by swapping
 * the provider to "postgresql", then generates the Prisma client for it.
 *
 * Usage:  node scripts/prepare-postgres.mjs [--generate]
 *   --generate  also runs `prisma generate --schema prisma/schema.prod.prisma`
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const devSchemaPath = join(root, 'prisma', 'schema.prisma');
const prodSchemaPath = join(root, 'prisma', 'schema.prod.prisma');

const devSchema = readFileSync(devSchemaPath, 'utf8');
if (!/provider\s*=\s*"sqlite"/.test(devSchema)) {
  console.error('❌ prisma/schema.prisma is not the expected SQLite dev schema — aborting.');
  process.exit(1);
}

const prodSchema = devSchema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
writeFileSync(prodSchemaPath, prodSchema);
console.log(`✅ Wrote ${prodSchemaPath} (provider = postgresql)`);

if (process.argv.includes('--generate')) {
  execSync('npx prisma generate --schema prisma/schema.prod.prisma', {
    cwd: root,
    stdio: 'inherit',
  });
}
