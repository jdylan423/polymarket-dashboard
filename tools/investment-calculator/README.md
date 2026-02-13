# Investment Calculator (Laundromat Deals) — CLI

A simple Node.js CLI tool to evaluate laundromat acquisitions using quick “back-of-the-napkin” metrics:

- **Cash flow** (monthly + annual)
- **Cap rate** (NOI / asking price)
- **Cash-on-cash ROI** (annual cash flow / cash invested)
- **Payback period** (cash invested / annual cash flow)
- Basic **recommendation** (BUY / CONSIDER / PASS)

> Note: This tool does **not** model loan amortization, interest, taxes, depreciation, or capex reserves. Treat it as a fast screening calculator.

## Install

From this folder:

```bash
npm install

# run locally
node ./index.js help-examples

# or link as a command
npm link
laundro-calc help-examples
```

## Usage

### Single deal

```bash
laundro-calc single \
  --name "Main St" \
  --price 300000 \
  --revenue 25000 \
  --expenses 18000 \
  --down 30 \
  --out results/main-st.json
```

Arguments:
- `--price`: asking price (USD)
- `--revenue`: monthly revenue (USD)
- `--expenses`: monthly expenses (USD)
- `--down`: down payment percent (accepts `30` or `0.30`)
- `--out`: optional JSON output path for tracking

### Comparison mode (multiple deals)

Provide **repeatable** `--deal` arguments.

#### CSV style

```bash
laundro-calc compare \
  --deal "Main St,300000,25000,18000,30" \
  --deal "Broadway,450000,32000,23000,25" \
  --out results/compare.json
```

Format: `name,price,monthlyRevenue,monthlyExpenses,downPct`

#### JSON style

```bash
laundro-calc compare \
  --deal '{"name":"A","askingPrice":300000,"monthlyRevenue":25000,"monthlyExpenses":18000,"downPaymentPct":0.30}' \
  --deal '{"name":"B","askingPrice":450000,"monthlyRevenue":32000,"monthlyExpenses":23000,"downPaymentPct":25}'
```

## Metrics (definitions)

Given:
- Asking price = `P`
- Monthly revenue = `R`
- Monthly expenses = `E`
- Down payment % = `D`

Calculations:
- Monthly cash flow: `CFm = R - E`
- Annual cash flow (NOI proxy): `CFa = CFm * 12`
- Cash invested (estimate): `Cash = P * D`
- Cap rate: `Cap = CFa / P`
- Cash-on-cash ROI: `CoC = CFa / Cash`
- Payback period (years): `Payback = Cash / CFa`

### Recommendation heuristic

- **BUY (strong)**: cap ≥ 10%, CoC ≥ 20%, positive cash flow, payback ≤ 5 years
- **CONSIDER**: cap ≥ 7%, CoC ≥ 12%, positive cash flow, payback ≤ 8 years
- Otherwise **PASS** (or **PASS (negative cash flow)**)

You can tune these thresholds in `index.js` in the `recommend()` function.

## Example output (single)

For:
- Price: $300,000
- Revenue: $25,000/mo
- Expenses: $18,000/mo
- Down: 30%

Key results:
- Monthly cash flow: $7,000
- Cap rate: 28.0%
- Cash-on-cash ROI: 93.3%
- Payback: ~1.1 years

(These are intentionally simplified; ensure your expense line includes realistic labor, rent, utilities, repairs, and any debt service you want reflected.)

## JSON output

When `--out <file>` is provided, the tool writes:

```json
{
  "savedAt": "2026-02-06T14:50:00.000Z",
  "mode": "single",
  "deals": [
    {
      "name": "Main St",
      "askingPrice": 300000,
      "monthlyRevenue": 25000,
      "monthlyExpenses": 18000,
      "downPaymentPct": 0.3,
      "monthlyCashFlow": 7000,
      "annualCashFlow": 84000,
      "noi": 84000,
      "capRate": 0.28,
      "cashInvested": 90000,
      "cashOnCashRoi": 0.9333,
      "paybackPeriodYears": 1.0714,
      "recommendation": "BUY (strong)"
    }
  ]
}
```

## License

MIT
