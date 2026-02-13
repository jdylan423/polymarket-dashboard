# 🚀 Deployment Checklist

Complete this checklist to safely deploy the Solana trading bot.

## Pre-Deployment (Do This First!)

### ✅ Environment Setup
- [ ] Node.js v18+ installed (`node --version`)
- [ ] Working Solana wallet with 2+ SOL
- [ ] Private key extracted from wallet (NOT SHARED WITH ANYONE)
- [ ] Internet connection stable

### ✅ Repository Setup
- [ ] Files extracted to `/Users/penn/.openclaw/workspace/solana-trading-bot/`
- [ ] All 8 source files present in `src/` directory
- [ ] Documentation files present (README.md, SETUP.md, etc.)

### ✅ Dependencies
- [ ] Run `npm install` successfully
- [ ] No installation errors
- [ ] `node_modules/` directory created
- [ ] All dependencies installed (~120 packages)

---

## Configuration Phase

### ✅ Create Configuration File
- [ ] Copy `.env.example` to `.env`
- [ ] `.env` file created successfully
- [ ] `.env` added to `.gitignore` (for safety)

### ✅ Set Wallet Credentials
- [ ] WALLET_ADDRESS set correctly
- [ ] WALLET_PRIVATE_KEY set (format: `[1,2,3,...,255]`)
- [ ] Private key is NEVER committed to git
- [ ] Private key backed up somewhere safe (optional but recommended)

### ✅ Configure Risk Parameters
- [ ] STARTING_CAPITAL_SOL set to 2
- [ ] MAX_POSITION_SIZE_SOL set to 0.5
- [ ] MAX_SIMULTANEOUS_POSITIONS set to 4
- [ ] STOP_LOSS_PERCENT set to -20
- [ ] TAKE_PROFIT_PERCENT set to 30
- [ ] PORTFOLIO_STOP_LOSS_PERCENT set to -30

### ✅ Configure Strategy Parameters
- [ ] MIN_LIQUIDITY_USD set to 1000000
- [ ] TOKEN_MIN_AGE_HOURS set to 24
- [ ] SCAN_INTERVAL_SECONDS set to 30
- [ ] MINIMUM_SENTIMENT_SCORE set to 0.6
- [ ] ENABLE_SAFEGUARDS set to true

### ✅ Optional: API Keys
- [ ] TWITTER_BEARER_TOKEN (optional - get from Twitter Dev Portal)
- [ ] DISCORD_WEBHOOK_ALERTS (optional - for trade notifications)
- [ ] If not available, set to empty string

### ✅ Enable Dry-Run Mode
- [ ] DRY_RUN=true (FOR TESTING ONLY)
- [ ] Verify setting in `.env`

---

## Testing Phase (DRY-RUN MODE)

### ✅ Run Test Suite
```bash
npm test
```
- [ ] All tests pass
- [ ] Configuration validation passes
- [ ] Wallet connection successful
- [ ] No critical errors

### ✅ Start Bot in Dry-Run Mode
```bash
npm start
```
- [ ] Bot starts without errors
- [ ] Logs initialize successfully
- [ ] Bot begins scanning for tokens
- [ ] No crashes in first 2 minutes

### ✅ Monitor Dry-Run Activity
- [ ] Let bot run for 5-10 minutes
- [ ] View logs: `tail -f logs/trading.log`
- [ ] Should see: "Token screening complete"
- [ ] Should see: "[DRY RUN] Buy simulated" messages
- [ ] No actual trades executed (dry-run mode)

### ✅ Verify Logging
- [ ] logs/trading.log created
- [ ] logs/error.log created (may be empty)
- [ ] logs/trades.log created
- [ ] logs/sentiment.log created
- [ ] data/positions.json created (even for dry-run)

### ✅ Review Test Output
```bash
tail -100 logs/trading.log
```
- [ ] Multiple token scans completed
- [ ] Sentiment analysis attempted
- [ ] No errors (or only API warnings)
- [ ] Bot is functional

### ✅ Check Data Persistence
```bash
cat data/positions.json | jq .
```
- [ ] positions.json is valid JSON
- [ ] Positions array exists (even if empty in dry-run)
- [ ] File survives bot restart

