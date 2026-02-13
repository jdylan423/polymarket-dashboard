# Polymarket Paper Trading - Quick Start (5 min)

## TL;DR - Get Started in 30 seconds

```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader

# Install dependencies (one time only)
pip3 install -r requirements.txt

# Option 1: Test the system
python3 bot_demo.py

# Option 2: Start the dashboard
python3 dashboard_server.py
# Then open: http://localhost:5001

# Option 3: Run continuous bot
python3 trading_bot.py
```

## What Happens

### `bot_demo.py` (1-2 seconds)
- Fetches 500 live Polymarket markets
- Filters for crypto-related ones
- Analyzes Bitcoin prediction market
- Shows trade journal stats
- **Best for:** Testing & understanding the system

### `dashboard_server.py` (ongoing)
- Starts Flask web server on http://localhost:5001
- Shows real-time dashboard with charts
- Auto-refreshes every 30 seconds
- Shows trade history table
- **Best for:** Monitoring live trading

### `trading_bot.py` (ongoing, every 15 min)
- Runs in continuous loop
- Checks markets every 15 minutes
- Creates paper trades when signals trigger
- Logs everything to `polymarket_bot.log`
- **Best for:** Actual trading

## How the Strategy Works

### The Idea
Mean-reversion: When probability prices get extreme, they usually bounce back.

### Signals

| Condition | Signal | Action | Logic |
|-----------|--------|--------|-------|
| YES price < 0.40 | OVERSOLD | BUY YES | Market too pessimistic |
| YES price > 0.60 | OVERBOUGHT | SELL YES | Market too optimistic |
| YES price 0.40-0.60 | — | WAIT | Fair value, no signal |

### Example Trade

```
Market: "Will bitcoin hit $1M before GTA VI?"
Current YES price: 0.38 (< 0.40 threshold)

→ BOT SIGNAL: BUY
  Entry price: 0.38
  Position size: $10
  Expected target: 0.41+ (3% profit)

After 45 minutes, YES rises to 0.42
→ BOT SIGNAL: SELL
  Exit price: 0.42
  P&L: +$0.40 (4.2%)
  Win! ✓
```

## Key Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `bot_demo.py` | Test/demo | Never (it's static) |
| `trading_bot.py` | Main bot | To customize signals/logic |
| `dashboard_server.py` | Web UI | To customize dashboard |
| **`config.yaml`** | **⚙️ SETTINGS** | **Whenever you want to tweak strategy** |
| `trades.json` | Trade history | Don't edit (auto-generated) |
| `polymarket_bot.log` | Debug log | Check if something breaks |

## Customizing the Strategy

All config in `config.yaml`:

```yaml
strategy:
  position_size: 10.0              # Change to 5, 15, 20, etc
  circuit_breaker_losses: 3        # Stop after N losses
  check_interval_minutes: 15       # How often to check (5, 10, 30, etc)

strategy_params:
  oversold_threshold: 0.40         # Lower = more aggressive (0.30, 0.35, 0.40)
  overbought_threshold: 0.60       # Higher = more aggressive (0.60, 0.65, 0.70)
```

**Examples:**

**Aggressive (more trades):**
```yaml
oversold_threshold: 0.35
overbought_threshold: 0.65
position_size: 15
check_interval_minutes: 5
```

**Conservative (fewer, bigger wins):**
```yaml
oversold_threshold: 0.25
overbought_threshold: 0.75
position_size: 5
check_interval_minutes: 30
```

## Monitoring

### Dashboard
```bash
python3 dashboard_server.py
open http://localhost:5001
```

Shows:
- Real-time P&L
- Win rate %
- Trade history
- Charts

### Logs
```bash
tail -f polymarket_bot.log
```

Shows:
- When bot runs
- Which markets analyzed
- Signals generated
- Trades created

### Trade Journal
```bash
cat trades.json
```

Shows:
- All past trades
- Entry/exit prices
- P&L per trade
- Overall stats

## Running 24/7

### Option A: Keep Terminal Open
```bash
python3 trading_bot.py
# Runs until you press Ctrl+C
```

### Option B: Background Process
```bash
nohup python3 trading_bot.py > bot.log 2>&1 &
# Runs in background, survives terminal close
```

