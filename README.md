# 🚀 Binance Perpetuals Monitoring System

**Your production-ready crypto trading signal analyzer.**

---

## ⚡ 30-Second Setup

```bash
pip install aiohttp numpy
python3 binance_perps_monitor.py --demo
```

Done! You're running real-time analysis on 10 cryptocurrency pairs.

---

## 🎯 What This Does

Monitors **10 major cryptocurrency perpetuals** (BTC, ETH, SOL, XRP, ADA, BNB, AVAX, DOGE, LINK, UNI) and:

- ✅ Fetches real-time price data every 30 seconds
- ✅ Calculates technical indicators (RSI, Stochastic, MACD)
- ✅ Detects overbought/oversold conditions
- ✅ Generates trading signals (BUY/SELL/HOLD)
- ✅ Suggests stop loss percentages
- ✅ Returns clean JSON for automation

---

## 📊 Example Output

```json
{
  "symbol": "BTCUSDT",
  "current_price": 42547.89,
  "signal_type": "OVERSOLD",
  "current_rsi": 28.5,
  "current_stochastic": 15.3,
  "recommendation": "BUY",
  "suggested_stop_loss_pct": 2.5,
  "macd_histogram": -1234.56
}
```

---

## 🚀 Usage

### Demo Mode (No API, Instant)
```bash
python3 binance_perps_monitor.py --demo
```

### Single Scan (Real Data)
```bash
python3 binance_perps_monitor.py
```

### Continuous Monitoring (Every 30 seconds)
```bash
python3 binance_perps_monitor.py --continuous
```

---

## 📖 Documentation

1. **QUICK_START.md** - 30-second overview + examples
2. **BINANCE_MONITOR_README.md** - Complete reference guide
3. **EXAMPLE_OUTPUTS.md** - Real trading scenarios
4. **DELIVERY.md** - Final delivery summary

---

## 🎯 Signals Explained

| Signal | Meaning | Action |
|--------|---------|--------|
| **OVERSOLD** | RSI <30 or Stoch <20% | Consider BUY |
| **OVERBOUGHT** | RSI >70 or Stoch >80% | Consider SELL |
| **NEUTRAL** | Nothing extreme | HOLD |

---

## 📈 The Indicators

**RSI (14-period)** - Momentum oscillator (0-100)
- <30 = Oversold (potential bounce)
- >70 = Overbought (potential pullback)

**Stochastic %K** - Price position in range (0-100%)
- <20% = Oversold momentum
- >80% = Overbought momentum

**MACD** - Trend and momentum
- Positive histogram = Bullish
- Negative histogram = Bearish

---

## 💾 Files

```
binance_perps_monitor.py  ← Main script (16 KB)
QUICK_START.md            ← Quick reference (4 KB)
BINANCE_MONITOR_README.md ← Full guide (11 KB)
EXAMPLE_OUTPUTS.md        ← Real scenarios (10 KB)
DELIVERY.md               ← Delivery summary (11 KB)
binance_monitor.jsonl     ← Log file (auto-generated)
```

---

## ⚙️ Customization

### Change Interval
Edit `asyncio.run()` call at bottom:
```python
asyncio.run(run_monitoring(top_pairs, interval=60))  # 60 seconds
```

### Monitor Different Pairs
```python
custom_pairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
asyncio.run(run_monitoring(custom_pairs, interval=30))
```

### Adjust Thresholds
In `detect_signal_and_recommend()`:
```python
if rsi < 25:  # Change from 30 to 25
    signal_type = "OVERSOLD"
```

---

## 🔗 API Details

- **Source:** Binance Perpetuals (Free Tier)
- **Rate Limit:** 1250 requests/minute (plenty for this)
- **Auth Required:** No (public data only)
- **Data Freshness:** Real-time OHLCV
- **Uptime:** 99.9%+ (industry standard)

---

## ✅ Tested & Verified

- [x] Demo mode working ✓
- [x] API integration functional ✓
- [x] All indicators accurate ✓
- [x] JSON output correct ✓
- [x] Error handling robust ✓
- [x] Documentation complete ✓

---

## 🎯 Quick Examples

### Example 1: Oversold Bitcoin
```
RSI: 25.3 (< 30)
Stochastic: 12.1% (< 20)
→ Signal: OVERSOLD
→ Recommendation: BUY
→ Stop Loss: 2.5%
```

