/**
 * Zero-dependency Mortgage, Extra-Payment Amortization & Multi-Debt
 * Snowball vs. Avalanche Payoff Engine.
 */

function roundCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function assertPositiveFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`)
  }
}

function assertNonNegativeFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`)
  }
}

/**
 * Compute standard fixed monthly payment for a loan.
 */
export function calculateMonthlyPayment({
  principal,
  annualRatePercent,
  termMonths,
}) {
  assertPositiveFinite("principal", principal)
  assertNonNegativeFinite("annualRatePercent", annualRatePercent)
  assertPositiveFinite("termMonths", termMonths)

  const monthlyRate = annualRatePercent / 100 / 12
  if (monthlyRate === 0) {
    return roundCents(principal / termMonths)
  }
  const factor = (1 + monthlyRate) ** termMonths
  return roundCents((principal * (monthlyRate * factor)) / (factor - 1))
}

/**
 * Generate a full loan/mortgage amortization schedule with optional recurring
 * monthly extra principal and one-time lump-sum payments, comparing against baseline.
 */
export function calculateAmortizationSchedule({
  principal,
  annualRatePercent,
  termMonths,
  extraMonthlyPayment = 0,
  lumpSumPayments = {},
}) {
  assertPositiveFinite("principal", principal)
  assertNonNegativeFinite("annualRatePercent", annualRatePercent)
  assertPositiveFinite("termMonths", termMonths)
  assertNonNegativeFinite("extraMonthlyPayment", extraMonthlyPayment)

  const scheduledMonthlyPayment = calculateMonthlyPayment({
    principal,
    annualRatePercent,
    termMonths,
  })
  const monthlyRate = annualRatePercent / 100 / 12

  const runSchedule = (withExtras) => {
    let balance = principal
    let totalInterest = 0
    let totalPaid = 0
    const schedule = []
    let month = 0
    const maxMonths = termMonths + 1200

    while (balance > 0.004 && month < maxMonths) {
      month += 1
      const interest = roundCents(balance * monthlyRate)
      const lumpSum = withExtras ? Number(lumpSumPayments[month] ?? 0) : 0
      const plannedExtra = withExtras ? extraMonthlyPayment + lumpSum : 0
      const maxNeeded = roundCents(balance + interest)
      const totalMonthPayment = Math.min(
        maxNeeded,
        roundCents(scheduledMonthlyPayment + plannedExtra),
      )
      const principalPaid = roundCents(totalMonthPayment - interest)
      if (principalPaid <= 0) {
        throw new Error(
          "Monthly payment does not cover monthly accrued interest",
        )
      }
      balance = Math.max(0, roundCents(balance - principalPaid))
      totalInterest = roundCents(totalInterest + interest)
      totalPaid = roundCents(totalPaid + totalMonthPayment)

      schedule.push({
        month,
        payment: totalMonthPayment,
        principalPaid,
        interestPaid: interest,
        extraPrincipal: roundCents(
          Math.max(0, totalMonthPayment - scheduledMonthlyPayment),
        ),
        remainingBalance: balance,
      })
    }

    return {
      monthsToPayoff: month,
      totalInterest,
      totalPaid,
      schedule,
    }
  }

  const baseline = runSchedule(false)
  const accelerated =
    extraMonthlyPayment > 0 || Object.keys(lumpSumPayments).length > 0
      ? runSchedule(true)
      : baseline

  return {
    principal: roundCents(principal),
    annualRatePercent,
    termMonths,
    scheduledMonthlyPayment,
    monthsToPayoff: accelerated.monthsToPayoff,
    monthsSaved: baseline.monthsToPayoff - accelerated.monthsToPayoff,
    baselineTotalInterest: baseline.totalInterest,
    totalInterest: accelerated.totalInterest,
    interestSaved: roundCents(
      baseline.totalInterest - accelerated.totalInterest,
    ),
    totalPaid: accelerated.totalPaid,
    schedule: accelerated.schedule,
  }
}

/**
 * Simulate multi-account debt payoff using either "snowball" (lowest balance first)
 * or "avalanche" (highest APR first) rollover cascades.
 */