### Option C: Cron Job (Every 15 Min)
```bash
# Create a single-cycle runner
cat > bot_cycle.py << 'EOF'
from trading_bot import PolymarketTradingBot
bot = PolymarketTradingBot("config.yaml")
bot._execute_trading_cycle()
EOF

# Add to crontab
crontab -e
# Add: */15 * * * * cd /Users/penn/.openclaw/workspace/polymarket-paper-trader && python3 bot_cycle.py
```

### Option D: systemd Service (Advanced)
```bash
# Create polymarket.service file and install with systemctl
# See SETUP.md for details
```

## Troubleshooting

### "No trades generated"
→ Market prices are probably in fair range (0.40-0.60)
→ Try lowering thresholds: `oversold_threshold: 0.35`

### "ModuleNotFoundError: No module named 'flask'"
→ Run: `pip3 install -r requirements.txt`

### "Port 5001 already in use"
→ Change port in `dashboard_server.py`, line ~50:
```python
app.run(host='0.0.0.0', port=5002)  # Change to 5002, 5003, etc
```

### Bot keeps crashing
→ Check `polymarket_bot.log` for errors
→ Try running `python3 bot_demo.py` first to test API connection

## Understanding the Dashboard

```
┌─ Total Trades: 15        ← How many trades executed
├─ Win Rate: 73.3%         ← Percentage of winning trades
├─ Total P&L: $12.45       ← Total profit/loss in dollars
├─ Circuit Breaker: OK     ← Status (OK = operational, ACTIVE = stopped)
├─ Charts                  ← P&L distribution, Win/Loss ratio
└─ Trade History           ← Table of all trades with details
```

## Performance Metrics to Watch

| Metric | Good | Bad | Action |
|--------|------|-----|--------|
| Win Rate | >50% | <40% | Tighten thresholds |
| Avg P&L per trade | >1% | <0% | Increase position size |
| Consecutive losses | <2 | >3 | Lower thresholds (less aggressive) |
| Signals per week | 5-10 | 0 | Lower thresholds (buy/sell more often) |

## Next Level: Tweaking Strategy

1. **Too conservative (few trades)?**
   - Lower `oversold_threshold` to 0.30 or 0.35
   - Raise `overbought_threshold` to 0.65 or 0.70
   - Decrease `check_interval_minutes`

2. **Too aggressive (losing money)?**
   - Raise `oversold_threshold` to 0.45
   - Lower `overbought_threshold` to 0.55
   - Increase position sizing (bigger wins offset losses)

3. **Want faster feedback?**
   - Decrease `check_interval_minutes` to 5 or 10

4. **Want to trade more markets?**
   - Find market IDs in `test_api.py` output
   - Add to `config.yaml` under `markets:`

## FAQ

**Q: Is this using real money?**
A: No! Paper trading only. Trades recorded in `trades.json` but never executed on real Polymarket orders.

**Q: Why 0.40-0.60 thresholds?**
A: Polymarket probabilities are between 0 and 1. 0.40-0.60 captures extremes while avoiding noise.

**Q: Can I trade real money?**
A: Not yet. System is paper-trading only. Would need Polymarket API auth + order execution.

**Q: How long does a trade stay open?**
A: Until exit signal (if overbought/oversold reverses) or 4 hours max (config: `max_position_duration_hours`).

**Q: What if bot is running on my closed laptop?**
A: Use `nohup` or setup cron job so it keeps running without terminal.

## Files Overview

```
polymarket-paper-trader/
├── README.md               ← Strategy explained
├── SETUP.md                ← Full setup guide
├── QUICKSTART.md           ← This file (you are here)
├── api_client.py           ← Polymarket API wrapper
├── trading_bot.py          ← Main bot engine
├── dashboard_server.py     ← Web dashboard
├── bot_demo.py             ← Single-cycle test
├── test_api.py             ← API exploration
├── config.yaml             ← Strategy configuration
├── requirements.txt        ← Python dependencies
├── trades.json             ← Trade journal (auto-created)
├── polymarket_bot.log      ← Bot logs (auto-created)
└── bot_cron.log            ← Cron execution logs (if using cron)
```

## Ready?

Start here:

```bash
python3 bot_demo.py
```

Then:

```bash
python3 dashboard_server.py
open http://localhost:5001
```

Questions? Check `SETUP.md` or look at the code comments.

Happy trading! 🚀
