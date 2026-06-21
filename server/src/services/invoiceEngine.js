// Pure financial engine for UnmadHouse. No DB access here — every function takes
// plain numbers/objects and returns computed values, so it is fully unit-testable.
// The four equations come straight from the PRD §3.

const OCCUPANTS = 6;

/**
 * R_meal = Σ(approved bazaar of all members) / Σ(total meals of all members)
 * Guards divide-by-zero (no meals logged yet) by returning 0.
 * @param {number} totalApprovedBazaar
 * @param {number} totalMeals
 * @returns {number} meal rate (currency per meal)
 */
export function mealRate(totalApprovedBazaar, totalMeals) {
  if (!totalMeals || totalMeals <= 0) return 0;
  return totalApprovedBazaar / totalMeals;
}

/**
 * C_user_meal = individual total meals × R_meal
 */
export function userMealCost(userMeals, rate) {
  return userMeals * rate;
}

/**
 * B_balance = individual approved bazaar spending − C_user_meal
 * Positive => member is owed money. Negative => member owes for meals.
 */
export function bazaarBalance(userApprovedBazaar, userMealCost) {
  return userApprovedBazaar - userMealCost;
}

/**
 * Equal share of a shared utility, split across all occupants.
 */
export function utilityShare(billTotal, occupants = OCCUPANTS) {
  if (!occupants || occupants <= 0) return 0;
  return billTotal / occupants;
}

/**
 * Invoice_total = room rent + (bua + gas + current share) − B_balance
 * A positive B_balance reduces the invoice; a negative one increases it.
 */
export function invoiceTotal({ roomRent, buaShare, gasShare, currentShare, bBalance }) {
  return roomRent + buaShare + gasShare + currentShare - bBalance;
}

/**
 * Full per-member invoice computation.
 *
 * @param {object} input
 * @param {number} input.totalApprovedBazaar - Σ approved bazaar across all members
 * @param {number} input.totalMeals          - Σ meals across all members
 * @param {number} input.userMeals           - this member's total meals
 * @param {number} input.userApprovedBazaar  - this member's approved bazaar
 * @param {number} input.roomRent            - this member's room rent
 * @param {number} input.buaBill             - shared maid salary (total)
 * @param {number} input.gasBill             - shared gas bill (total)
 * @param {number} input.electricityBill     - shared current bill (total)
 * @param {number} [input.occupants=6]
 * @returns {object} breakdown with every intermediate value
 */
export function computeInvoice(input) {
  const {
    totalApprovedBazaar = 0,
    totalMeals = 0,
    userMeals = 0,
    userApprovedBazaar = 0,
    roomRent = 0,
    buaBill = 0,
    gasBill = 0,
    electricityBill = 0,
    occupants = OCCUPANTS,
  } = input;

  const rate = mealRate(totalApprovedBazaar, totalMeals);
  const cUserMeal = userMealCost(userMeals, rate);
  const bBalance = bazaarBalance(userApprovedBazaar, cUserMeal);

  const buaShare = utilityShare(buaBill, occupants);
  const gasShare = utilityShare(gasBill, occupants);
  const currentShare = utilityShare(electricityBill, occupants);

  const total = invoiceTotal({ roomRent, buaShare, gasShare, currentShare, bBalance });

  return {
    mealRate: round(rate),
    userMeals,
    totalMeals,                              // mess-wide total meals this cycle
    totalApprovedBazaar: round(totalApprovedBazaar),
    userMealCost: round(cUserMeal),
    userApprovedBazaar: round(userApprovedBazaar),
    bazaarBalance: round(bBalance),
    roomRent: round(roomRent),
    utilities: {
      bua: round(buaShare),
      gas: round(gasShare),
      current: round(currentShare),
      total: round(buaShare + gasShare + currentShare),
    },
    invoiceTotal: round(total),
  };
}

// Round to 2 decimals to keep currency tidy. Kept internal.
function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export { OCCUPANTS };
