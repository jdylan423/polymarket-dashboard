# Deployment Checklist

Copy-paste this checklist and check off as you complete each step.

## Part 1: Deploy Dashboard to Vercel (5 minutes)

- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub (or log in)
- [ ] Click "Import Project"
- [ ] Select your GitHub repo (or paste URL)
- [ ] Click "Import"
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for deployment
- [ ] Copy your Vercel URL (looks like: `https://polymarket-xxxxx.vercel.app`)
- [ ] **Open URL in browser** - should see dashboard!

**Dashboard is now LIVE!** ✓

---

## Part 2: Set Up Supabase (15 minutes)

### Create Supabase Database

- [ ] Go to https://supabase.com
- [ ] Sign up with GitHub (or log in)
- [ ] Click "New Project"
- [ ] Name it: `polymarket`
- [ ] Choose region closest to you
- [ ] Wait for initialization (~2 minutes)

### Create Tables

- [ ] Go to **SQL Editor** in Supabase
- [ ] Click "New Query"
- [ ] **Copy-paste the SQL** from QUICK_DEPLOY.md
- [ ] Click "Run"
- [ ] Wait for tables to be created
- [ ] Should see `trades` and `stats` tables in sidebar

### Get Credentials

- [ ] Go to **Project Settings → API** (left sidebar)
- [ ] Copy **Project URL** (looks like: `https://xxx.supabase.co`)
- [ ] Copy **anon public** key
- [ ] **Save both somewhere safe**

---

## Part 3: Connect to Vercel (5 minutes)

- [ ] Go to **Vercel Dashboard**
- [ ] Click your project
- [ ] Go to **Settings → Environment Variables**
- [ ] Add Variable #1:
  - Name: `NEXT_PUBLIC_SUPABASE_URL`
  - Value: `https://xxx.supabase.co` (your URL from Supabase)
- [ ] Click "Save"
- [ ] Add Variable #2:
  - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Value: your anon key
- [ ] Click "Save"
- [ ] Click **"Deployments"** tab
- [ ] Click **"Redeploy"** on the latest deployment
- [ ] Wait for redeploy (2-3 minutes)

---

## Part 4: Set Up Bot to Sync Trades (5 minutes)

### Install Supabase Client

```bash
pip3 install supabase
```

- [ ] Run above command in terminal

### Set Environment Variables

In your terminal (or add to ~/.bash_profile or ~/.zshrc):

```bash
export SUPABASE_URL='https://xxx.supabase.co'
export SUPABASE_KEY='your-anon-key'
```

- [ ] Set `SUPABASE_URL` (from Supabase)
- [ ] Set `SUPABASE_KEY` (your anon key)

### Run the Bot

```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader
python3 trading_bot_real.py
```

- [ ] Run bot
- [ ] Should see logs like: ✓ Real Polymarket trader initialized
- [ ] Wait for first market check (every 15 minutes)

---

## Part 5: Verify Everything Works (5 minutes)

- [ ] Open your Vercel dashboard: `https://polymarket-xxxxx.vercel.app`
- [ ] Should show stats (even if empty): P&L: $0.00, Win Rate: 0%
- [ ] Bot is running and looking for trades
- [ ] When bot finds a signal → **New trade appears on dashboard**
- [ ] Dashboard updates every 30 seconds

---

## 🎉 Done!

You now have:

✅ **Live Dashboard** - Anyone can view (share the URL)
✅ **Real-time Trades** - Updates as bot trades
✅ **24/7 Trading** - Bot runs locally, syncs to cloud
✅ **Production Ready** - Secure, scalable, reliable

---

## 🆘 Troubleshooting

### Dashboard shows "Failed to load data"
- Check that Supabase environment variables are set in Vercel
- Verify Supabase project is active
- Check browser console for errors

### No trades appearing
- Make sure bot is running: `python3 trading_bot_real.py`
- Check bot logs for errors
- Verify Supabase environment variables are exported in terminal

### "SUPABASE_URL not found" error
- Make sure you exported: `export SUPABASE_URL='...'`
- Or add to ~/.zshrc or ~/.bash_profile
- Source it: `source ~/.zshrc`

### Vercel deployment failed
- Check build logs in Vercel dashboard
- Make sure package.json has all dependencies
- Try `npm install` locally first

---

## 📱 Share Your Dashboard

Once everything is working:

1. Copy your Vercel URL
2. Share with friends/family
3. They can watch your trades in real-time!

Example:
```
Check out my automated trading dashboard!
https://polymarket-xxxxx.vercel.app
```

---

## 📝 After Deployment

**Remember:**
- Bot still runs locally on your machine
- Keep laptop on (or run on VPS)
- Dashboard reflects all trades (even if bot is restarted)
- Supabase database keeps all history

---

**Total time: ~30-40 minutes for full setup**

Need help? Check QUICK_DEPLOY.md for detailed steps. 🚀
