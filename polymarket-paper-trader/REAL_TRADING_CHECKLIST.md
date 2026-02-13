# Real Trading Checklist

Everything is built and ready. Use this to confirm each step:

## ✅ Setup Complete

- [x] Paper trading bot built (`trading_bot.py`)
- [x] Real trading bot built (`trading_bot_real.py`)
- [x] API client created (`api_client.py`, `polymarket_client.py`)
- [x] Credentials encrypted and stored
- [x] Dashboard built (`dashboard_server.py`)
- [x] Configuration created (`config.yaml`)
- [x] Documentation written (SETUP.md, QUICKSTART.md, README.md)

## 📋 Before Running Real Bot

### 1. Understand the Strategy ✓
- Buys when YES probability < 40% (oversold)
- Sells when YES probability > 60% (overbought)
- $10 per trade (configurable)
- 3-loss circuit breaker (auto-stops)

### 2. Create Polymarket Account ✓
- [x] Account created at polymarket.com
- [x] API credentials generated
- [x] API key stored
- [x] API secret stored
- [x] API passphrase stored

### 3. Fund Account (⏳ PENDING)
- [ ] Go to polymarket.com and login
- [ ] Click "Deposit" or "Cash"
- [ ] Select Solana as source network
- [ ] Get Solana deposit address
- [ ] Send USDC from your Phantom wallet (`B6ozEvGWmVZNLJVqdb95NgPimXot8bXzsu424qHSYbQD`)
- [ ] Recommended: Start with $100-200
- [ ] Wait for bridge to confirm
- [ ] Verify balance on polymarket.com

### 4. Test Connection
```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader

# Check credentials load
python3 credentials.py

# Should output:
# ✓ API Key: 019c5784...265bb4af
# ✓ Secret: 5QEePmM4...RTHTy2Y=
# ✓ Passphrase: 28ef59b1...e50f0f46
```

### 5. (Optional) Configure Bot
Edit `config.yaml`:
```yaml
strategy:
  position_size: 10.0         # Change to 5, 15, 20, etc
  check_interval_minutes: 15  # Change to 5, 10, 30, etc

strategy_params:
  oversold_threshold: 0.40    # More aggressive = 0.35
  overbought_threshold: 0.60  # More aggressive = 0.65
```

## 🚀 Run Real Trading

### Terminal 1: Start the Bot
```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader
python3 trading_bot_real.py
```

Output should show:
```
====================================================================
POLYMARKET REAL TRADING BOT STARTED
====================================================================

✓ Real Polymarket trader initialized
Account Balance: $123.45
```

### Terminal 2: Monitor Dashboard
```bash
cd /Users/penn/.openclaw/workspace/polymarket-paper-trader
python3 dashboard_server.py
```

Then open: **http://localhost:5001**

Shows:
- Real-time balance
- Open positions
- Trade history
- P&L charts
- Circuit breaker status

## 📊 What to Expect

**First Run:**
- Bot checks markets every 15 minutes
- Looks for extreme prices (>0.40 or <0.60)
- If signal found: Places real order
- If no signal: Waits for next cycle

**Trades:**
- Shows in dashboard immediately
- Shows in `trades.json` with `"real_order": True`
- Logged to `polymarket_trading_real.log`

**Circuit Breaker:**
- Counts consecutive losses
- Stops after 3 in a row
- Sends alert to you
- Manual reset required (edit config or trades.json)

## 🛑 Stop the Bot

Press `Ctrl+C` in the terminal running `trading_bot_real.py`

Output:
```
Bot stopped by user
```

## ⚠️ Important Notes

- **Real Money:** This places actual orders with real USDC
- **Start Small:** $10 per trade, $100-200 total
- **Monitor:** Check dashboard first few trades
- **No Guaranteed Profits:** Market conditions vary
- **Circuit Breaker:** Protects against losing streaks
- **Cancel Anytime:** Can manually cancel open orders

## 🆘 Troubleshooting

**"Could not fetch account balance"**
- Check credentials are loaded: `python3 credentials.py`
- Check API credentials are correct
- Check account is funded

**"Insufficient balance for trade"**
- Account balance < $10
- Fund account with more USDC

**"No trading signal"**
- Market prices are fair (0.40-0.60 range)
- Wait for more extreme prices
- Lower thresholds in config.yaml

**Circuit breaker is active**
- 3 consecutive losses detected
- Trading paused
- Clear losses before resuming (edit trades.json or wait)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `trading_bot_real.py` | Real trading bot (MAIN) |
| `polymarket_client.py` | CLOB API wrapper |
| `credentials.py` | Encryption/decryption |
| `config.yaml` | Bot configuration |
| `trades.json` | Trade history |
| `polymarket_trading_real.log` | Bot logs |
| `dashboard_server.py` | Web dashboard |

## ✅ Checklist Summary

- [ ] Fund Polymarket account via Solana
- [ ] Verify balance on polymarket.com
- [ ] Run `python3 credentials.py` (verify output)
- [ ] Start `python3 trading_bot_real.py` in terminal 1
- [ ] Start `python3 dashboard_server.py` in terminal 2
- [ ] Open http://localhost:5001
- [ ] Monitor first 2-3 trades
- [ ] Adjust config if needed
- [ ] Ready to trade!

---

**Questions?** Check SETUP.md or README.md

**Ready when you are!** 🚀
