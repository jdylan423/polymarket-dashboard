# Binance Monitor - Quick Start (30 seconds)

## Installation
```bash
pip install aiohttp numpy
```

## Run
```bash
# Option 1: Demo (instant, no API needed)
python3 binance_perps_monitor.py --demo

# Option 2: Live API (single scan)
python3 binance_perps_monitor.py

# Option 3: Continuous (every 30 seconds)
python3 binance_perps_monitor.py --continuous
```

## Example Output (--demo mode)

```
BTCUSDT
  Price: $34,059.98
  Signal: NEUTRAL | Recommendation: SELL
  RSI: 41.08 | Stoch: 37.18%
  Stop Loss: -2.0%

ETHUSDT
  Price: $2,596.79
  Signal: OVERBOUGHT | Recommendation: SELL
  RSI: 77.34 | Stoch: 76.19%
  Stop Loss: -2.5%

SOLUSDT
  Price: $90.92
  Signal: OVERBOUGHT | Recommendation: SELL
  RSI: 61.82 | Stoch: 89.21%
  Stop Loss: -2.5%

ADAUSDT
  Price: $1.06
  Signal: OVERSOLD | Recommendation: HOLD
  RSI: 41.56 | Stoch: 3.73%
  Stop Loss: -1.5%

[... 6 more pairs ...]
```

## Example Output (JSON format - API mode)

```json
{
  "symbol": "BTCUSDT",
  "timestamp": "2026-02-13T03:30:54.219Z",
  "current_price": 42547.89,
  "signal_type": "OVERSOLD",
  "current_rsi": 28.5,
  "current_stochastic": 15.3,
  "recommendation": "BUY",
  "suggested_stop_loss_pct": 2.5,
  "macd_histogram": -1234.56
}
```

## Signal Interpretation

| RSI | Stochastic | Signal | Recommendation | Action |
|-----|-----------|--------|---|---|
| < 30 | < 20 | OVERSOLD | BUY | Entry point, buy on dip |
| > 70 | > 80 | OVERBOUGHT | SELL | Exit point, take profit |
| 30-70 | 20-80 | NEUTRAL | HOLD | Wait for clearer signal |

## What Each Field Means

- **symbol**: Trading pair (e.g., BTCUSDT)
- **current_price**: Latest price from Binance
- **signal_type**: OVERSOLD / OVERBOUGHT / NEUTRAL
- **current_rsi**: RSI value (0-100)
  - < 30 = oversold (potential bounce)
  - > 70 = overbought (potential pullback)
- **current_stochastic**: Stochastic %K value (0-100%)
  - < 20% = oversold
  - > 80% = overbought
- **recommendation**: BUY / SELL / HOLD
- **suggested_stop_loss_pct**: How much to risk if trade goes wrong
  - BUY: 2.5% (price drops 2.5% = exit)
  - SELL: 2.5% (price rises 2.5% = exit)
  - HOLD: 1.5% (safer)
- **macd_histogram**: MACD trend strength (positive/negative)

## Common Use Cases

### Just Check Current Status
```bash
python3 binance_perps_monitor.py
```
Shows all 10 pairs in JSON format. Pipe to file:
```bash
python3 binance_perps_monitor.py > scan.json
```

### Monitor Continuously (Trade Mode)
```bash
python3 binance_perps_monitor.py --continuous
```
Fetches every 30 seconds. Results logged to `binance_monitor.jsonl`.

### Test Before Going Live
```bash
python3 binance_perps_monitor.py --demo
```
Uses mock data. Same indicators, no API calls.

### Check Logs Later
```bash
tail -f binance_monitor.jsonl | python3 -m json.tool
```

## Files Generated

- **binance_monitor.jsonl**: Append-only log of all scans
- **binance_perps_monitor.py**: The main script

## Pairs Monitored

1. BTCUSDT - Bitcoin
2. ETHUSDT - Ethereum
3. SOLUSDT - Solana
4. XRPUSDT - XRP
5. ADAUSDT - Cardano
6. BNBUSDT - Binance Coin
7. AVAXUSDT - Avalanche
8. DOGEUSDT - Dogecoin
9. LINKUSDT - Chainlink
10. UNIUSDT - Uniswap

## Stop Loss Examples

**BUY at $42,000 with 2.5% stop loss:**
- Exit if price drops to: $42,000 × 0.975 = **$40,950**

**SELL at $2,500 with 2.5% stop loss:**
- Exit if price rises to: $2,500 × 1.025 = **$2,562.50**

## Troubleshooting

**"Failed to fetch data" error:**
- Try demo mode: `python3 binance_perps_monitor.py --demo`
- Check internet connection
- Binance API might be down

**"No module named aiohttp":**
```bash
pip install aiohttp numpy
```

**Too slow:**
- Reduce pairs (edit script, keep only 5)
- Increase interval from 30s to 60s

## Next Steps

1. ✅ Run demo: `python3 binance_perps_monitor.py --demo`
2. ✅ Test API: `python3 binance_perps_monitor.py`
3. ✅ Go live: `python3 binance_perps_monitor.py --continuous`
4. ✅ Integrate: Parse JSON, send alerts, execute trades

---

For detailed docs, see: **BINANCE_MONITOR_README.md**
