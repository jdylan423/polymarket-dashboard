# Deal Dashboard

Next.js web dashboard for the laundromat **deal-pipeline** SQLite database.

## Features

- Mission Control-inspired dark theme (Tailwind)
- Live deals table
  - Sorting (click column headers)
  - Filtering (search, status, city, min ROI, max price)
  - Row click opens a detail modal (full deal + contact/broker details)
  - Visual indicators (ROI badges, price range badges, status colors)
- Export to PDF (current filtered/sorted rows) using **jsPDF + autotable**
- Stats panel (total, active, averages, price distribution chart)
- Auto-refresh (SWR refresh interval)

## Prereqs

- Node.js 18+ (your workspace is using Node 22)
- Existing SQLite DB created by deal-pipeline:
  - Default path: `../tools/deal-pipeline/data/deals.db`

## Setup

```bash
cd /Users/penn/.openclaw/workspace/deal-dashboard
npm install
```

### Ensure the DB exists

```bash
cd /Users/penn/.openclaw/workspace/tools/deal-pipeline
node src/index.js init
node src/index.js scrape
```

### Configure DB path (optional)

By default the dashboard reads:

`/Users/penn/.openclaw/workspace/tools/deal-pipeline/data/deals.db`

To override, set `DEALS_DB_PATH`:

```bash
cd /Users/penn/.openclaw/workspace/deal-dashboard
# edit .env.local
DEALS_DB_PATH=/absolute/path/to/deals.db
```

## Run (port 3001)

```bash
cd /Users/penn/.openclaw/workspace/deal-dashboard
npm run dev
```

Open: http://localhost:3001

## Notes

- This app opens the SQLite DB in **readonly** mode.
- If the scraper writes with WAL mode, the dashboard can still read safely.
- If you see "DB not found" errors, confirm the file exists or set `DEALS_DB_PATH`.

## Project structure

- `src/app/api/deals` – Route handler that reads from SQLite
- `src/app/api/stats` – Stats endpoint
- `src/components/DealsTable` – Table UI + PDF export
- `src/components/DealModal` – Detail modal
- `src/components/StatsPanel` – Stats cards + price distribution chart
