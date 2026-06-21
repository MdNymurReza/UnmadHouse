import cron from 'node-cron';
import { query } from '../db/index.js';

export function scheduleNotifications() {
  cron.schedule('0 9 25,30 * *', async () => {
    const unpaidRes = await query(
      `SELECT p.user_id, u.name, u.email, p.month_year, p.amount FROM payments p JOIN users u ON p.user_id = u.id WHERE p.status = 'Unpaid'`
    );

    if (unpaidRes.rows.length === 0) {
      console.log('No unpaid invoices to notify.');
      return;
    }

    console.log('Unpaid invoice notification summary:');
    unpaidRes.rows.forEach((row) => {
      console.log(`- Reminder for ${row.name} (${row.email}) on ${row.month_year}: amount ${row.amount}`);
    });
  });
}
