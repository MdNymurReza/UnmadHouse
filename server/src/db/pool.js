import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

// Load server/.env by absolute path (anchored to this file), so it works no
// matter what the current working directory is when the process starts.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn('[db] DATABASE_URL is not set — check server/.env');
} else {
  // Log the host only (never the password) so connection targets are obvious.
  const host = connectionString.replace(/^.*@/, '').replace(/\/.*$/, '');
  console.log(`[db] connecting to ${host}`);
}

// Supabase (and most hosted Postgres) require SSL. Enable it when PGSSL=true
// or when the connection string points at a supabase host. Local Postgres
// keeps SSL off so it connects as before.
const needsSsl =
  process.env.PGSSL === 'true' || /supabase\.(co|com)/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

export function query(text, params) {
  return pool.query(text, params);
}

export default pool;
