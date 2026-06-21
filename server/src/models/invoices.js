import { query } from '../db/index.js';

const splitBySix = (value) => Number(value) / 6;

export async function getInvoiceSummary(monthYear) {
  const billsRes = await query('SELECT * FROM fixed_bills WHERE month_year = $1 LIMIT 1', [monthYear]);
  const bills = billsRes.rows[0];
  if (!bills) {
    return { error: 'No fixed bills found for monthYear ' + monthYear };
  }

  const mealsRes = await query(
    `SELECT user_id, SUM(meal_count) AS total_meals FROM meals GROUP BY user_id`
  );
  const mealTotals = mealsRes.rows.reduce((acc, row) => {
    acc[row.user_id] = Number(row.total_meals);
    return acc;
  }, {});

  const bazaarRes = await query(
    `SELECT buyer_id, SUM(amount) AS total_spending FROM bazaar WHERE status = 'Approved' GROUP BY buyer_id`
  );
  const bazaarTotals = bazaarRes.rows.reduce((acc, row) => {
    acc[row.buyer_id] = Number(row.total_spending);
    return acc;
  }, {});

  const totalMeals = Object.values(mealTotals).reduce((sum, n) => sum + n, 0);
  const totalBazaar = Object.values(bazaarTotals).reduce((sum, n) => sum + n, 0);
  const mealRate = totalMeals > 0 ? totalBazaar / totalMeals : 0;

  const usersRes = await query('SELECT id, name, room_no FROM users');
  const userSummaries = usersRes.rows.map((user) => {
    const totalMeals = mealTotals[user.id] || 0;
    const totalBazaar = bazaarTotals[user.id] || 0;
    const mealCost = Number((totalMeals * mealRate).toFixed(2));
    const bazaarOffset = Number((totalBazaar - mealCost).toFixed(2));
    const invoiceTotal = Number(
      (
        splitBySix(bills.room_rent) +
        splitBySix(bills.bua_bill) +
        splitBySix(bills.gas_bill) +
        splitBySix(bills.electricity_bill) -
        bazaarOffset
      ).toFixed(2)
    );

    return {
      user,
      totalMeals,
      totalBazaar,
      mealRate: Number(mealRate.toFixed(2)),
      mealCost,
      bazaarOffset,
      invoiceTotal
    };
  });

  return {
    monthYear,
    fixedBills: bills,
    mealRate: Number(mealRate.toFixed(2)),
    users: userSummaries
  };
}
