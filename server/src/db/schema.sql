-- UnmadHouse schema
-- Drop in dependency order so migrate is idempotent during development.
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS bazaar CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS fixed_bills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Roles: ADMIN | MANAGER | MEMBER
CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    email          TEXT UNIQUE NOT NULL,
    password_hash  TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT 'MEMBER'
                     CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER')),
    room_no        TEXT NOT NULL,
    joining_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Per-room rent: rent varies by room dimensions (PRD), so it lives on the user/room,
    -- not in the shared fixed_bills table.
    room_rent      NUMERIC(12,2) NOT NULL DEFAULT 0,
    -- Immutable onboarding capital ledger.
    advance_paid   NUMERIC(12,2) NOT NULL DEFAULT 0,
    fridge_fund    NUMERIC(12,2) NOT NULL DEFAULT 0,
    service_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared monthly utilities (split equally by 6). month_year format: 'YYYY-MM'.
CREATE TABLE fixed_bills (
    id               SERIAL PRIMARY KEY,
    month_year       TEXT NOT NULL UNIQUE,
    bua_bill         NUMERIC(12,2) NOT NULL DEFAULT 0,
    gas_bill         NUMERIC(12,2) NOT NULL DEFAULT 0,
    electricity_bill NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily meal log. Lunch and Dinner are ticked independently; meal_count is the
-- derived total used by the billing math (Lunch=1, Dinner=1, so 0/1/2 per day).
CREATE TABLE meals (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    lunch      BOOLEAN NOT NULL DEFAULT FALSE,
    dinner     BOOLEAN NOT NULL DEFAULT FALSE,
    meal_count NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (meal_count >= 0),
    UNIQUE (user_id, date)
);

-- Grocery (bazaar) spending. Only Approved rows feed the meal-rate math.
CREATE TABLE bazaar (
    id         SERIAL PRIMARY KEY,
    buyer_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount     NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    date       DATE NOT NULL DEFAULT CURRENT_DATE,
    details    TEXT,
    status     TEXT NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by INTEGER REFERENCES users(id),  -- staff who approved/rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Correction request tickets.
CREATE TABLE requests (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type           TEXT NOT NULL CHECK (type IN ('Meal', 'Bazaar')),
    target_id      INTEGER,                 -- id of the meal/bazaar row to fix (optional)
    original_value NUMERIC(12,2),
    proposed_value NUMERIC(12,2),
    reason         TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by    INTEGER REFERENCES users(id),  -- staff who resolved the ticket
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at    TIMESTAMPTZ
);

-- Monthly payment ledger.
CREATE TABLE payments (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year   TEXT NOT NULL,
    amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    method       TEXT NOT NULL CHECK (method IN ('Cash', 'MFS')),
    tx_id        TEXT,                       -- bKash/Nagad/bank ref
    sender_no    TEXT,
    status       TEXT NOT NULL DEFAULT 'Unpaid'
                   CHECK (status IN ('Unpaid', 'Paid')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at  TIMESTAMPTZ,
    approved_by  INTEGER REFERENCES users(id),  -- admin who cleared the payment
    UNIQUE (user_id, month_year)
);

CREATE INDEX idx_meals_user_date ON meals (user_id, date);
CREATE INDEX idx_bazaar_buyer    ON bazaar (buyer_id);
CREATE INDEX idx_bazaar_status   ON bazaar (status);
CREATE INDEX idx_requests_status ON requests (status);
CREATE INDEX idx_payments_status ON payments (status);
