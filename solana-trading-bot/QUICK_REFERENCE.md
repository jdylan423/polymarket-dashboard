# Quick Reference Guide

## Common Commands

### Starting the Bot
```bash
# Production (live trading)
npm start

# Development (auto-reload)
npm run dev

# Dry-run (no real trades)
# Set DRY_RUN=true in .env, then:
npm start

# Test suite
npm test

# View logs in real-time
npm run logs
```

### Checking Logs
```bash
# All trading activity
tail -f logs/trading.log

# Just trades executed
tail -f logs/trades.log

# Sentiment analysis only
tail -f logs/sentiment.log

# Error logs
tail -f logs/error.log

# Last 100 lines
tail -100 logs/trading.log

# Watch for new errors
grep "ERROR" logs/error.log
```

### Position Information
```bash
# View current positions
cat data/positions.json | jq '.[] | select(.status=="open")'

# View closed trades
cat data/positions.json | jq '.[] | select(.status=="closed")'

# View P&L for specific token
cat data/positions.json | jq '.[] | select(.tokenSymbol=="SOL")'

# Count open positions
cat data/positions.json | jq '[.[] | select(.status=="open")] | length'
```

## Configuration Tweaks

### To Increase Trade Frequency
```env
SCAN_INTERVAL_SECONDS=15        # Scan every 15 seconds instead of 30
```

### To Be More Conservative
```env
STOP_LOSS_PERCENT=-10           # Exit at -10% instead of -20%
TAKE_PROFIT_PERCENT=20          # Exit at +20% instead of +30%
MAX_POSITION_SIZE_SOL=0.25      # Smaller positions
MAX_SIMULTANEOUS_POSITIONS=2    # Fewer concurrent trades
```

### To Be More Aggressive
```env
MIN_LIQUIDITY_USD=500000        # Lower liquidity threshold
RESISTANCE_BREAKOUT_THRESHOLD=1.5  # Lower resistance threshold
MINIMUM_SENTIMENT_SCORE=0.5     # Accept lower sentiment
```

### To Reduce Gas/Fees
```env
SLIPPAGE_TOLERANCE=0.5          # Lower slippage = lower fees
PRIORITY_FEE_LAMPORTS=50000     # Lower priority fee
```

## Monitoring Checklist

### Daily
- [ ] Check `tail -50 logs/trading.log` for activity
- [ ] Verify open positions in `data/positions.json`
- [ ] Check win rate and P&L in position file
- [ ] Confirm wallet balance hasn't dropped unexpectedly

### Weekly
- [ ] Review total P&L
- [ ] Check if any safeguard triggers happened
- [ ] Verify sentiment API is working (check sentiment.log)
- [ ] Review average trade duration and outcomes

### Monthly
- [ ] Analyze performance metrics
- [ ] Consider adjusting strategy parameters
- [ ] Review and clean old logs if needed
- [ ] Update risk parameters based on performance

## Troubleshooting Quick Guide

### Issue: No trades executing
**Check:**
```bash
# Verify bot is running
ps aux | grep bot.js

# Check for sentiment gate failures
grep "failed sentiment" logs/trading.log

# Verify token screening is working
grep "screening complete" logs/trading.log

# Solutions:
# 1. Lower MINIMUM_SENTIMENT_SCORE in .env
# 2. Lower RESISTANCE_BREAKOUT_THRESHOLD in .env
# 3. Check Twitter API key is valid
```

### Issue: High slippage warnings
**Check:**
```bash
# View slippage in trades
grep "priceImpact" logs/trades.log

# Solutions:
# 1. Increase SLIPPAGE_TOLERANCE in .env
# 2. Reduce MAX_POSITION_SIZE_SOL
# 3. Use tokens with higher liquidity only
```

### Issue: Wallet balance dropping fast
**Check:**
```bash
# View all closed trades and their P&L
cat data/positions.json | jq '.[] | {symbol: .tokenSymbol, pnl: .pnl, pnlPercent: .pnlPercent}'

# Count winning vs losing trades
cat data/positions.json | jq '[.[] | select(.status=="closed")] | group_by(.pnl > 0) | map({profitable: .[0].pnl > 0, count: length})'

# Solutions:
# 1. Stop the bot: Ctrl+C
# 2. Review strategy parameters
# 3. Enable dry-run to test changes
# 4. Reduce position sizes or max simultaneous positions
```

### Issue: "Portfolio stop loss triggered"
```bash
# View portfolio P&L
cat data/positions.json | jq '[.[] | select(.status=="closed")] | {totalPnl: map(.pnl) | add, trades: length}'

# Bot will:
# 1. Automatically close all positions
# 2. Stop scanning
# 3. Exit gracefully

# To restart trading:
# 1. Review positions to understand what happened
# 2. Adjust risk parameters
# 3. Restart bot with npm start
```

## Emergency Procedures

### Stop Bot Safely
```bash
# Press Ctrl+C (graceful shutdown)
# Bot will close all positions at current market price
# View final metrics in logs/trading.log
```

