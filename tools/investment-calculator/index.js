#!/usr/bin/env node

import { Command } from 'commander';
import Table from 'cli-table3';
import fs from 'node:fs';
import path from 'node:path';

function toNumber(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${label}: ${value}`);
  return n;
}

function asPercent(pct) {
  // Accept 0-1 or 0-100
  const n = Number(pct);
  if (!Number.isFinite(n)) throw new Error(`Invalid percent: ${pct}`);
  if (n <= 1) return n;
  return n / 100;
}

function dollars(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function dollars2(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function pct(n) {
  if (!Number.isFinite(n)) return '—';
  return (n * 100).toFixed(1) + '%';
}

function years(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(1) + ' yrs';
}

function computeDeal({ name, askingPrice, monthlyRevenue, monthlyExpenses, downPaymentPct }) {
  const price = askingPrice;
  const rev = monthlyRevenue;
  const exp = monthlyExpenses;
  const downPct = downPaymentPct;

  const monthlyCashFlow = rev - exp;
  const annualCashFlow = monthlyCashFlow * 12;

  // Simplified: NOI = (rev-exp)*12. (No debt service modeled; expenses should include any loan payment if user wants.)
  const noi = annualCashFlow;
  const capRate = price > 0 ? (noi / price) : NaN;

  const cashInvested = price * downPct;
  const cashOnCashRoi = cashInvested > 0 ? (annualCashFlow / cashInvested) : NaN;
  const paybackPeriodYears = annualCashFlow > 0 ? (cashInvested / annualCashFlow) : Infinity;

  const recommendation = recommend({ capRate, cashOnCashRoi, monthlyCashFlow, paybackPeriodYears });

  return {
    name,
    askingPrice: price,
    monthlyRevenue: rev,
    monthlyExpenses: exp,
    downPaymentPct: downPct,
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

function recommend({ capRate, cashOnCashRoi, monthlyCashFlow, paybackPeriodYears }) {
  // Simple heuristic; tune to preference.
  // - Strong: cap >= 10% AND CoC >= 20% AND CF positive AND payback <= 5y
  // - Consider: cap >= 7% AND CoC >= 12% AND CF positive AND payback <= 8y
  // - Otherwise: pass

  const cfOk = monthlyCashFlow > 0;

  if (cfOk && capRate >= 0.10 && cashOnCashRoi >= 0.20 && paybackPeriodYears <= 5) return 'BUY (strong)';
  if (cfOk && capRate >= 0.07 && cashOnCashRoi >= 0.12 && paybackPeriodYears <= 8) return 'CONSIDER';
  if (!cfOk) return 'PASS (negative cash flow)';
  return 'PASS';
}

function printSingle(deal) {
  const t = new Table({
    colWidths: [24, 28],
    wordWrap: true,
  });

  t.push(
    ['Deal', deal.name],
    ['Asking price', dollars(deal.askingPrice)],
    ['Down payment', pct(deal.downPaymentPct)],
    ['Cash invested (est.)', dollars(deal.cashInvested)],
    ['Monthly revenue', dollars2(deal.monthlyRevenue)],
    ['Monthly expenses', dollars2(deal.monthlyExpenses)],
    ['Monthly cash flow', dollars2(deal.monthlyCashFlow)],
    ['Annual cash flow / NOI', dollars2(deal.annualCashFlow)],
    ['Cap rate', pct(deal.capRate)],
    ['Cash-on-cash ROI', pct(deal.cashOnCashRoi)],
    ['Payback period', deal.paybackPeriodYears === Infinity ? '—' : years(deal.paybackPeriodYears)],
    ['Recommendation', deal.recommendation],
  );

  console.log(t.toString());
}

function printComparison(deals) {
  const t = new Table({
    head: ['Deal', 'Price', 'Down %', 'Cash Invested', 'Rev/mo', 'Exp/mo', 'CF/mo', 'Cap', 'CoC ROI', 'Payback', 'Reco'],
    colAligns: ['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'left'],
  });

  for (const d of deals) {
    t.push([
      d.name,
      dollars(d.askingPrice),
      pct(d.downPaymentPct),
      dollars(d.cashInvested),
      dollars2(d.monthlyRevenue),
      dollars2(d.monthlyExpenses),
      dollars2(d.monthlyCashFlow),
      pct(d.capRate),
      pct(d.cashOnCashRoi),
      d.paybackPeriodYears === Infinity ? '—' : years(d.paybackPeriodYears),
      d.recommendation,
    ]);
  }

  console.log(t.toString());
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function saveResults({ outFile, mode, deals }) {
  if (!outFile) return;

  const outPath = path.resolve(process.cwd(), outFile);
  ensureDir(path.dirname(outPath));

  const payload = {
    savedAt: new Date().toISOString(),
    mode,
    deals,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.error(`Saved results to ${outPath}`);
}

function parseDealString(str, idx) {
  // Accept JSON string or comma-separated: name,price,rev,exp,down
  const s = String(str).trim();
  if (!s) throw new Error('Empty deal');

  if (s.startsWith('{')) {
    const obj = JSON.parse(s);
    return normalizeDealInput(obj, obj.name ?? `Deal ${idx + 1}`);
  }

  const parts = s.split(',').map(x => x.trim());
  if (parts.length < 5) {
    throw new Error(`Invalid deal format: "${str}". Use JSON or "name,price,rev,exp,down"`);
  }

  const [name, price, rev, exp, down] = parts;
  return normalizeDealInput(
    {
      name,
      askingPrice: price,
      monthlyRevenue: rev,
      monthlyExpenses: exp,
      downPaymentPct: down,
    },
    name
  );
}

function normalizeDealInput(input, defaultName = 'Deal') {
  const name = (input.name ?? defaultName).toString();
  const askingPrice = toNumber(input.askingPrice ?? input.price, 'asking price');
  const monthlyRevenue = toNumber(input.monthlyRevenue ?? input.revenue, 'monthly revenue');
  const monthlyExpenses = toNumber(input.monthlyExpenses ?? input.expenses, 'monthly expenses');
  const downPaymentPct = asPercent(input.downPaymentPct ?? input.down ?? input.downPayment);

  return { name, askingPrice, monthlyRevenue, monthlyExpenses, downPaymentPct };
}

const program = new Command();
program
  .name('laundro-calc')
  .description('Laundromat deal investment calculator (ROI, cash flow, payback, cap rate)')
  .version('1.0.0');

program
  .command('single')
  .description('Evaluate a single deal')
  .requiredOption('-p, --price <number>', 'Asking price (USD)')
  .requiredOption('-r, --revenue <number>', 'Monthly revenue (USD)')
  .requiredOption('-e, --expenses <number>', 'Monthly expenses (USD)')
  .requiredOption('-d, --down <number>', 'Down payment percent (e.g. 30 or 0.30)')
  .option('-n, --name <string>', 'Deal name', 'Deal 1')
  .option('-o, --out <file>', 'Save results to JSON file')
  .action((opts) => {
    const input = normalizeDealInput({
      name: opts.name,
      askingPrice: opts.price,
      monthlyRevenue: opts.revenue,
      monthlyExpenses: opts.expenses,
      downPaymentPct: opts.down,
    });

    const deal = computeDeal(input);
    printSingle(deal);
    saveResults({ outFile: opts.out, mode: 'single', deals: [deal] });
  });

program
  .command('compare')
  .description('Compare multiple deals side-by-side')
  .requiredOption('--deal <deal>', 'Deal as JSON or "name,price,rev,exp,down". Repeatable.', (val, acc) => {
    acc.push(val);
    return acc;
  }, [])
  .option('-o, --out <file>', 'Save results to JSON file')
  .action((opts) => {
    const inputs = opts.deal.map((d, i) => parseDealString(d, i));
    const deals = inputs.map(computeDeal);
    printComparison(deals);
    saveResults({ outFile: opts.out, mode: 'compare', deals });
  });

program
  .command('help-examples')
  .description('Print example commands')
  .action(() => {
    console.log(`Examples:

  # Single deal
  laundro-calc single --name "Main St" --price 300000 --revenue 25000 --expenses 18000 --down 30 --out results/main-st.json

  # Compare two deals (CSV style)
  laundro-calc compare \
    --deal "Main St,300000,25000,18000,30" \
    --deal "Broadway,450000,32000,23000,25" \
    --out results/compare.json

  # Compare two deals (JSON style)
  laundro-calc compare \
    --deal '{"name":"A","askingPrice":300000,"monthlyRevenue":25000,"monthlyExpenses":18000,"downPaymentPct":0.30}' \
    --deal '{"name":"B","askingPrice":450000,"monthlyRevenue":32000,"monthlyExpenses":23000,"downPaymentPct":25}'
`);
  });

program.parse(process.argv);
