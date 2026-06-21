-- Static seed data (non-user rows). Users are seeded in migrate.js so passwords
-- can be bcrypt-hashed. Assumes user ids 1..6 from the users seed.

-- Shared utilities for the current sample month (room rent lives on users).
INSERT INTO fixed_bills (month_year, bua_bill, gas_bill, electricity_bill)
VALUES ('2026-06', 6000, 3000, 7200);

-- Sample meal logs: 5 days for each of the 6 members. Lunch=1, Dinner=1.
-- meal_count is the derived total (lunch + dinner).
INSERT INTO meals (user_id, date, lunch, dinner, meal_count)
SELECT
  id,
  DATE '2026-06-01' + s.i,
  TRUE AS lunch,                          -- lunch always taken in the sample
  ((id + s.i) % 2 = 0) AS dinner,         -- dinner on alternating days
  1 + CASE WHEN (id + s.i) % 2 = 0 THEN 1 ELSE 0 END AS meal_count
FROM users, generate_series(0, 4) AS s(i);

-- Sample bazaar entries (mostly approved, one pending for the queue).
-- approved_by = 1 (Owner Admin) for the approved rows.
INSERT INTO bazaar (buyer_id, amount, date, details, status, approved_by) VALUES
  (1, 6200, '2026-06-05', 'Grocery and snacks',  'Approved', 1),
  (2, 4500, '2026-06-08', 'Daily bazaar items',  'Approved', 1),
  (3, 5200, '2026-06-10', 'Meal ingredients',    'Approved', 2),
  (4, 3800, '2026-06-11', 'Vegetables and fish', 'Approved', 1),
  (5, 5600, '2026-06-12', 'Kitchen stock',       'Approved', 2),
  (6, 4900, '2026-06-13', 'Pantry expenditure',  'Pending',  NULL);

-- A pending correction request to populate the approval queue.
INSERT INTO requests (user_id, type, target_id, original_value, proposed_value, reason)
VALUES (3, 'Meal', NULL, 0.5, 1, 'I had a full meal on June 1, not half.');

-- Monthly payment rows for the sample month. approved_by = 1 (Owner Admin).
INSERT INTO payments (user_id, month_year, amount, method, tx_id, status, approved_at, approved_by) VALUES
  (3, '2026-06', 5000, 'MFS',  'BK123', 'Paid',   NOW(), 1),
  (4, '2026-06', 4000, 'Cash', NULL,    'Unpaid', NULL,  NULL),
  (5, '2026-06', 4500, 'MFS',  'NG456', 'Paid',   NOW(), 1),
  (6, '2026-06', 4700, 'Cash', NULL,    'Unpaid', NULL,  NULL);
