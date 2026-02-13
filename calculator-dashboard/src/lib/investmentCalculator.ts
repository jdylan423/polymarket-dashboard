export type DealInput = {
  name: string;
  askingPrice: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  /** 0-1 fraction (e.g. 0.3) */
  downPaymentPct: number;
};

export type Recommendation = 'BUY (strong)' | 'CONSIDER' | 'PASS (negative cash flow)' | 'PASS';

export type DealResult = DealInput & {
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;
  capRate: number; // 0-1
  cashInvested: number;
  cashOnCashRoi: number; // 0-1
  paybackPeriodYears: number; // Infinity allowed
  recommendation: Recommendation;
};

export function asPercent(pct: number): number {
  // Accept 0-1 or 0-100
  const n = Number(pct);
  if (!Number.isFinite(n)) throw new Error(`Invalid percent: ${pct}`);
  if (n <= 1) return n;
  return n / 100;
}

export function computeDeal(input: DealInput): DealResult {
  const price = input.askingPrice;
  const rev = input.monthlyRevenue;
  const exp = input.monthlyExpenses;
  const downPct = input.downPaymentPct;

  const monthlyCashFlow = rev - exp;
  const annualCashFlow = monthlyCashFlow * 12;

  // NOI simplified = annual cash flow (no debt service modeled)
  const noi = annualCashFlow;
  const capRate = price > 0 ? noi / price : Number.NaN;

  const cashInvested = price * downPct;
  const cashOnCashRoi = cashInvested > 0 ? annualCashFlow / cashInvested : Number.NaN;
  const paybackPeriodYears = annualCashFlow > 0 ? cashInvested / annualCashFlow : Number.POSITIVE_INFINITY;

  const recommendation = recommend({ capRate, cashOnCashRoi, monthlyCashFlow, paybackPeriodYears });

  return {
    ...input,
    monthlyCashFlow,
    annualCashFlow,
    noi,
    capRate,
    cashInvested,
    cashOnCashRoi,
    paybackPeriodYears,
    recommendation,
  };
}

export function recommend({
  capRate,
  cashOnCashRoi,
  monthlyCashFlow,
  paybackPeriodYears,
}: {
  capRate: number;
  cashOnCashRoi: number;
  monthlyCashFlow: number;
  paybackPeriodYears: number;
}): Recommendation {
  const cfOk = monthlyCashFlow > 0;

  if (cfOk && capRate >= 0.1 && cashOnCashRoi >= 0.2 && paybackPeriodYears <= 5) return 'BUY (strong)';
  if (cfOk && capRate >= 0.07 && cashOnCashRoi >= 0.12 && paybackPeriodYears <= 8) return 'CONSIDER';
  if (!cfOk) return 'PASS (negative cash flow)';
  return 'PASS';
}

export function dollars0(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function dollars2(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function pct1(n: number) {
  if (!Number.isFinite(n)) return '—';
  return (n * 100).toFixed(1) + '%';
}

export function years1(n: number) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(1) + ' yrs';
}

export type CashFlowPoint = {
  period: string; // e.g. M1, Y1
  cashFlow: number;
  cumulativeCashFlow: number;
};

export function projectCashFlows({ monthlyCashFlow, months = 60 }: { monthlyCashFlow: number; months?: number }): CashFlowPoint[] {
  const out: CashFlowPoint[] = [];
  let cum = 0;
  for (let m = 1; m <= months; m++) {
    cum += monthlyCashFlow;
    out.push({
      period: `M${m}`,
      cashFlow: monthlyCashFlow,
      cumulativeCashFlow: cum,
    });
  }
  return out;
}

export function annualize(points: CashFlowPoint[]): { year: string; cashFlow: number; cumulativeCashFlow: number }[] {
  const years: { year: string; cashFlow: number; cumulativeCashFlow: number }[] = [];
  let cum = 0;
  for (let i = 0; i < points.length; i += 12) {
    const slice = points.slice(i, i + 12);
    const cf = slice.reduce((a, p) => a + p.cashFlow, 0);
    cum += cf;
    years.push({ year: `Y${years.length + 1}`, cashFlow: cf, cumulativeCashFlow: cum });
  }
  return years;
}
