# debt-snowball-avalanche-amortization

Zero-dependency **Mortgage Amortization**, **Extra-Payment Interest Savings**, and **Debt Snowball vs. Debt Avalanche** credit-card/loan payoff engine in pure ES-modules + CLI.

- **Live Financial Planner Web App:** [https://finplan-pro.tranhoangtu-it.workers.dev](https://finplan-pro.tranhoangtu-it.workers.dev)
- **Printable & Pro Financial Tracker Bundle:** [Gumroad Edition](https://tranhoangtu.gumroad.com/l/ygkbu) · [Payhip Edition](https://payhip.com/b/arVyN)
- **Zero runtime dependencies** · Pure ES Modules + TypeScript `.d.ts` declarations · Runs in Node.js, Bun, Deno, Browsers & Cloudflare Workers

---

## Features

- **Exact Mortgage & Loan Amortization (`calculateAmortizationSchedule`):** Fixed-rate monthly payment calculation, recurring monthly extra principal, one-time lump-sum payments by month, months shaved off the term, and exact total interest saved against the baseline loan.
- **Debt Snowball vs. Debt Avalanche Rollover Engine (`compareSnowballVsAvalanche`):** Simulates multi-account minimum payments + automatic freed-payment rollover cascades each time a card or loan reaches `$0.00`, quantifying both **Avalanche interest savings** and **Snowball first-win speed**.
- **CLI Included (`debt-payoff`):** Run instant mortgage extra-payment scenarios or multi-card JSON payoff comparisons from your terminal.

## Quick Start

### Programmatic Usage (ESM / TypeScript)

```js
import {
  calculateAmortizationSchedule,
  compareSnowballVsAvalanche,
} from "debt-snowball-avalanche-amortization"

// 1. 30-year $300,000 mortgage @ 6.0% with $300/mo extra principal:
const mortgage = calculateAmortizationSchedule({
  principal: 300000,
  annualRatePercent: 6.0,
  termMonths: 360,
  extraMonthlyPayment: 300,
})
console.log({
  scheduledMonthlyPayment: mortgage.scheduledMonthlyPayment, // 1798.65
  monthsSaved: mortgage.monthsSaved,
  interestSaved: mortgage.interestSaved,
})

// 2. Multi-account Debt Snowball vs. Debt Avalanche comparison:
const comparison = compareSnowballVsAvalanche({
  extraMonthlyBudget: 250,
  debts: [
    { name: "Store Card", balance: 900, apr: 12.0, minPayment: 35 },
    { name: "Rewards Visa", balance: 6500, apr: 24.99, minPayment: 165 },
    { name: "Auto Loan", balance: 8200, apr: 6.5, minPayment: 220 },
  ],
})

console.log({
  interestSavedByAvalanche: comparison.interestSavedByAvalanche,
  firstWinMonthsFasterWithSnowball: comparison.firstWinMonthsFasterWithSnowball,
})
```

### CLI Usage

```bash
node ./bin/debt-payoff.js --principal 300000 --rate 6.5 --months 360 --extra 250
```

---

## Visual Wealth Planner & Printable Finance Tracker Pro Bundle

Want the interactive visual amortization dashboard, printable PDF debt-free thermometer & budget sheets, and full Pro planner toolkit?

- **Launch FinPlan Pro Live:** [https://finplan-pro.tranhoangtu-it.workers.dev](https://finplan-pro.tranhoangtu-it.workers.dev)
- **Get the Pro Finance Tracker & Bundle (Gumroad):** [https://tranhoangtu.gumroad.com/l/ygkbu](https://tranhoangtu.gumroad.com/l/ygkbu)
- **Get the Pro Finance Tracker & Bundle (Payhip):** [https://payhip.com/b/arVyN](https://payhip.com/b/arVyN)
- **More Open-Core Tools & SaaS Kits:** [https://tranhoangtu-it.github.io](https://tranhoangtu-it.github.io)

## Running Tests

```bash
npm test
```

## License

MIT © [Tran Hoang Tu](https://tuth.site)
