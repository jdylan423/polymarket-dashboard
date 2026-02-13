# Calculator Dashboard (Laundromat Deals)

Next.js web UI for the laundromat investment calculator.

## Features

- Mission Control-inspired dark theme (Tailwind palette + JetBrains Mono)
- Single deal input form
- Side-by-side comparison (2–4 deals)
- Metrics + recommendation badges
- Cash flow projections (monthly cumulative + annual cumulative)
- Charts (Recharts)
- Export to PDF (calculations + charts)
- Save/load scenarios (localStorage)

> Calculation logic matches the CLI in `../tools/investment-calculator/index.js` (same cap rate / CoC / payback + recommendation heuristic).

## Setup

From this folder:

```bash
npm install
npm run dev
```

App runs on: <http://localhost:3002>

## Notes / Implementation Details

- **No debt service is modeled**, just like the CLI. If you want to include loan payments, include them in **Monthly expenses**.
- **Scenario storage** is local to your browser via `localStorage` (key: `laundroCalc.scenarios.v1`).
- **PDF export** uses `html-to-image` + `jspdf` to capture the results panel as an image and embed it in a letter-sized PDF.

## Project Structure

- `src/lib/investmentCalculator.ts` – shared calculation + projection logic
- `src/components/Dashboard.tsx` – UI, charts, scenario management, PDF export

## Build / Start

```bash
npm run build
npm run start
```

Still serves on port **3002**.
