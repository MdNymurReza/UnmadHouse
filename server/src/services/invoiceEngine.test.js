import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mealRate,
  userMealCost,
  bazaarBalance,
  utilityShare,
  invoiceTotal,
  computeInvoice,
} from './invoiceEngine.js';

test('mealRate divides bazaar by meals', () => {
  // 27000 spent over 90 meals => 300 per meal
  assert.equal(mealRate(27000, 90), 300);
});

test('mealRate guards divide-by-zero', () => {
  assert.equal(mealRate(5000, 0), 0);
  assert.equal(mealRate(0, 0), 0);
});

test('userMealCost multiplies meals by rate', () => {
  assert.equal(userMealCost(20, 300), 6000);
});

test('bazaarBalance positive when member shopped more than ate', () => {
  // shopped 8000, ate 6000 worth => +2000 owed to them
  assert.equal(bazaarBalance(8000, 6000), 2000);
});

test('bazaarBalance negative when member ate more than shopped', () => {
  assert.equal(bazaarBalance(1000, 6000), -5000);
});

test('utilityShare splits equally by 6 by default', () => {
  assert.equal(utilityShare(6000), 1000);
  assert.equal(utilityShare(3000, 6), 500);
});

test('invoiceTotal: positive balance reduces the bill', () => {
  // rent 4000 + utilities 1500 - balance 2000 = 3500
  assert.equal(
    invoiceTotal({ roomRent: 4000, buaShare: 1000, gasShare: 200, currentShare: 300, bBalance: 2000 }),
    3500
  );
});

test('invoiceTotal: negative balance increases the bill', () => {
  // rent 4000 + utilities 1500 - (-1000) = 6500
  assert.equal(
    invoiceTotal({ roomRent: 4000, buaShare: 1000, gasShare: 200, currentShare: 300, bBalance: -1000 }),
    6500
  );
});

test('computeInvoice end-to-end matches a hand calculation', () => {
  // Global: 12000 bazaar over 60 meals => rate 200/meal.
  // Member: 15 meals => meal cost 3000; shopped 5000 => balance +2000.
  // Utilities: bua 6000/6=1000, gas 3000/6=500, current 7200/6=1200 => 2700.
  // Invoice: rent 4000 + 2700 - 2000 = 4700.
  const r = computeInvoice({
    totalApprovedBazaar: 12000,
    totalMeals: 60,
    userMeals: 15,
    userApprovedBazaar: 5000,
    roomRent: 4000,
    buaBill: 6000,
    gasBill: 3000,
    electricityBill: 7200,
  });

  assert.equal(r.mealRate, 200);
  assert.equal(r.userMealCost, 3000);
  assert.equal(r.bazaarBalance, 2000);
  assert.equal(r.utilities.total, 2700);
  assert.equal(r.invoiceTotal, 4700);
});

test('computeInvoice handles zero-meal month without NaN', () => {
  const r = computeInvoice({
    totalApprovedBazaar: 0,
    totalMeals: 0,
    userMeals: 0,
    userApprovedBazaar: 0,
    roomRent: 4000,
    buaBill: 6000,
    gasBill: 3000,
    electricityBill: 7200,
  });
  assert.equal(r.mealRate, 0);
  assert.equal(r.invoiceTotal, 4000 + 2700);
});
