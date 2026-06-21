// Notification broadcast. In dev this logs to the console; swap sendEmail for
// nodemailer (or any provider) to send real mail without touching callers.
import { pool } from '../db/pool.js';

function currentMonthYear() {
  // Avoid Date.now() pitfalls in tests by deriving from a passed value when possible.
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${m}`;
}

// Stub: replace with real email transport later.
async function sendEmail(to, subject, body) {
  console.log(`[notify] EMAIL -> ${to} | ${subject}\n         ${body}`);
}

/**
 * Find every member still flagged Unpaid for the cycle and broadcast a reminder.
 * @param {string} [monthYear] defaults to the current month.
 * @returns {Promise<number>} count of reminders sent.
 */
export async function broadcastUnpaidReminders(monthYear = currentMonthYear()) {
  const { rows } = await pool.query(
    `SELECT u.email, u.name, u.room_no
       FROM users u
       LEFT JOIN payments p
         ON p.user_id = u.id AND p.month_year = $1
      WHERE COALESCE(p.status, 'Unpaid') = 'Unpaid'`,
    [monthYear]
  );

  for (const r of rows) {
    await sendEmail(
      r.email,
      `UnmadHouse: Invoice due for Room ${r.room_no}`,
      `System Alert: Monthly Invoice generated for Room ${r.room_no} (${monthYear}). Please process your payment.`
    );
  }

  console.log(`[notify] ${rows.length} unpaid reminder(s) broadcast for ${monthYear}.`);
  return rows.length;
}

export { currentMonthYear };
