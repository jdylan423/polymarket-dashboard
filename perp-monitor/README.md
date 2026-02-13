# Perpetuals Leverage Trading Monitor

Real-time monitoring of perpetuals trading pairs for overbought/oversold signals using technical analysis.

## Features

- **Every 30 seconds:** Checks top 10 trading pairs (BTC, ETH, SOL, XRP, ADA, BNB, AVAX, DOGE, LINK, UNI)
- **Technical Indicators:** RSI, Stochastic Oscillator, MACD
- **Signals:** 
  - OVERSOLD_BUY: RSI < 30 + Stochastic < 20
  - OVERBOUGHT_SHORT: RSI > 70 + Stochastic > 80
- **Smart Alerts:** Telegram notifications with confidence scores & volatility-based stop-loss suggestions
- **Stop-Loss Calculation:** 3-12% based on pair volatility

## Setup

### 1. Install Dependencies

```bash
cd /Users/penn/.openclaw/workspace/perp-monitor
pip install -r requirements.txt
```

### 2. Configure Telegram

Get your Telegram bot token and chat ID, then set environment variables:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token_here"
export TELEGRAM_CHAT_ID="your_chat_id_here"
```

Or create a `.env` file:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Run Locally (Test)

```bash
python3 monitor.py
```

You should see:
```
🚀 Starting Perpetuals Monitor
Monitoring: BTC, ETH, SOL, XRP, ADA, BNB, AVAX, DOGE, LINK, UNI
Check interval: 30s
============================================================

[22:28:45 EST] Checking signals...
  BTC: No signal (RSI: 45.23)
  ETH: OVERSOLD_BUY (RSI: 28.5, Conf: 32.1%)
  ...
```

### 4. Run as Daemon (PM2)

```bash
pm2 start ecosystem.config.js
pm2 logs perp-monitor
pm2 save
pm2 startup
```

### 5. Stop Monitoring

```bash
pm2 stop perp-monitor
pm2 delete perp-monitor
```

## Output Format

Each alert includes:
- **Pair & Action:** BTC USDT, BUY/SHORT
- **Price:** Current market price
- **Indicators:** RSI, Stochastic, Volatility
- **Confidence:** 0-100% signal strength
- **Stop Loss:** Suggested stop-loss percentage

## Customization

Edit `monitor.py` to change:
- `TOP_PAIRS` - Which coins to monitor
- `CHECK_INTERVAL` - How often to check (default 30s)
- `RSI_PERIOD` - RSI lookback period (default 14)
- `STOCH_PERIOD` - Stochastic lookback (default 14)
- Telegram alert throttle (default 60s per pair)

## Data Source

Uses **Binance Perpetuals API** (free, no key required for public data):
- https://fapi.binance.com/fapi/v1/klines

No authentication needed for public market data endpoints.

## Logs

```
logs/out.log  - Standard output & alerts
logs/error.log - Errors only
```

View live logs:
```bash
pm2 logs perp-monitor --lines 50
```

---

**Status:** Ready to deploy
**Dependencies:** Installed via requirements.txt
**Next Step:** Get Telegram credentials and start monitoring
