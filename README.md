# UnmadHouse

Automated Mess Management System for six occupants.

## Stack
- React (Vite)
- Node.js + Express
- PostgreSQL

## Setup
1. Copy and configure environment variables:
   - `server/.env.example` → `server/.env`
2. Install dependencies:
   - `npm install`
3. Initialize PostgreSQL schema and seed data:
   - `npm run migrate --workspace server`
4. Run development servers:
   - `npm run dev`

## Useful Scripts
- `npm run dev` — runs server and client concurrently
- `npm run start` — starts backend only
- `npm run build` — builds React client

## Database
- `server/db/schema.sql` defines the core tables
- `server/db/seed.sql` contains sample data for initial development

## Dev Login Accounts
After `npm run migrate`, six users are seeded — all share the password `password123`:
- `admin@unmadhouse.local` (ADMIN)
- `manager@unmadhouse.local` (MANAGER)
- `member1@unmadhouse.local` … `member4@unmadhouse.local` (MEMBER)

## Notes
- Auth is JWT + bcrypt; the role is embedded in the token and enforced by `middleware/rbac.js`.
- The pure invoice engine lives in `server/src/services/invoiceEngine.js` (unit-tested via `npm test --workspace server`); `services/billing.js` feeds it from the DB.
- Room rent is **per-room** (stored on each user); the shared utilities (bua, gas, electricity) live in `fixed_bills` and split equally by 6.
- A cron task (`cron/scheduler.js`) fires unpaid-payment reminders on the 25th and 30th via `services/notify.js`, which logs broadcasts in dev (swap `sendEmail` for a real transport later).
