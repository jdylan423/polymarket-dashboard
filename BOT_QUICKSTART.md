# Solana Trading Bot - Quick Start Guide

## 🚀 Your Setup is Ready

| Component | Status | Location |
|-----------|--------|----------|
| **Hot Wallet** | ✅ Created | `trading-hot-wallet.json` |
| **Trading Journal** | ✅ Template Ready | `trading.md` |
| **Backtester** | ✅ Built & Tested | `solana_backtester.py` |
| **Backtest Report** | ✅ Generated | `BACKTEST_REPORT.md` & `backtest_report.json` |

---

## 💳 Your Hot Wallet Address

```
9smBPyNZEdSHw9uXBj6DzMSwvJfpTQGaz2EveuaGwPfN
```

**Use this address to:**
1. Send SOL for trading capital
2. Receive token outputs
3. Monitor balance on blockchain explorers (Solscan, Raydium)

---

## 📖 How to Use the Trading Journal

The `trading.md` file is your trading logbook. Update it daily with:

### After Each Trade
```markdown
| 1 | TOKEN | $X.XX | $Y.YY | 1000 | 14:30 | 15:45 | $+10 | +2.5% | Momentum breakout above resistance |
```

### Daily Summary
```markdown
### [2026-02-10] Session Summary
- **Date:** 2026-02-10
- **Starting Balance:** $160.49
- **Ending Balance:** $165.23
- **Session P&L:** +$4.74
```

### Lessons Learned
After each week, write down:
- What worked well
- What didn't work
- Patterns you noticed
- Adjustments to make

---

## 🔬 How to Run the Backtester

### Basic Run
```bash
cd ~/.openclaw/workspace
python3 solana_backtester.py
```

### Output
- Console report with statistics
- `backtest_report.json` with detailed data
- Shows tokens scanned, matched, and trades

### Customize the Backtest
Edit these lines in `solana_backtester.py`:

```python
backtester = SolanaBacktester(initial_balance=160.0)  # Change capital
backtester.run_backtest(num_days=1, tokens_per_day=150)  # Change period/volume
```

---

## 📊 Key Metrics to Monitor

### Daily
- **Win Rate:** Wins / Total Trades × 100
- **P&L %:** Total P&L / Capital × 100
- **Open Positions:** Count of active trades

### Weekly
- **Profit Factor:** Total Wins / Total Losses
- **Avg Win vs Avg Loss:** Ratio > 1.5 is good
- **Max Drawdown:** Peak to trough decline

### Monthly
- **Sharpe Ratio:** Returns adjusted for volatility
- **Return per Trade:** Total Return / # Trades
- **System Consistency:** Are results repeatable?

---

## ⚙️ Your Trading Rules (Don't Break These!)

| Rule | Value | Why |
|------|-------|-----|
| **Max Per Trade** | $40 | Limit single-position risk |
| **Max Open Positions** | 4 | Limit total portfolio risk |
| **Stop Loss** | -20% | Prevent catastrophic losses |
| **Take Profit** | +30% | Lock in winners |
| **Portfolio Stop** | -30% | Halt trading if down $48 |

---

## 🔍 Token Entry Criteria

Your bot only trades tokens that meet ALL of these:

- **Liquidity:** >$1,000,000 USD (ability to buy/sell without slippage)
- **Age:** >24 hours old (not brand new/honeypot risk)
- **Volume Spike:** 2x increase in last 4 hours (momentum signal)
- **Daily Volume:** >$100,000 USD (liquid enough to exit)

This filter reduces False Positives and increases quality of trades.

---

## 🚨 Risk Management Rules

### You MUST Stop Trading If:
1. Portfolio drops below $112 (30% loss from $160)
2. 3 consecutive losing trades
3. Win rate falls below 40% in last 10 trades

### You SHOULD Review If:
- Losing more than 2 trades in a row
- Average loss > Average win (fix entry or exit)
- Same token appears in losses multiple times

