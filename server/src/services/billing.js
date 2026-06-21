// DB-backed billing: pulls a month's rows and runs them through the pure engine.
import { pool } from '../db/pool.js';
import { computeInvoice } from './invoiceEngine.js';

// month_year is 'YYYY-MM'. We match meals/bazaar by the 'YYYY-MM' prefix of their date.
function monthRange(monthYear) {
  return `${monthYear}%`;
}

/**
 * Aggregate mess-wide totals for a month: Σ approved bazaar and Σ meals.
 */
export async function getMessTotals(monthYear) {
  const like = monthRange(monthYear);
  const [{ rows: bazaarRows }, { rows: mealRows }] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM bazaar
        WHERE status = 'Approved' AND to_char(date, 'YYYY-MM') = $1`,
      [monthYear]
    ),
    pool.query(
      `SELECT COALESCE(SUM(meal_count), 0) AS total
         FROM meals
        WHERE to_char(date, 'YYYY-MM') = $1`,
      [monthYear]
    ),
  ]);
  return {
    totalApprovedBazaar: Number(bazaarRows[0].total),
    totalMeals: Number(mealRows[0].total),
  };
}

/**
 * Compute a single member's invoice for a month.
 * @returns {object|null} invoice breakdown, or null if user not found.
 */
export async function getUserInvoice(userId, monthYear) {
  const { rows: userRows } = await pool.query(
    `SELECT id, name, room_no, room_rent FROM users WHERE id = $1`,
    [userId]
  );
  if (userRows.length === 0) return null;
  const user = userRows[0];

  const { rows: billRows } = await pool.query(
    `SELECT bua_bill, gas_bill, electricity_bill FROM fixed_bills WHERE month_year = $1`,
    [monthYear]
  );
  const bill = billRows[0] || { bua_bill: 0, gas_bill: 0, electricity_bill: 0 };

  const [{ rows: umealRows }, { rows: ubazaarRows }] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(meal_count), 0) AS total
         FROM meals
        WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = $2`,
      [userId, monthYear]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM bazaar
        WHERE buyer_id = $1 AND status = 'Approved' AND to_char(date, 'YYYY-MM') = $2`,
      [userId, monthYear]
    ),
  ]);

  const { totalApprovedBazaar, totalMeals } = await getMessTotals(monthYear);

  const breakdown = computeInvoice({
    totalApprovedBazaar,
    totalMeals,
    userMeals: Number(umealRows[0].total),
    userApprovedBazaar: Number(ubazaarRows[0].total),
    roomRent: Number(user.room_rent),
    buaBill: Number(bill.bua_bill),
    gasBill: Number(bill.gas_bill),
    electricityBill: Number(bill.electricity_bill),
  });

  // Payment status for this cycle.
  const { rows: payRows } = await pool.query(
    `SELECT status, amount, approved_at FROM payments WHERE user_id = $1 AND month_year = $2`,
    [userId, monthYear]
  );
  const payment = payRows[0] || { status: 'Unpaid', amount: 0, approved_at: null };

  return {
    user: { id: user.id, name: user.name, room_no: user.room_no },
    monthYear,
    ...breakdown,
    payment: {
      status: payment.status,
      amount: Number(payment.amount),
      approvedAt: payment.approved_at,
    },
  };
}

/**
 * Compute invoices for every member for a month (used by admin views and cron).
 */
export async function getAllInvoices(monthYear) {
  const { rows: users } = await pool.query(`SELECT id FROM users ORDER BY id`);
  return Promise.all(users.map((u) => getUserInvoice(u.id, monthYear)));
}
