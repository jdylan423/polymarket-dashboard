# Deployment Guide

How to deploy the Polymarket Trading Dashboard to the internet.

## Option 1: Vercel (Easiest)

Vercel is free, fast, and perfect for Next.js apps.

### Quick Start (5 minutes)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Push Dashboard to GitHub**
   ```bash
   cd /Users/penn/.openclaw/workspace
   git add polymarket-trading-dashboard/
   git commit -m "Add Polymarket trading dashboard"
   git push origin main
   ```

3. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repo
   - Click "Import"
   - Leave settings as default
   - Click "Deploy"

4. **Done!**
   - Vercel gives you a URL like: `https://polymarket-dashboard.vercel.app`
   - Dashboard is now live

### With Local Data (Reads trades.json)

**Limitation:** Vercel can't access your local `trades.json`, so no trades show.

**Workaround:**
1. Push `trades.json` to GitHub whenever you want to update
2. Vercel rebuilds automatically
3. Dashboard shows latest trades

To automate this, the bot can commit trades to GitHub:

```python
# In trading_bot_real.py, after closing a trade:
import subprocess

subprocess.run([
    "git", "-C", "/path/to/repo",
    "add", "trades.json"
])
subprocess.run([
    "git", "-C", "/path/to/repo",
    "commit", "-m", f"Update trades - {len(self.journal.data['trades'])} trades"
])
subprocess.run([
    "git", "-C", "/path/to/repo",
    "push", "origin", "main"
])
```

---

## Option 2: Vercel + Supabase (Recommended for Live Data)

Use a free database so your trades sync automatically to Vercel.

### Setup (15 minutes)

#### 1. Create Supabase Database

1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new project (name: `polymarket`, region: closest to you)
4. Wait for initialization (~2 min)
5. Go to SQL Editor
6. Create tables:

```sql
-- Trades table
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
  quantity DECIMAL(20,8),
  exit_price DECIMAL(10,6),
  exit_time TEXT,
  pnl DECIMAL(10,4),
  pnl_pct DECIMAL(10,2),
  duration_minutes INT,
  reason TEXT,
  order_id TEXT,
  real_order BOOLEAN DEFAULT FALSE
);

-- Stats table
CREATE TABLE stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_trades INT,
  wins INT,
  losses INT,
  win_rate DECIMAL(5,2),
  total_pnl DECIMAL(10,4),
  consecutive_losses INT,
  avg_pnl_pct DECIMAL(10,2)
);

-- Enable Row Level Security (RLS) for public access
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public SELECT
CREATE POLICY "Allow public read trades" ON trades
  FOR SELECT USING (true);

CREATE POLICY "Allow public read stats" ON stats
  FOR SELECT USING (true);
```

7. Copy your credentials:
   - Go to Project Settings → API
   - Copy `Project URL` (looks like `https://xxx.supabase.co`)
   - Copy `anon public` key

#### 2. Update Bot to Sync to Supabase

Install Supabase client:
```bash
pip3 install supabase
```

Update `trading_bot_real.py`:

```python
# Add at top
from supabase import create_client, Client
import os

# In __init__:
self.supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# After closing a trade:
try:
    self.supabase.table("trades").insert(trade).execute()
except Exception as e:
    logger.error(f"Failed to sync trade to Supabase: {e}")

# After calculating stats:
try:
    self.supabase.table("stats").update(stats).eq("id", 1).execute()
except Exception as e:
    logger.error(f"Failed to sync stats to Supabase: {e}")
```

#### 3. Set Environment Variables

```bash
# Add to your shell profile or .env file
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_KEY="your-anon-key"
```

#### 4. Update Dashboard API

Replace content of `pages/api/trades.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Fetch trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tradesError) throw tradesError;

    // Fetch latest stats
    const { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (statsError) throw statsError;

    res.status(200).json({
      trades: trades || [],
      stats: stats || {
        total_trades: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_pnl: 0,
        consecutive_losses: 0,
        avg_pnl_pct: 0
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      trades: [],
      stats: {}
    });
  }
}
```

#### 5. Deploy to Vercel

1. Push changes to GitHub:
   ```bash
   git add -A
   git commit -m "Add Supabase integration for live data sync"
   git push origin main
   ```

2. Go to Vercel dashboard
3. Select your project
4. Go to Settings → Environment Variables
5. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-key
   ```
6. Click "Deploy" (or wait for auto-deploy)

7. Check that it's deployed:
   ```bash
   curl https://your-dashboard.vercel.app/api/trades
   ```

---

## Option 3: Self-Hosted (Advanced)

Deploy on your own server with full control.

### Recommended VPS

- **DigitalOcean** ($5/month): https://digitalocean.com
- **Linode** ($5/month): https://linode.com
- **Hetzner** ($3/month): https://hetzner.com

### Setup on Ubuntu/Debian

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
cd /home/ubuntu
git clone https://github.com/yourusername/polymarket-trading-dashboard.git
cd polymarket-trading-dashboard

# Install & build
npm install
npm run build

# Install PM2 (process manager)
sudo npm install -g pm2

# Start app
pm2 start "npm start" --name "dashboard"
pm2 startup
pm2 save

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
```

Add to Nginx config:
```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
# Enable and restart Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

# Setup HTTPS with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Monitoring

Once deployed, monitor your dashboard:

```bash
# Check if API is responding
curl https://your-dashboard.vercel.app/api/trades

# Expected response:
# {
#   "trades": [...],
#   "stats": {...}
# }
```

## Updating Deployed Dashboard

After making changes locally:

```bash
git add .
git commit -m "Update dashboard"
git push origin main
```

- **Vercel:** Auto-deploys on push (2-3 minutes)
- **Self-hosted:** Manual redeploy needed

## Troubleshooting

### "Deployment failed"
- Check build logs in Vercel
- Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

### "No trades showing"
- API not connected to Supabase
- Check environment variables
- Run `/api/trades` in browser to debug

### "Slow dashboard"
- Check Recharts rendering
- Reduce number of displayed trades
- Use Vercel Analytics to identify bottlenecks

---

## Recommended Setup

For best experience:

1. **Dashboard:** Vercel (free, fast, reliable)
2. **Database:** Supabase (free, easy, secure)
3. **Bot:** Local or self-hosted VPS

This gives you:
- ✅ Live data sync
- ✅ Professional hosting
- ✅ Zero cost (free tier)
- ✅ Scalable
- ✅ Secure

---

Need help? Check README.md or ask for support.