### ✅ Stop Bot Gracefully
- [ ] Press `Ctrl+C`
- [ ] Wait for graceful shutdown message
- [ ] No error on exit
- [ ] All files saved properly

---

## Pre-Live Trading Safety Checks

### ✅ Review Configuration One More Time
```bash
grep -E "^[^#]" .env | head -20
```
- [ ] WALLET_ADDRESS correct
- [ ] WALLET_PRIVATE_KEY present
- [ ] DRY_RUN=false (NOT true!)
- [ ] ENABLE_SAFEGUARDS=true
- [ ] All risk parameters reviewed

### ✅ Understand Strategy
- [ ] Read "Strategy Details" in DELIVERABLES.md
- [ ] Understand all entry criteria (5 requirements)
- [ ] Understand all exit conditions (TP/SL/Kill Switch)
- [ ] Know max position size (0.5 SOL)
- [ ] Know portfolio stop loss level (0.6 SOL loss = -30%)

### ✅ Verify Safeguards
- [ ] ENABLE_SAFEGUARDS=true in .env
- [ ] Know how to stop bot: `Ctrl+C`
- [ ] Understand kill switch at -30% loss
- [ ] Know emergency close procedure
- [ ] Reviewed all safeguard layers in DELIVERABLES.md

### ✅ Backup Important Files
- [ ] Backup private key somewhere safe
- [ ] Backup .env file (without sharing it)
- [ ] Know where positions.json is stored
- [ ] Have recovery plan if bot crashes

### ✅ Test Wallet Connection
```bash
node -e "import('./src/tradeExecution.js').then(m => m.default.getSolBalance()).then(b => console.log('SOL Balance:', b))"
```
- [ ] Returns your SOL balance
- [ ] Balance shows 2+ SOL
- [ ] Wallet can be accessed

---

## Live Trading Phase

### ✅ Disable Dry-Run Mode
- [ ] Change DRY_RUN=false in .env
- [ ] Verify the change: `grep DRY_RUN .env`
- [ ] Save file
- [ ] This enables real trading

### ✅ Start Bot with Real Money
```bash
npm start
```
- [ ] Bot starts successfully
- [ ] Logs begin appearing
- [ ] No errors in first 5 messages
- [ ] "Bot started successfully" message appears

### ✅ Monitor First Hour
- [ ] Keep terminal open
- [ ] Watch logs: `npm run logs` in another terminal
- [ ] No trades executed yet? That's OK - strategy is selective
- [ ] Any errors? Fix and restart
- [ ] Bot still running after 60 minutes? ✓

### ✅ First Trade Execution
When first trade executes:
- [ ] Log shows "Trade Executed"
- [ ] Position appears in data/positions.json
- [ ] Position has correct entry price
- [ ] Stop loss and take profit levels set correctly
- [ ] SOL balance decreased

### ✅ Monitor Open Positions
```bash
cat data/positions.json | jq '.[] | select(.status=="open")'
```
- [ ] Position shows "status":"open"
- [ ] All fields populated correctly
- [ ] P&L updating (watch logs for updates)

### ✅ Verify Position Management
- [ ] Watch logs for position updates: `grep "P&L" logs/trading.log`
- [ ] Updates happen every 10 seconds
- [ ] No errors during updates
- [ ] Prices seem reasonable

### ✅ Test Position Exit (Wait for Natural Exit or Manually Close)
When a position closes:
- [ ] Log shows "Position Closed" or "Position Exit Summary"
- [ ] exitPrice, exitReason recorded
- [ ] Final P&L calculated
- [ ] Position status changed to "closed"
- [ ] SOL balance updated

### ✅ Review Closed Trade
```bash
cat data/positions.json | jq '.[] | select(.status=="closed") | {symbol: .tokenSymbol, entry: .entryPrice, exit: .exitPrice, pnl: .pnl, pnlPercent: .pnlPercent}'
```
- [ ] Trade shows profit or loss
- [ ] P&L math is correct
- [ ] Exit reason makes sense (TP/SL)
- [ ] All fields populated

---

## Ongoing Operations Checklist

### ✅ Daily Tasks (Do Every Day)
- [ ] Check logs: `tail -50 logs/trading.log`
- [ ] Verify bot is running: `ps aux | grep bot.js`
- [ ] Check open positions: `cat data/positions.json | jq '.[] | select(.status=="open")'`
- [ ] Verify wallet balance hasn't dropped unexpectedly

