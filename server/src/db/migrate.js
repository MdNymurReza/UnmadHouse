// Runs schema.sql, seeds users with bcrypt-hashed passwords, then runs seed.sql.
// Uses the pg pool directly (no psql binary required).
// Usage: npm run migrate --workspace server
// Note: pool.js loads server/.env by absolute path on import, so no dotenv here.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// All seed users share this password in development. Documented in the README.
const DEV_PASSWORD = 'password123';

const SEED_USERS = [
  { name: 'Owner Admin',  email: 'admin@unmadhouse.local',   role: 'ADMIN',   room_no: 'A1', joining_date: '2026-01-01', room_rent: 5000, advance_paid: 2000, fridge_fund: 500, service_charge: 100 },
  { name: 'Mess Manager', email: 'manager@unmadhouse.local', role: 'MANAGER', room_no: 'A2', joining_date: '2026-01-02', room_rent: 4500, advance_paid: 1500, fridge_fund: 400, service_charge: 100 },
  { name: 'Member One',   email: 'member1@unmadhouse.local', role: 'MEMBER',  room_no: 'B1', joining_date: '2026-02-01', room_rent: 4000, advance_paid: 1000, fridge_fund: 300, service_charge: 100 },
  { name: 'Member Two',   email: 'member2@unmadhouse.local', role: 'MEMBER',  room_no: 'B2', joining_date: '2026-02-01', room_rent: 4000, advance_paid: 1000, fridge_fund: 300, service_charge: 100 },
  { name: 'Member Three', email: 'member3@unmadhouse.local', role: 'MEMBER',  room_no: 'C1', joining_date: '2026-02-01', room_rent: 3500, advance_paid: 1000, fridge_fund: 300, service_charge: 100 },
  { name: 'Member Four',  email: 'member4@unmadhouse.local', role: 'MEMBER',  room_no: 'C2', joining_date: '2026-02-01', room_rent: 3500, advance_paid: 1000, fridge_fund: 300, service_charge: 100 },
];

async function run() {
  const schema = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  const seed = await readFile(join(__dirname, 'seed.sql'), 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('[migrate] applying schema...');
    await client.query(schema);

    console.log('[migrate] seeding users...');
    const hash = await bcrypt.hash(DEV_PASSWORD, 10);
    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, room_no, joining_date,
                            room_rent, advance_paid, fridge_fund, service_charge)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [u.name, u.email, hash, u.role, u.room_no, u.joining_date,
         u.room_rent, u.advance_paid, u.fridge_fund, u.service_charge]
      );
    }

    console.log('[migrate] seeding sample data...');
    await client.query(seed);

    await client.query('COMMIT');
    console.log(`[migrate] done. ${SEED_USERS.length} users seeded (password: "${DEV_PASSWORD}").`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[migrate] failed, rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
