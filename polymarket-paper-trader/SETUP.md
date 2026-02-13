# Polymarket Paper Trading System - Setup Guide

## Overview

This is a **mean-reversion trading bot** for Polymarket prediction markets with:
- ✅ Real-time market monitoring
- ✅ Paper trading (no real money)
- ✅ JSON trade journal
- ✅ HTML dashboard
- ✅ Circuit breaker protection
- ✅ Configurable strategy

## What's Built

### Components

1. **api_client.py** - Polymarket API wrapper
   - Fetch markets
   - Get real-time prices
   - Search markets
   - Filter for crypto

2. **trading_bot.py** - Main trading engine
   - Mean-reversion strategy
   - Signal generation
   - Trade execution (paper)
   - Trade journaling

3. **dashboard_server.py** - Flask web dashboard
   - Real-time stats
   - Trade history
   - Charts (P&L, Win/Loss)
   - Circuit breaker status

4. **config.yaml** - Strategy configuration
   - Position sizing
   - Entry/exit thresholds
   - Risk management

## Installation

### 1. Install Dependencies

```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader
pip3 install -r requirements.txt
```

Required packages:
- `requests` - HTTP requests to Polymarket API
- `pyyaml` - Configuration file parsing
- `flask` - Web dashboard

### 2. Test the System

```bash
# Run the demo (single cycle, no continuous trading)
python3 bot_demo.py
```

Expected output:
- Fetches 500 active markets
- Finds 18 crypto-related markets
- Analyzes Bitcoin market for trading signals
- Shows trade journal status

## Configuration

Edit `config.yaml` to customize:

### Strategy Parameters

```yaml
strategy:
  position_size: 10.0              # Max $ per trade
  target_spread: 0.03              # Target 3% profit
  circuit_breaker_losses: 3        # Stop after 3 losses
  check_interval_minutes: 15       # How often to check

strategy_params:
  oversold_threshold: 0.40         # BUY signal (probability drops below this)
  overbought_threshold: 0.60       # SELL signal (probability rises above this)
```

### Markets

Currently configured to trade:
- Market 540844: "Will bitcoin hit $1m before GTA VI?"

To add more markets:
1. Run `python3 test_api.py` to find market IDs
2. Add to `config.yaml`:
   ```yaml
   markets:
     "540844": "bitcoin"            # Existing
     "NEW_ID": "ethereum"           # Add new
   ```

## Running the System

### Option 1: Single Demo Run

```bash
python3 bot_demo.py
```

Shows one complete analysis cycle without continuous trading.

### Option 2: Continuous Trading Daemon

```bash
python3 trading_bot.py
```

Runs forever, checking markets every 15 minutes (configurable).

**To run in background:**

```bash
nohup python3 trading_bot.py > bot.log 2>&1 &
```

### Option 3: Dashboard Web Interface

```bash
python3 dashboard_server.py
```

Opens at `http://localhost:5001`

Features:
- Real-time stats (Total P&L, Win Rate, etc.)
- Trade history table
- P&L and Win/Loss charts
- Circuit breaker status
- Auto-refresh every 30 seconds

### Option 4: Cron Job (Every 15 Minutes)

Create a single-cycle runner:

```bash
# Create bot_cycle.py if not exists
cat > bot_cycle.py << 'EOF'
import subprocess
import sys

bot = __import__('trading_bot')
b = bot.PolymarketTradingBot("config.yaml")
b._execute_trading_cycle()
EOF
```

Add to crontab:

```bash
crontab -e
```

Add line:

```
*/15 * * * * cd /Users/penn/.openclaw/workspace/polymarket-paper-trader && python3 bot_cycle.py >> bot_cron.log 2>&1
```

## Trading Strategy Explained

### Mean-Reversion Logic

The bot looks for **extreme probability prices** and assumes they'll revert to fair value:

1. **Oversold Signal (BUY)**
   - When YES probability drops below 40%
   - Assume market is too pessimistic
   - Buy YES (bet on reversion upward)

2. **Overbought Signal (SELL)**
   - When YES probability rises above 60%
   - Assume market is too optimistic
   - Sell YES (bet on reversion downward)