### ✅ Weekly Tasks (Do Every Week)
- [ ] Review trade history in data/positions.json
- [ ] Calculate win/loss stats
- [ ] Check total P&L
- [ ] Review strategy parameters (any adjustments needed?)
- [ ] Check if any safeguard was triggered

### ✅ Monthly Tasks (Do Every Month)
- [ ] Calculate performance metrics (win rate, avg trade, etc.)
- [ ] Analyze best/worst performing tokens
- [ ] Review and adjust strategy if needed
- [ ] Archive old logs if needed
- [ ] Backup positions.json and current .env

---

## Emergency Procedures

### ✅ If Bot Crashes
- [ ] Check error logs: `cat logs/error.log`
- [ ] Run test suite: `npm test`
- [ ] Restart bot: `npm start`
- [ ] Monitor logs closely on restart

### ✅ If Losing Money Fast
- [ ] Stop bot: `Ctrl+C`
- [ ] Review last trades: `cat data/positions.json | jq '.' | tail -50`
- [ ] Check portfolio P&L
- [ ] If > -30% loss, review strategy
- [ ] Reduce position sizes in .env
- [ ] Run in dry-run mode to test changes
- [ ] When ready: restart with npm start

### ✅ If Portfolio Stop Loss Triggers
- [ ] Bot automatically closes all positions
- [ ] Bot halts trading automatically
- [ ] Check logs: "🚨 EMERGENCY CLOSE: Portfolio stop loss triggered!"
- [ ] Review what happened in positions.json
- [ ] When ready to trade again: restart bot

### ✅ To Stop Bot Safely
```bash
# Press Ctrl+C
```
- [ ] Bot gracefully shuts down
- [ ] All open positions closed at market price
- [ ] Final metrics logged
- [ ] All files saved
- [ ] No data lost

---

## Security Checklist

### ✅ Private Key Security
- [ ] Private key NEVER shared with anyone
- [ ] Private key NEVER committed to git
- [ ] .env file in .gitignore
- [ ] .env file stored securely on disk
- [ ] .env file has restricted permissions (chmod 600)
- [ ] Private key backed up (optional but recommended)

### ✅ File Security
- [ ] No production .env file in git
- [ ] Only .env.example in git (no secrets)
- [ ] positions.json has recent backup
- [ ] logs directory not shared with others
- [ ] data directory not publicly accessible

### ✅ Wallet Security
- [ ] Using a dedicated wallet for trading (not main wallet)
- [ ] Never using hardware wallet's main address
- [ ] Maximum amount at risk is 2 SOL (starting capital)
- [ ] Surplus SOL kept in main wallet

---

## Verification Checklist

### ✅ Before First Trade
```bash
# 1. Check configuration
npm test

# 2. Verify wallet
node -e "import('./src/tradeExecution.js').then(m => m.default.getSolBalance()).then(b => console.log(b))"

# 3. Test in dry-run
# Set DRY_RUN=true and run bot for 5 min

# 4. Review logs
tail -50 logs/trading.log

# 5. Disable dry-run
# Set DRY_RUN=false

# 6. Start live
npm start
```
- [ ] All steps completed successfully
- [ ] No errors in any step
- [ ] Wallet balance verified
- [ ] Logs look clean
- [ ] Ready for live trading

---

## Sign-Off

### ✅ Deployment Complete When:
- [ ] All pre-deployment checks passed
- [ ] Configuration validated
- [ ] Dry-run testing successful
- [ ] Live trading safeguards verified
- [ ] Bot running smoothly for 1+ hour
- [ ] First trade (if executed) looks correct
- [ ] Emergency procedures understood
- [ ] Security checklist passed
- [ ] Daily monitoring plan in place

**Status**: Ready for production ✅

---

## Contact & Support

If issues arise:
1. Check SETUP.md troubleshooting section
2. Review QUICK_REFERENCE.md for solutions
3. Check logs: `tail -100 logs/error.log`
4. Review DELIVERABLES.md for architecture understanding
5. Run `npm test` to validate all components

---

**Deployment Date**: _________________  
**Initial Balance**: _________ SOL  
**Safeguards Enabled**: ✓ Yes  
**Backup Location**: _________________  

*Keep this checklist for your records.*
