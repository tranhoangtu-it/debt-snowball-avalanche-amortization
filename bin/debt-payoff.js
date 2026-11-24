#!/usr/bin/env node
import {
  calculateAmortizationSchedule,
  compareSnowballVsAvalanche,
} from "../src/index.js"

function parseArgs(argv) {
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      opts[key] = true
    } else {
      opts[key] = next
      i++
    }
  }
  return opts
}

const args = parseArgs(process.argv.slice(2))

if (args.help || (!args.principal && !args.debts)) {
  console.log(`debt-snowball-avalanche-amortization (debt-payoff)

Usage:
  1) Mortgage / Loan Amortization:
     debt-payoff --principal 300000 --rate 6.5 --months 360 [--extra 250]

  2) Snowball vs. Avalanche Comparison:
     debt-payoff --debts '[{"name":"Visa","balance":2400,"apr":22.9,"minPayment":75},{"name":"Auto","balance":9500,"apr":6.9,"minPayment":240}]' --extra 300
`)
  process.exit(0)
}

if (args.debts) {
  const debts = JSON.parse(args.debts)
  const extraMonthlyBudget = Number(args.extra ?? 0)
  const comparison = compareSnowballVsAvalanche({ debts, extraMonthlyBudget })
  console.log(
    JSON.stringify(
      {
        monthlyBudget: comparison.avalanche.monthlyBudget,
        snowballMonths: comparison.snowball.monthsToDebtFree,
        snowballInterest: comparison.snowball.totalInterestPaid,
        avalancheMonths: comparison.avalanche.monthsToDebtFree,
        avalancheInterest: comparison.avalanche.totalInterestPaid,
        interestSavedByAvalanche: comparison.interestSavedByAvalanche,
        firstWinMonthsFasterWithSnowball:
          comparison.firstWinMonthsFasterWithSnowball,
      },
      null,
      2,
    ),
  )
} else {
  const result = calculateAmortizationSchedule({
    principal: Number(args.principal),
    annualRatePercent: Number(args.rate),
    termMonths: Number(args.months),
    extraMonthlyPayment: Number(args.extra ?? 0),
  })
  const { schedule, ...summary } = result
  console.log(
    JSON.stringify(
      {
        ...summary,
        firstMonth: schedule[0],
        finalMonth: schedule[schedule.length - 1],
      },
      null,
      2,
    ),
  )
}
