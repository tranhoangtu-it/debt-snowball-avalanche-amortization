export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  extraPrincipal: number;
  remainingBalance: number;
}

export interface AmortizationResult {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  scheduledMonthlyPayment: number;
  monthsToPayoff: number;
  monthsSaved: number;
  baselineTotalInterest: number;
  totalInterest: number;
  interestSaved: number;
  totalPaid: number;
  schedule: AmortizationRow[];
}

export interface DebtAccountInput {
  id?: string;
  name?: string;
  balance: number;
  apr: number;
  minPayment: number;
}

export interface DebtPayoffMilestone {
  id: string;
  name: string;
  paidOffMonth: number;
  totalInterestPaid: number;
}

export interface DebtSimulationResult {
  strategy: "snowball" | "avalanche";
  monthlyBudget: number;
  monthsToDebtFree: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffOrder: DebtPayoffMilestone[];
  timeline: Array<{
    month: number;
    payment: number;
    interestPaid: number;
    remainingBalance: number;
  }>;
}

export declare function calculateMonthlyPayment(input: {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
}): number;

export declare function calculateAmortizationSchedule(input: {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  extraMonthlyPayment?: number;
  lumpSumPayments?: Record<number, number>;
}): AmortizationResult;

export declare function simulateDebtPayoff(input: {
  debts: DebtAccountInput[];
  extraMonthlyBudget?: number;
  strategy?: "snowball" | "avalanche";
  maxMonths?: number;
}): DebtSimulationResult;

export declare function compareSnowballVsAvalanche(input: {
  debts: DebtAccountInput[];
  extraMonthlyBudget?: number;
}): {
  snowball: DebtSimulationResult;
  avalanche: DebtSimulationResult;
  interestSavedByAvalanche: number;
  monthsFasterWithAvalanche: number;
  firstWinMonthsFasterWithSnowball: number;
};