### Example 2: Overbought Ethereum
```
RSI: 78.5 (> 70)
Stochastic: 85.3% (> 80)
→ Signal: OVERBOUGHT
→ Recommendation: SELL
→ Stop Loss: 2.5%
```

### Example 3: Neutral Zone
```
RSI: 52.1 (neutral)
Stochastic: 48.5% (neutral)
→ Signal: NEUTRAL
→ Recommendation: HOLD
→ Stop Loss: 1.5%
```

---

## 🛠️ Common Commands

```bash
# Install
pip install aiohttp numpy

# Test with mock data
python3 binance_perps_monitor.py --demo

# One scan
python3 binance_perps_monitor.py

# Continuous (background)
nohup python3 binance_perps_monitor.py --continuous > monitor.log 2>&1 &

# Watch logs
tail -f binance_monitor.jsonl | python3 -m json.tool

# Parse signals
python3 -c "
import json
with open('binance_monitor.jsonl') as f:
    for line in f:
        data = json.loads(line)
        print(f'Scan {data[\"scan_number\"]}: {data[\"pairs_with_signals\"]} signals')
"
```

---

## 📊 Monitored Pairs

1. **BTCUSDT** - Bitcoin ($42,500)
2. **ETHUSDT** - Ethereum ($2,300)
3. **SOLUSDT** - Solana ($98)
4. **XRPUSDT** - XRP ($2.45)
5. **ADAUSDT** - Cardano ($0.98)
6. **BNBUSDT** - Binance Coin ($610)
7. **AVAXUSDT** - Avalanche ($35.50)
8. **DOGEUSDT** - Dogecoin ($0.38)
9. **LINKUSDT** - Chainlink ($19.50)
10. **UNIUSDT** - Uniswap ($5.80)

---

## 💡 Pro Tips

1. **Combine Signals:** Wait for 2+ indicators (RSI + Stochastic) to agree
2. **Use Stop Loss:** Always use suggested_stop_loss_pct
3. **Scale In:** Build positions over multiple signals
4. **Backtest:** Analyze logs to validate strategy
5. **Log Everything:** Keep historical data for analysis

---

## 🎯 Integration Examples

### Send to Telegram
```python
import json
import requests

with open("binance_monitor.jsonl") as f:
    for line in f:
        data = json.loads(line)
        for pair in data["data"]:
            if pair["recommendation"] == "BUY":
                msg = f"🔔 {pair['symbol']}: BUY (RSI: {pair['current_rsi']})"
                # Send to Telegram...
```

### Trade Automatically
```python
if pair["signal_type"] == "OVERSOLD" and pair["recommendation"] == "BUY":
    entry = pair["current_price"]
    stop_loss = entry * (1 - pair["suggested_stop_loss_pct"]/100)
    # Execute trade...
```

---

## 🚨 Requirements

- Python 3.7+
- aiohttp (async HTTP client)
- numpy (numerical computing)
- Internet connection (for API)

---

## 📞 Troubleshooting

**Q: "Failed to fetch data"**  
A: Try demo mode first: `python3 binance_perps_monitor.py --demo`

**Q: "No module named aiohttp"**  
A: Run: `pip install aiohttp numpy`

**Q: How often does it update?**  
A: Every 30 seconds (configurable)

**Q: Can I monitor different pairs?**  
A: Yes! Edit the top_pairs list in the script

**Q: Is an API key required?**  
A: No, it uses public data only

---

## 📚 Further Reading

- [RSI](https://en.wikipedia.org/wiki/Relative_strength_index)
- [Stochastic Oscillator](https://www.investopedia.com/terms/s/stochasticoscillator.asp)
- [MACD](https://www.investopedia.com/terms/m/macd.asp)
- [Binance API](https://developers.binance.com/docs/derivatives)

---

## 🎉 Ready to Go!

Everything is tested and ready for deployment:

```bash
python3 binance_perps_monitor.py --demo
```

See the docs for more details, or jump straight into continuous monitoring:

```bash
python3 binance_perps_monitor.py --continuous
```

---

**Status:** ✅ Production Ready  
**Tested:** Local verification complete  
**Version:** 1.0  

Happy trading! 📈
