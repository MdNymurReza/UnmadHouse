// Cron schedule: fire unpaid-payment reminders on the 25th and 30th each month.
import cron from 'node-cron';
import { broadcastUnpaidReminders } from '../services/notify.js';

export function startScheduler() {
  // "min hour day-of-month month day-of-week" — at 09:00 on the 25th and 30th.
  cron.schedule('0 9 25,30 * *', async () => {
    try {
      await broadcastUnpaidReminders();
    } catch (err) {
      console.error('[cron] reminder broadcast failed:', err.message);
    }
  });
  console.log('[cron] reminder scheduler armed (25th & 30th, 09:00).');
}