---

## 🔗 Integration with Real APIs (Next Step)

The backtester is ready for:

### Birdeye API
```
GET https://api.birdeye.so/v1/tokenlist?sort_by=watch_cnt&sort_type=desc&limit=50
```
Get real Solana tokens with liquidity, volume, holders.

### Jupiter API
```
GET https://quote-api.jup.ag/v1/quote?inputMint=&outputMint=&amount=
```
Get live price quotes for entry/exit simulation.

### Twitter API v2
```
GET https://api.twitter.com/2/tweets/search/recent?query=token_name
```
Get sentiment mentions for token validation.

---

## 📝 Daily Checklist

### Morning (Before Market Opens)
- [ ] Check SOL balance in wallet
- [ ] Review previous day's trades in `trading.md`
- [ ] Run backtester to validate rules
- [ ] Check social sentiment for hot tokens

### During Trading
- [ ] Monitor open positions every 30 mins
- [ ] Log entries/exits in trading journal
- [ ] Capture screenshots of quality setups
- [ ] Note any unusual market behavior

### Evening (After Market Closes)
- [ ] Update trading.md with daily summary
- [ ] Calculate daily P&L
- [ ] Review win/loss reasons
- [ ] Plan improvements for tomorrow

---

## 💬 Example Trade Journal Entry

```markdown
### [2026-02-10] Session Summary
- **Date:** 2026-02-10
- **Starting Balance:** $160.49
- **Ending Balance:** $168.95
- **Session P&L:** +$8.46 (+5.28%)

| # | Token | Entry | Exit | Qty | Entry Time | Exit Time | P&L | % | Reasoning |
|---|-------|-------|------|-----|-----------|----------|-----|---|-----------|
| 1 | COPE-1234 | $0.00007 | $0.00009 | 600k | 14:32 | 16:15 | +$12 | +8.5% | Volume spike, breaking resistance, positive sentiment |
| 2 | SOL-NEW | $0.00005 | $0.00004 | 800k | 15:00 | 15:45 | -$8 | -4% | False breakout, low volume follow-through |
| 3 | MAG-5678 | $0.00012 | $0.00015 | 300k | 15:30 | 17:20 | +$9 | +3% | Steady climb, took 30% profit |
| 4 | RAY-2023 | $0.00003 | $0.00002 | 1.2m | 16:00 | 16:45 | -$5 | -3% | Stop hit, momentum reversal |

**Session Notes:**
- Best trade: COPE-1234 gained 8.5% on volume confirmation
- Lessons: The two winners had Twitter momentum, losers didn't
- Adjustment: Will add sentiment check before entry
- Tomorrow: Focus on tokens trending on Twitter >100 mentions/hour
```

---

## 🛠️ Troubleshooting

### "Insufficient balance" error
- Check SOL balance in wallet
- Backtester needs $160 minimum (4 × $40)

### Backtest shows 0 trades
- May need to adjust `volume_spike_multiplier` (currently 2.0)
- Or increase `min_age_hours` (currently 24)
- Check token pool with lower minimums

### Can't import Python modules
```bash
pip3 install requests pandas numpy  # If needed
```

### Wallet not found
```bash
solana-keygen list  # Check if keypair is registered
```

---

## 📚 Resources

- **Solana Docs:** https://docs.solana.com
- **Birdeye:** https://birdeye.so
- **Jupiter:** https://jup.ag
- **Raydium:** https://raydium.io
- **Dex Screener:** https://dexscreener.com

---

## 🎯 Success Metrics

Your bot is "winning" when:

- ✅ Win rate stays above 45%
- ✅ Profit factor > 1.2x
- ✅ Monthly ROI > 5%
- ✅ Largest loss < 10% of account
- ✅ Following all rules 100% of the time

---

**You're all set! Start small, track everything, and improve iteratively.** 🚀

Questions? Check `BACKTEST_REPORT.md` for detailed documentation.
