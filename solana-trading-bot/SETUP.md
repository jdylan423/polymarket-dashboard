# Solana Momentum Trading Bot - Setup & Deployment Guide

## Overview

This is a production-ready autonomous momentum trading bot for Solana that:
- Scans for tokens with strong momentum signals (technical + sentiment)
- Executes trades autonomously with strict risk management
- Includes comprehensive position management and safeguards
- Logs all trades and performance metrics

**Network:** Solana Mainnet  
**Execution:** Local Node.js process  
**Starting Capital:** 2 SOL  
**Risk Management:** Position-level and portfolio-level stops

---

## Prerequisites

1. **Node.js** (v18+): [https://nodejs.org/](https://nodejs.org/)
2. **Solana Mainnet Wallet** with 2+ SOL
3. **API Keys** (optional but recommended):
   - Twitter Bearer Token (for sentiment analysis)
   - Discord Webhook (for trade alerts)

---

## Step 1: Installation

### Clone/Download the Bot

```bash
cd /path/to/solana-trading-bot
npm install
```

### Verify Installation

```bash
node src/bot.js --help
```

You should see the bot attempting to start. Press `CTRL+C` to stop it.

---

## Step 2: Configuration

### Create .env File

Copy the example configuration and customize it:

```bash
cp .env.example .env
```

### Edit .env with Your Settings

Open `.env` and update these critical fields:

```env
# WALLET CONFIGURATION
WALLET_PRIVATE_KEY=[YOUR_PRIVATE_KEY_HERE]
WALLET_ADDRESS=7TCVKKobfYgubXJaQVNnAKjK6QRWVcuZWFxYYDQ2jUrF

# For development/testing
DRY_RUN=false              # Set to 'true' to run in dry-run mode (no real trades)

# API KEYS (Optional)
TWITTER_BEARER_TOKEN=your_bearer_token_here
DISCORD_WEBHOOK_ALERTS=your_discord_webhook_here

# RISK PARAMETERS - Customize as needed
STARTING_CAPITAL_SOL=2
MAX_POSITION_SIZE_SOL=0.5
MAX_SIMULTANEOUS_POSITIONS=4
STOP_LOSS_PERCENT=-20
TAKE_PROFIT_PERCENT=30
PORTFOLIO_STOP_LOSS_PERCENT=-30
```

### Getting Your Private Key

**⚠️ SECURITY WARNING: Never share your private key!**

To export your private key from Phantom/Solflare:

1. Open your Solana wallet (Phantom, Solflare, etc.)
2. Settings → Security → Export Private Key
3. Copy the exported key (usually an array of numbers)
4. Paste into `.env` file

**Example format:**
```
WALLET_PRIVATE_KEY=[1,2,3,4,...,255]
```

---

## Step 3: Test in Dry-Run Mode

Before running with real money, test the bot in dry-run mode:

```env
DRY_RUN=true    # In your .env file
```

Then start the bot:

```bash
npm start
```

You should see:
```
✅ Bot started successfully. Monitoring for trading opportunities...
[DRY RUN] Buy simulated: 0.5 SOL → 50 tokens @ 0.01
[DRY RUN] Sell simulated: 50 tokens → 0.6 SOL @ 0.012
```

Let it run for 5-10 minutes to verify all systems are working.

---

## Step 4: Enable Live Trading

When ready to trade with real money:

```env
DRY_RUN=false    # Enable live trading
```

Restart the bot:

```bash
npm start
```

---

## Running the Bot

### Start the Bot

```bash
npm start
```

### Monitor in Real-Time

In another terminal, tail the logs:

```bash
npm run logs
```

Or directly:

```bash
tail -f logs/trading.log
```

### Development Mode (Auto-reload)

For development with automatic reloading on file changes:

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

---

## Understanding the Bot

### Trading Strategy

The bot uses a momentum trading strategy with **ALL criteria required**:

1. **Technical Screening:**
   - Token liquidity > $1M
   - Token age > 24 hours
   - Strong buy volume in last 4 hours (>60% buy ratio)
   - Price breaking resistance levels (>2.5% daily change)

2. **Sentiment Screening:**
   - Positive sentiment on Twitter/Discord/Telegram
   - Minimum sentiment score: 0.6/1.0
   - Minimum volume trending score: 0.7/1.0

3. **Trade Execution:**
   - Max position size: 0.5 SOL per trade
   - Max simultaneous positions: 4
   - Position-level stop loss: -20%
   - Position-level take profit: +30%

### Risk Management Safeguards

The bot has multiple layers of protection:

1. **Position-Level:**
   - Individual stop loss at -20%
   - Individual take profit at +30%
   - Max position size limited to 0.5 SOL

2. **Portfolio-Level:**
   - Max simultaneous positions: 4
   - Portfolio stop loss (kill switch): -30% of starting capital (0.6 SOL loss)
   - Daily loss limit: 0.6 SOL

3. **Emergency:**
   - All positions automatically closed if portfolio stop loss triggered
   - Bot halts trading if daily loss limit exceeded

### Logs & Monitoring

The bot creates detailed logs:

- **logs/trading.log** - All trading activity
- **logs/trades.log** - Executed trades only
- **logs/sentiment.log** - Sentiment analysis results
- **logs/error.log** - Errors and warnings
- **data/positions.json** - Current and closed positions

---

## Customizing Strategy Parameters

All parameters are in `.env`:

```env
# Minimum token liquidity (USD)
MIN_LIQUIDITY_USD=1000000

# Minimum token age
TOKEN_MIN_AGE_HOURS=24

# How often to scan for new tokens
SCAN_INTERVAL_SECONDS=30

# Buy volume window for trend detection
BUY_VOLUME_WINDOW_HOURS=4

# How much price needs to break resistance
RESISTANCE_BREAKOUT_THRESHOLD=2.5

# Sentiment requirements
MINIMUM_SENTIMENT_SCORE=0.6
MINIMUM_VOLUME_TRENDING_SCORE=0.7
```

### Advanced Tweaks

```env
# Jupiter API slippage tolerance (%)
SLIPPAGE_TOLERANCE=1.5

# Priority fee for faster execution (lamports)
PRIORITY_FEE_LAMPORTS=100000

# Logging
LOG_LEVEL=info              # debug, info, warn, error
DEBUG_MODE=false

# Safeguards
ENABLE_SAFEGUARDS=true      # Always keep true for live trading!
```

---

## Monitoring & Maintenance

### Check Bot Status

View logs to see current trades:
```bash
tail -50 logs/trading.log
```

### Review Performance

Check `data/positions.json` for:
- Win/loss ratio
- Average P&L per trade
- Current open positions
- Total portfolio P&L

### Stop the Bot Safely

Press `Ctrl+C` - the bot will:
1. Stop scanning for new trades
2. Close all open positions at current market price
3. Log final performance metrics
4. Exit gracefully

---

## Troubleshooting

### "Private key required for live trading"

**Solution:** Check that `WALLET_PRIVATE_KEY` is set in `.env` and format is correct.

### "Configuration validation failed"

**Solution:** Verify all required fields in `.env`:
- `WALLET_ADDRESS`
- `WALLET_PRIVATE_KEY` (unless DRY_RUN=true)
- All numeric values are valid

### "Failed to get swap quote"

**Solution:** Jupiter API may be temporarily unavailable. The bot will retry automatically.

### High slippage on trades

**Solution:** Increase `SLIPPAGE_TOLERANCE` in `.env` (default 1.5%) or lower `MAX_POSITION_SIZE_SOL`.

### Bot not finding trading opportunities

**Solution:**
1. Check market conditions - momentum tokens may be rare
2. Lower `RESISTANCE_BREAKOUT_THRESHOLD` in `.env` (currently 2.5%)
3. Verify sentiment APIs are working (Twitter token required)

---

## Security Best Practices

1. **Never commit .env to git** - Add to `.gitignore`
2. **Use a dedicated wallet** - Don't use your main wallet
3. **Start with small amounts** - Test with 0.2 SOL before using full 2 SOL
4. **Monitor constantly** - Check logs regularly
5. **Keep private keys safe** - Use hardware wallet for large amounts
6. **Enable safeguards** - Always keep `ENABLE_SAFEGUARDS=true`

---

## Advanced: Running on VPS

To run the bot 24/7 on a Linux VPS:

### Using PM2 (Process Manager)

```bash
npm install -g pm2

pm2 start src/bot.js --name "solana-bot"
pm2 logs solana-bot
pm2 save
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/solana-bot.service`:

```ini
[Unit]
Description=Solana Momentum Trading Bot
After=network.target

[Service]
Type=simple
User=solana
WorkingDirectory=/home/solana/solana-trading-bot
ExecStart=/usr/bin/node src/bot.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable solana-bot
sudo systemctl start solana-bot
sudo systemctl logs -f solana-bot
```

---

## Support & Resources

- **Solana Docs:** https://docs.solana.com/
- **Jupiter API:** https://jup.ag/docs
- **Web3.js Docs:** https://solana-labs.github.io/solana-web3.js/

---

## DISCLAIMER

This bot trades real money on Solana mainnet. Use at your own risk. The authors assume no responsibility for financial losses. Always:

1. Test thoroughly in dry-run mode
2. Start with small amounts
3. Monitor actively
4. Understand all strategy parameters
5. Keep safeguards enabled

**You are responsible for your own risk management.**

---

## License

MIT