3. **No Signal**
   - Prices between 40-60% are "fair"
   - Wait for extreme moves

### Example

Market: "Will bitcoin hit $1M before GTA VI?"

Current prices: YES=0.35, NO=0.65

- YES at 0.35 < 0.40 → **BUY SIGNAL**
- Position: $10 at 0.35
- Target: Sell at 0.38+ (3% spread)
- P&L if exits at 0.38: $0.30 (3.3%)

## Paper Trading (No Real Money)

All trades are recorded in `trades.json`:

```json
{
  "trades": [
    {
      "timestamp": "2026-02-13T14:00:00Z",
      "market_id": "540844",
      "market_name": "Will bitcoin hit $1m before GTA VI?",
      "side": "buy",
      "outcome": "Yes",
      "entry_price": 0.38,
      "position_size": 10,
      "exit_price": 0.42,
      "pnl": 1.05,
      "pnl_pct": 10.5,
      "duration_minutes": 45
    }
  ],
  "stats": {
    "total_trades": 1,
    "wins": 1,
    "losses": 0,
    "win_rate": 100.0,
    "total_pnl": 1.05,
    "consecutive_losses": 0
  }
}
```

## Monitoring

### Log File

```bash
tail -f polymarket_bot.log
```

Shows:
- Market analysis
- Trading signals
- Positions opened/closed
- Statistics updates

### Dashboard

```bash
# In one terminal
python3 dashboard_server.py

# In another
open http://localhost:5001
```

## Risk Management

### Circuit Breaker

Bot automatically stops after **3 consecutive losses** to protect capital.

To reset:
1. Edit `config.yaml` increase `circuit_breaker_losses`
2. Or modify `trades.json` to remove losing trades
3. Restart bot

### Position Limits

- Max $10 per trade (configurable)
- Only trades markets with >$10k liquidity
- Only trades if 24h volume > $1000

### Max Position Duration

Default 4 hours. Close positions that don't resolve within time window.

## Troubleshooting

### "No markets found"

The API discovery is filtering for crypto-related keywords. Markets are there but may not match filters.

**Fix:** Edit `api_client.py`, increase crypto_keywords list:

```python
crypto_keywords = ["bitcoin", "ethereum", "solana", "btc", "eth", "sol", "crypto", "price", "crypto"]
```

### Bot not generating signals

Prices may not be extreme enough. Check:

1. Current market prices: `python3 test_api.py`
2. If YES price is between 0.40-0.60, no signal triggers
3. Adjust `strategy_params` thresholds in `config.yaml`

### Dashboard won't load

Make sure Flask is running:

```bash
pip3 install flask --upgrade
python3 dashboard_server.py
```

Port 5001 may be in use. Change in `dashboard_server.py`:

```python
app.run(host='0.0.0.0', port=5002, debug=True)  # Change port to 5002
```

## Next Steps

1. ✅ **API Discovery** - Find markets (DONE)
2. ✅ **API Client** - Build Polymarket wrapper (DONE)
3. ✅ **Trading Bot** - Mean-reversion engine (DONE)
4. ✅ **Dashboard** - Web UI (DONE)
5. → **Live Testing** - Run demo, monitor results
6. → **Optimization** - Tune strategy parameters based on results
7. → **Integration** - Add real Binance sentiment data (optional)
8. → **Production** - Deploy with proper logging & alerting

## API Reference

### Polymarket API Endpoints

```
GET /markets                    # List markets (limit, active, closed params)
GET /markets/{id}              # Get market details
GET /markets/{id}/price-history # Get price history
GET /order-book                # Order book (conditionId param)
POST /order                    # Place order (requires auth)
```

### Example API Calls

```bash
# Find active crypto markets
curl "https://gamma-api.polymarket.com/markets?limit=500&active=true&closed=false"

# Get specific market
curl "https://gamma-api.polymarket.com/markets/540844"
```

## Questions?

Check:
1. `bot_demo.py` - See full integration example
2. `config.yaml` - Understand all settings
3. `api_client.py` - API wrapper details
4. `trading_bot.py` - Strategy logic

---

**Status:** Ready to trade!

Run `python3 bot_demo.py` to test the system.
