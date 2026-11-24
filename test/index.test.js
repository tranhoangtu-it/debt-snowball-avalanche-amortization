import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import test from "node:test"
import {
  calculateAmortizationSchedule,
  calculateMonthlyPayment,
  compareSnowballVsAvalanche,
} from "../src/index.js"

test("calculates standard 30-year fixed mortgage payment and extra-payment savings", () => {
  const payment = calculateMonthlyPayment({
    principal: 300000,
    annualRatePercent: 6.0,
    termMonths: 360,
  })
  // Classic $300k @ 6% for 360 months = $1,798.65
  assert.equal(payment, 1798.65)

  const accelerated = calculateAmortizationSchedule({
    principal: 300000,
    annualRatePercent: 6.0,
    termMonths: 360,
    extraMonthlyPayment: 300,
  })

  assert.ok(accelerated.monthsSaved > 80)
  assert.ok(accelerated.interestSaved > 95000)
  assert.equal(
    accelerated.schedule[accelerated.schedule.length - 1].remainingBalance,
    0,
  )
})

test("handles 0% APR promotional installment loan cleanly", () => {
  const res = calculateAmortizationSchedule({
    principal: 1200,
    annualRatePercent: 0,
    termMonths: 12,
  })

  assert.equal(res.scheduledMonthlyPayment, 100)
  assert.equal(res.totalInterest, 0)
  assert.equal(res.monthsToPayoff, 12)
})

test("compares Debt Snowball vs Debt Avalanche rollover cascades accurately", () => {
  const debts = [
    { name: "Store Card", balance: 900, apr: 12.0, minPayment: 35 },
    { name: "APR Card", balance: 6500, apr: 24.99, minPayment: 165 },
    { name: "Auto Loan", balance: 8200, apr: 6.5, minPayment: 220 },
  ]

  const result = compareSnowballVsAvalanche({
    debts,
    extraMonthlyBudget: 250,
  })

  // Avalanche pays less or equal total interest when highest APR has larger balance
  assert.ok(result.interestSavedByAvalanche > 0)
  // Snowball clears the $900 Store Card first for an earlier psychological win
  assert.equal(result.snowball.payoffOrder[0].name, "Store Card")
  assert.equal(result.avalanche.payoffOrder[0].name, "APR Card")
  assert.ok(result.firstWinMonthsFasterWithSnowball > 0)
})

test("CLI runs debt comparison and outputs valid JSON", () => {
  const raw = execFileSync(
    process.execPath,
    [
      "./bin/debt-payoff.js",
      "--debts",
      JSON.stringify([
        { name: "Card A", balance: 1200, apr: 9.9, minPayment: 40 },
        { name: "Card B", balance: 4500, apr: 23.9, minPayment: 120 },
      ]),
      "--extra",
      "200",
    ],
    { encoding: "utf8" },
  )
  const out = JSON.parse(raw)
  assert.equal(out.monthlyBudget, 360)
  assert.ok(out.interestSavedByAvalanche > 0)
})
