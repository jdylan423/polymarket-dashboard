# Deploy to Vercel - 5 Minutes

## Step 1: Push to GitHub

```bash
cd /Users/penn/.openclaw/workspace
git add -A
git commit -m "Ready to deploy - $5 per trade, Supabase sync"
git push origin main
```

## Step 2: Deploy Dashboard to Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** (use GitHub login)
3. Click **"Import Project"**
4. Paste your GitHub repo URL or select from list
5. Click **"Import"**
6. **Wait for auto-setup** (should say "polymarket-trading-dashboard")
7. Click **"Deploy"**
8. **Wait 2-3 minutes**
9. You'll get a URL like: `https://polymarket-xxxx.vercel.app`

**Dashboard is now live!** ✓

## Step 3: Connect to Supabase (Optional but Recommended)

For **live trade data** on your dashboard:

### 3a. Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Sign Up"** (use GitHub)
3. Create new project (name: `polymarket`, region: closest to you)
4. **Wait for initialization** (~2 min)

### 3b. Create Database Tables

Go to **SQL Editor** in Supabase and run:

```sql
-- Create trades table
CREATE TABLE trades (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TEXT,
  entry_time TEXT,
  market_id TEXT,
  market_name TEXT,
  side TEXT,
  outcome TEXT,
  entry_price DECIMAL(10,6),
  position_size DECIMAL(10,2),
  exit_price DECIMAL(10,6),
  exit_time TEXT,
  pnl DECIMAL(10,4),
  pnl_pct DECIMAL(10,2),
  duration_minutes INT,
  reason TEXT,
  order_id TEXT,
  real_order BOOLEAN DEFAULT FALSE
);

-- Create stats table
CREATE TABLE stats (
  id BIGINT PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_trades INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_pnl DECIMAL(10,4) DEFAULT 0,
  consecutive_losses INT DEFAULT 0,
  avg_pnl_pct DECIMAL(10,2) DEFAULT 0
);

-- Enable public read access
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON trades FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON stats FOR SELECT USING (true);
```

### 3c. Get Credentials

1. Go to **Project Settings → API** in Supabase
2. Copy:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **anon public** key
3. Save both somewhere

### 3d. Add to Vercel

1. Go to **Vercel Dashboard → Your Project**
2. Click **Settings → Environment Variables**
3. Add two variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

4. Click **"Deploy"** (or just push to GitHub, auto-redeploy)

### 3e. Update Trading Bot

Install Supabase:
```bash
pip3 install supabase
```

Add environment variables:
```bash
export SUPABASE_URL='https://xxx.supabase.co'
export SUPABASE_KEY='your-anon-key'
```

Update `trading_bot_real.py` to use Supabase:

```python
from supabase_sync import get_supabase_client

# In __init__:
self.supabase = get_supabase_client()

# After creating a trade:
if self.supabase:
    self.supabase.insert_trade(trade)

# After calculating stats:
if self.supabase:
    self.supabase.update_stats(stats)
```

## Done! 🎉

### Without Supabase
- Dashboard is live at: `https://your-dashboard.vercel.app`
- Shows stats but no trade data
- (Trades only show on local dashboard)

### With Supabase
- Dashboard is live at: `https://your-dashboard.vercel.app`
- Shows **live trade data** as bot trades
- **Recommended for monitoring**

---

## Accessing Your Dashboard

Once deployed:

```
https://polymarket-xxxxx.vercel.app
```

Share this link with anyone to show your trades in real-time!

---

## Vercel Features

✅ **Free tier includes:**
- Unlimited deployments
- Auto-scaling
- HTTPS/SSL
- Git auto-deploy
- 100 GB bandwidth per month
- Preview deployments for PRs

✅ **No card required**

✅ **Auto-rebuilds on git push**

---

## Troubleshooting

### "Build failed"
- Check build logs in Vercel
- Make sure all dependencies are in `package.json`
- Run `npm install` locally first

### "No trades showing"
- Supabase not set up or credentials wrong
- Check Vercel environment variables
- Verify bot is running and syncing

### "Dashboard is slow"
- Dashboard refreshes every 30 seconds
- More trades = slower loading
- Can optimize by limiting trades shown (edit index.jsx)

---

## Next: Run the Bot

Once dashboard is deployed:

```bash
cd polymarket-paper-trader

# Set Supabase env vars (if using Supabase)
export SUPABASE_URL='https://xxx.supabase.co'
export SUPABASE_KEY='your-anon-key'

# Run the bot
python3 trading_bot_real.py
```

Bot will trade and automatically sync to Supabase.
Dashboard updates every 30 seconds with new trades!

---

**That's it!** Your dashboard is live and ready. 🚀