export function simulateDebtPayoff({
  debts,
  extraMonthlyBudget = 0,
  strategy = "avalanche",
  maxMonths = 1200,
}) {
  if (!Array.isArray(debts) || debts.length === 0) {
    throw new TypeError("debts must be a non-empty array")
  }
  assertNonNegativeFinite("extraMonthlyBudget", extraMonthlyBudget)
  if (strategy !== "snowball" && strategy !== "avalanche") {
    throw new Error('strategy must be "snowball" or "avalanche"')
  }

  const accounts = debts.map((debt, index) => {
    assertPositiveFinite(`debts[${index}].balance`, debt.balance)
    assertNonNegativeFinite(`debts[${index}].apr`, debt.apr)
    assertPositiveFinite(`debts[${index}].minPayment`, debt.minPayment)
    return {
      id: debt.id ?? `debt_${index + 1}`,
      name: debt.name ?? `Debt ${index + 1}`,
      balance: roundCents(debt.balance),
      apr: debt.apr,
      minPayment: roundCents(debt.minPayment),
      totalInterestPaid: 0,
      paidOffMonth: null,
    }
  })

  const totalMinimumBudget = roundCents(
    accounts.reduce((sum, d) => sum + d.minPayment, 0),
  )
  const monthlyCommitBudget = roundCents(
    totalMinimumBudget + extraMonthlyBudget,
  )

  const payoffOrder = []
  const timeline = []
  let month = 0
  let totalInterestPaid = 0
  let totalPaid = 0

  while (accounts.some((d) => d.balance > 0.004) && month < maxMonths) {
    month += 1
    let monthInterest = 0
    let monthPaid = 0

    // 1. Accrue monthly interest on active balances
    for (const acc of accounts) {
      if (acc.balance <= 0.004) continue
      const interest = roundCents(acc.balance * (acc.apr / 100 / 12))
      acc.balance = roundCents(acc.balance + interest)
      acc.totalInterestPaid = roundCents(acc.totalInterestPaid + interest)
      monthInterest = roundCents(monthInterest + interest)
    }

    let remainingBudget = monthlyCommitBudget

    // 2. Pay required minimums first
    for (const acc of accounts) {
      if (acc.balance <= 0.004) continue
      const due = Math.min(acc.balance, acc.minPayment)
      acc.balance = roundCents(acc.balance - due)
      remainingBudget = roundCents(remainingBudget - due)
      monthPaid = roundCents(monthPaid + due)
      if (acc.balance <= 0.004 && acc.paidOffMonth === null) {
        acc.balance = 0
        acc.paidOffMonth = month
        payoffOrder.push({
          id: acc.id,
          name: acc.name,
          paidOffMonth: month,
          totalInterestPaid: acc.totalInterestPaid,
        })
      }
    }

    // 3. Direct remaining rollover budget according to strategy
    const orderedActive = accounts
      .filter((acc) => acc.balance > 0.004)
      .sort((a, b) => {
        if (strategy === "snowball") {
          return a.balance !== b.balance ? a.balance - b.balance : b.apr - a.apr
        }
        return b.apr !== a.apr ? b.apr - a.apr : a.balance - b.balance
      })

    for (const acc of orderedActive) {
      if (remainingBudget <= 0.004) break
      const extraPay = Math.min(acc.balance, remainingBudget)
      acc.balance = roundCents(acc.balance - extraPay)
      remainingBudget = roundCents(remainingBudget - extraPay)
      monthPaid = roundCents(monthPaid + extraPay)
      if (acc.balance <= 0.004 && acc.paidOffMonth === null) {
        acc.balance = 0
        acc.paidOffMonth = month
        payoffOrder.push({
          id: acc.id,
          name: acc.name,
          paidOffMonth: month,
          totalInterestPaid: acc.totalInterestPaid,
        })
      }
    }

    const endingBalance = roundCents(
      accounts.reduce((sum, d) => sum + d.balance, 0),
    )
    totalInterestPaid = roundCents(totalInterestPaid + monthInterest)
    totalPaid = roundCents(totalPaid + monthPaid)

    timeline.push({
      month,
      payment: monthPaid,
      interestPaid: monthInterest,
      remainingBalance: endingBalance,
    })
  }

  if (accounts.some((d) => d.balance > 0.004)) {
    throw new Error(
      `Debts did not pay off within ${maxMonths} months; increase minimum or extra payments`,
    )
  }

  return {
    strategy,
    monthlyBudget: monthlyCommitBudget,
    monthsToDebtFree: month,
    totalInterestPaid,
    totalPaid,
    payoffOrder,
    timeline,
  }
}

/**
 * Run both Debt Snowball and Debt Avalanche side by side and report interest/month deltas.
 */
export function compareSnowballVsAvalanche({ debts, extraMonthlyBudget = 0 }) {
  const snowball = simulateDebtPayoff({
    debts,
    extraMonthlyBudget,
    strategy: "snowball",
  })
  const avalanche = simulateDebtPayoff({
    debts,
    extraMonthlyBudget,
    strategy: "avalanche",
  })

  return {
    snowball,
    avalanche,
    interestSavedByAvalanche: roundCents(
      snowball.totalInterestPaid - avalanche.totalInterestPaid,
    ),
    monthsFasterWithAvalanche:
      snowball.monthsToDebtFree - avalanche.monthsToDebtFree,
    firstWinMonthsFasterWithSnowball:
      (avalanche.payoffOrder[0]?.paidOffMonth ?? 0) -
      (snowball.payoffOrder[0]?.paidOffMonth ?? 0),
  }
}
