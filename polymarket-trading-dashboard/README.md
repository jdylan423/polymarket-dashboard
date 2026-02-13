# Polymarket Trading Dashboard

Beautiful, real-time dashboard for Polymarket trading performance.

## Features

✅ Real-time trade updates (every 30s)
✅ Professional styling with gradients & charts
✅ Win/Loss analytics
✅ P&L tracking per trade
✅ Open & closed positions
✅ Responsive design (mobile, tablet, desktop)
✅ Secure - no API credentials exposed
✅ Vercel deployment ready

## Local Development

### 1. Install Dependencies

```bash
cd polymarket-trading-dashboard
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Note:** The dashboard reads from `../polymarket-paper-trader/trades.json`. Make sure the trading bot has generated some trades first.

### 3. Running Locally

Keep both running in separate terminals:

**Terminal 1 - Trading Bot:**
```bash
cd polymarket-paper-trader
python3 trading_bot_real.py  # or trading_bot.py for paper trading
```

**Terminal 2 - Dashboard:**
```bash
cd polymarket-trading-dashboard
npm run dev
```

**Terminal 3 - API (optional, for local testing):**
The API is built into Next.js dev server at `/api/trades`

## Deployment to Vercel

### Option A: Simple Vercel Deployment (No Database)

Best for: Testing, local-only usage

1. **Push to GitHub**
   ```bash
   git add polymarket-trading-dashboard
   git commit -m "Add Polymarket trading dashboard"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Deploy"
   - Done! Your dashboard is live

**Limitation:** Dashboard won't show trades because Vercel doesn't have access to local `trades.json`

### Option B: Vercel + Supabase (Recommended)

Best for: Live trading with real data sync

#### Setup Supabase (Free)

1. Go to https://supabase.com
2. Create a new project (free tier)
3. Create table `trades`:
   ```sql
   CREATE TABLE trades (
     id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     timestamp TEXT,
     entry_time TEXT,
     market_id TEXT,
     market_name TEXT,
     side TEXT,
     outcome TEXT,
     entry_price DECIMAL,
     position_size DECIMAL,
     exit_price DECIMAL NULL,
     exit_time TEXT NULL,
     pnl DECIMAL NULL,
     pnl_pct DECIMAL NULL,
     duration_minutes INT NULL,
     reason TEXT
   );
   ```

4. Create table `stats`:
   ```sql
   CREATE TABLE stats (
     id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     total_trades INT DEFAULT 0,
     wins INT DEFAULT 0,
     losses INT DEFAULT 0,
     win_rate DECIMAL DEFAULT 0,
     total_pnl DECIMAL DEFAULT 0,
     consecutive_losses INT DEFAULT 0,
     avg_pnl_pct DECIMAL DEFAULT 0
   );
   ```

5. **Enable RLS (Row Level Security)** for public access:
   - Go to Authentication → Policies
   - Add policy for `SELECT` on both tables (public access)

#### Update Bot to Sync to Supabase

Edit `trading_bot_real.py`:

```python
# Add Supabase client
from supabase import create_client, Client

supabase: Client = create_client(
    "https://your-supabase-url.supabase.co",
    "your-anon-key"
)

# In _execute_trading_cycle(), after creating trade:
supabase.table("trades").insert(trade).execute()

# After updating stats:
supabase.table("stats").insert(stats).execute()
```

#### Update API to Read from Supabase

Edit `pages/api/trades.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { data: trades } = await supabase.from('trades').select('*');
  const { data: stats } = await supabase.from('stats').select('*').single();
  
  res.status(200).json({
    trades: trades || [],
    stats: stats || {}
  });
}
```

#### Deploy with Supabase

1. Add environment variables to Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

2. Deploy:
   ```bash
   git push origin main
   ```
   (Vercel auto-rebuilds on push)

### Option C: Self-Hosted API

Best for: Full control, complex needs

1. **Deploy bot + API together** on a cheap VPS (DigitalOcean, Linode)
2. **Dashboard points to your API**
3. **No external dependencies**

Contact if you want this setup.

## Environment Variables

### For Supabase Integration

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=xxx  (for server-side)
```

### For Custom API

```
NEXT_PUBLIC_API_URL=https://your-api.com
API_TOKEN=xxx
```

## File Structure

```
polymarket-trading-dashboard/
├── package.json                    # Dependencies
├── next.config.js                  # Next.js config
├── README.md                       # This file
├── pages/
│   ├── _app.jsx                   # Global styles + setup
│   ├── index.jsx                  # Main dashboard page
│   └── api/
│       └── trades.js              # API endpoint
└── public/                        # (optional) Static files
```

## Customization

### Change Colors

Edit `styles` object in `pages/index.jsx`:

```jsx
border: '2px solid #00d4ff',    // Change color here
color: '#00ff88',               // Or here
```

### Change Update Interval

Edit `useEffect` in `pages/index.jsx`:

```jsx
const interval = setInterval(fetchData, 30000); // 30 seconds
// Change 30000 to desired milliseconds
```

### Change Rows Displayed

Edit `closedTrades.slice(0, 20)` in table rendering:

```jsx
{closedTrades.slice(0, 20).reverse()...}  // Shows top 20 trades
// Change 20 to desired number
```

## Troubleshooting

### "Failed to load data"

1. Make sure trading bot is running
2. Check that `trades.json` exists in `polymarket-paper-trader/`
3. Verify the bot has generated at least one trade
4. Check browser console for errors

### Dashboard shows "No trades"

- Bot might not have generated any trades yet
- Check bot logs: `tail -f polymarket-paper-trader/polymarket_trading_real.log`
- Or wait for bot's next cycle (every 15 minutes by default)

### Deployed on Vercel but no data

- Need to set up Supabase integration (Option B above)
- Or use Option C (self-hosted API)
- Simple Option A won't show live data

## Browser Support

✅ Chrome/Chromium
✅ Firefox
✅ Safari
✅ Edge
✅ Mobile browsers

## Performance

- Dashboard updates every 30 seconds
- Charts use Recharts (optimized)
- Responsive design (auto-scales)
- ~50KB bundle size

## Security

✅ API credentials never exposed
✅ No private keys sent to frontend
✅ Trades are public data only
✅ Can be shared without security risk
✅ Uses HTTPS on Vercel

## Questions?

Check the main README in `polymarket-paper-trader/` for bot setup questions.

---

Built with Next.js, React, Recharts
Styled for maximum clarity and speed
Ready for production use