### Emergency Close All Positions
```bash
# Already happens automatically if portfolio stop loss triggers
# If needed manually: Edit data/positions.json and set all to "closed"
# Or restart bot with STARTING_CAPITAL_SOL=0 (temporary)
```

### Check Wallet Health
```bash
# Get SOL balance
solana balance [YOUR_WALLET_ADDRESS]

# Or via API (requires curl):
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["YOUR_WALLET_ADDRESS"]}' | jq .result.value
```

## Performance Optimization

### Reduce Resource Usage
```env
LOG_LEVEL=warn                  # Less logging
SCAN_INTERVAL_SECONDS=60        # Scan less frequently
DEBUG_MODE=false                # Disable debug output
```

### Faster Execution
```env
PRIORITY_FEE_LAMPORTS=200000    # Higher priority fee for faster confirmation
SLIPPAGE_TOLERANCE=2.0          # More slippage = more routes = faster
```

### Better Trade Selection
```env
RESISTANCE_BREAKOUT_THRESHOLD=3.0   # Only strong breakouts
MINIMUM_SENTIMENT_SCORE=0.75        # Higher quality sentiment
MINIMUM_VOLUME_TRENDING_SCORE=0.8   # Trending only
```

## Useful Queries

### Find Best Performing Tokens
```bash
cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.pnl > 0)] | sort_by(.pnlPercent) | reverse | .[0:5]'
```

### Find Worst Performing Tokens
```bash
cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.pnl < 0)] | sort_by(.pnlPercent) | .[0:5]'
```

### Calculate Win/Loss Stats
```bash
cat data/positions.json | jq '[.[] | select(.status=="closed")] | {
  totalTrades: length,
  winners: map(select(.pnl > 0)) | length,
  losers: map(select(.pnl < 0)) | length,
  totalPnl: map(.pnl) | add,
  avgWin: map(select(.pnl > 0)) | map(.pnl) | add / length,
  avgLoss: map(select(.pnl < 0)) | map(.pnl) | add / length,
  avgDuration: map(.duration) | add / length
}'
```

### Find Positions by Status
```bash
# Open positions
jq '.[] | select(.status=="open")' data/positions.json

# Closed positions
jq '.[] | select(.status=="closed")' data/positions.json

# Positions closed by take profit
jq '.[] | select(.exitReason=="take_profit")' data/positions.json

# Positions closed by stop loss
jq '.[] | select(.exitReason=="stop_loss")' data/positions.json
```

## Configuration Examples

### Conservative Strategy (Safest)
```env
MAX_POSITION_SIZE_SOL=0.25
MAX_SIMULTANEOUS_POSITIONS=2
STOP_LOSS_PERCENT=-10
TAKE_PROFIT_PERCENT=20
MINIMUM_SENTIMENT_SCORE=0.75
MIN_LIQUIDITY_USD=5000000
SCAN_INTERVAL_SECONDS=60
```

### Balanced Strategy (Recommended)
```env
MAX_POSITION_SIZE_SOL=0.5
MAX_SIMULTANEOUS_POSITIONS=4
STOP_LOSS_PERCENT=-20
TAKE_PROFIT_PERCENT=30
MINIMUM_SENTIMENT_SCORE=0.6
MIN_LIQUIDITY_USD=1000000
SCAN_INTERVAL_SECONDS=30
```

### Aggressive Strategy (High Risk)
```env
MAX_POSITION_SIZE_SOL=1.0
MAX_SIMULTANEOUS_POSITIONS=8
STOP_LOSS_PERCENT=-30
TAKE_PROFIT_PERCENT=50
MINIMUM_SENTIMENT_SCORE=0.5
MIN_LIQUIDITY_USD=100000
SCAN_INTERVAL_SECONDS=15
```

## Monitoring with External Tools

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start src/bot.js --name "solana-bot"

# Monitor
pm2 monit

# View logs
pm2 logs solana-bot

# Stop
pm2 stop solana-bot

# Restart
pm2 restart solana-bot
```

### Using Telegram Alerts (Advanced)
```bash
# In SETUP.md, implement Discord webhook to send alerts
# Example in discordWebhook function:
# - Trade opened
# - Trade closed with P&L
# - Position updates
# - Safeguard triggers
```

## Key Metrics to Track

1. **Win Rate**: % of closed trades that were profitable
2. **Avg Win**: Average P&L of winning trades
3. **Avg Loss**: Average P&L of losing trades
4. **Profit Factor**: Total Win $ / Total Loss $
5. **Max Drawdown**: Largest portfolio loss from peak
6. **Total P&L**: Net profit/loss
7. **Trade Duration**: How long positions stay open

## Support & Resources

- Solana: https://docs.solana.com
- Jupiter: https://jup.ag/docs
- Web3.js: https://solana-labs.github.io/solana-web3.js
- Raydium: https://raydium.io/docs

---

**Need Help?** Check:
1. logs/trading.log - What's happening
2. logs/error.log - What went wrong
3. data/positions.json - Trade history
4. SETUP.md - Detailed configuration
5. README.md - Overview & architecture
