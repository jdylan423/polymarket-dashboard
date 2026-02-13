# Example Outputs & Trading Scenarios

## Scenario 1: Classic Oversold Bounce (BUY Signal)

### Input Data
```
BTC drops from $45,000 to $40,000 in panic selling
```

### Output
```json
{
  "symbol": "BTCUSDT",
  "timestamp": "2026-02-13T15:30:00Z",
  "current_price": 40100.50,
  "signal_type": "OVERSOLD",
  "current_rsi": 25.3,
  "current_stochastic": 12.1,
  "recommendation": "BUY",
  "suggested_stop_loss_pct": 2.5,
  "macd_histogram": -850.25
}
```

### Trading Decision
```
Signal Detected: OVERSOLD (RSI 25.3 < 30, Stoch 12.1% < 20)
Recommendation: BUY
Action: Enter long position
Entry: $40,100.50
Stop Loss: $40,100.50 × (1 - 0.025) = $39,097.99
Target: Wait for RSI to cross 50 (~$41,500)
Risk/Reward: Risk $1,002.51 to potentially gain $1,399.50+
```

---

## Scenario 2: Overbought Rally (SELL Signal)

### Input Data
```
ETH rallies from $2,200 to $2,500 in strong uptrend
```

### Output
```json
{
  "symbol": "ETHUSDT",
  "timestamp": "2026-02-13T16:00:00Z",
  "current_price": 2498.75,
  "signal_type": "OVERBOUGHT",
  "current_rsi": 78.5,
  "current_stochastic": 85.3,
  "recommendation": "SELL",
  "suggested_stop_loss_pct": 2.5,
  "macd_histogram": 125.40
}
```

### Trading Decision
```
Signal Detected: OVERBOUGHT (RSI 78.5 > 70, Stoch 85.3% > 80)
Recommendation: SELL
Action: Enter short position or take profits
Entry: $2,498.75
Stop Loss: $2,498.75 × (1 + 0.025) = $2,561.22
Target: Wait for RSI to drop below 50 (~$2,350)
Risk/Reward: Risk $62.47 to potentially gain $148.75+
```

---

## Scenario 3: Neutral Market (HOLD Signal)

### Input Data
```
SOL trading sideways, no extreme moves
```

### Output
```json
{
  "symbol": "SOLUSDT",
  "timestamp": "2026-02-13T17:15:00Z",
  "current_price": 98.50,
  "signal_type": "NEUTRAL",
  "current_rsi": 52.1,
  "current_stochastic": 48.5,
  "recommendation": "HOLD",
  "suggested_stop_loss_pct": 1.5,
  "macd_histogram": 0.42
}
```

### Trading Decision
```
Signal Detected: NEUTRAL (RSI 52.1, Stoch 48.5%, no extreme)
Recommendation: HOLD
Action: Wait for clearer signal
- Don't enter new positions
- If already in trade, maintain position with 1.5% stop loss
- Watch for next scan showing RSI < 30 or > 70
```

---

## Scenario 4: Full Scan Output (All 10 Pairs)

### Complete JSON Response
```json
{
  "timestamp": "2026-02-13T18:30:00Z",
  "scan_number": 1,
  "total_pairs": 10,
  "pairs_with_signals": 3,
  "data": [
    {
      "symbol": "BTCUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 42500.00,
      "signal_type": "NEUTRAL",
      "current_rsi": 55.2,
      "current_stochastic": 52.1,
      "recommendation": "HOLD",
      "suggested_stop_loss_pct": 1.5,
      "macd_histogram": 150.30
    },
    {
      "symbol": "ETHUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 2300.00,
      "signal_type": "OVERSOLD",
      "current_rsi": 28.5,
      "current_stochastic": 18.2,
      "recommendation": "BUY",
      "suggested_stop_loss_pct": 2.5,
      "macd_histogram": -45.20
    },
    {
      "symbol": "SOLUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 98.00,
      "signal_type": "OVERBOUGHT",
      "current_rsi": 72.1,
      "current_stochastic": 81.3,
      "recommendation": "SELL",
      "suggested_stop_loss_pct": 2.5,
      "macd_histogram": 2.15
    },
    {
      "symbol": "XRPUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 2.45,
      "signal_type": "NEUTRAL",
      "current_rsi": 45.3,
      "current_stochastic": 42.1,
      "recommendation": "HOLD",
      "suggested_stop_loss_pct": 1.5,
      "macd_histogram": -0.05
    },
    {
      "symbol": "ADAUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 0.98,
      "signal_type": "OVERSOLD",
      "current_rsi": 29.2,
      "current_stochastic": 19.5,
      "recommendation": "BUY",
      "suggested_stop_loss_pct": 2.5,
      "macd_histogram": -0.08
    },
    {
      "symbol": "BNBUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 610.00,
      "signal_type": "NEUTRAL",
      "current_rsi": 58.1,
      "current_stochastic": 55.2,
      "recommendation": "HOLD",
      "suggested_stop_loss_pct": 1.5,
      "macd_histogram": 12.40
    },
    {
      "symbol": "AVAXUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 35.50,
      "signal_type": "OVERBOUGHT",
      "current_rsi": 74.2,
      "current_stochastic": 82.1,
      "recommendation": "SELL",
      "suggested_stop_loss_pct": 2.5,
      "macd_histogram": 1.25
    },
    {
      "symbol": "DOGEUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 0.38,
      "signal_type": "NEUTRAL",
      "current_rsi": 50.5,
      "current_stochastic": 50.0,
      "recommendation": "HOLD",
      "suggested_stop_loss_pct": 1.5,
      "macd_histogram": 0.001
    },
    {
      "symbol": "LINKUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 19.50,
      "signal_type": "OVERSOLD",
      "current_rsi": 27.8,
      "current_stochastic": 15.3,
      "recommendation": "BUY",
      "suggested_stop_loss_pct": 2.5,
      "macd_histogram": -0.30
    },
    {
      "symbol": "UNIUSDT",
      "timestamp": "2026-02-13T18:30:00Z",
      "current_price": 5.80,
      "signal_type": "NEUTRAL",
      "current_rsi": 49.2,
      "current_stochastic": 48.9,
      "recommendation": "HOLD",
      "suggested_stop_loss_pct": 1.5,
      "macd_histogram": -0.02
    }
  ]
}
```

### Portfolio Analysis
```
Scan #1 Results:
- Total pairs monitored: 10
- Actionable signals: 3

BUY Signals (3):
  1. ETHUSDT: $2,300 - RSI 28.5, Stoch 18.2% → Potential bounce
  2. ADAUSDT: $0.98 - RSI 29.2, Stoch 19.5% → Oversold
  3. LINKUSDT: $19.50 - RSI 27.8, Stoch 15.3% → Strong oversold

SELL Signals (2):
  1. SOLUSDT: $98.00 - RSI 72.1, Stoch 81.3% → Pullback expected
  2. AVAXUSDT: $35.50 - RSI 74.2, Stoch 82.1% → Overbought

HOLD Signals (5):
  1. BTCUSDT, XRPUSDT, BNBUSDT, DOGEUSDT, UNIUSDT → Neutral zones

Recommendation:
- Best BUY: LINKUSDT (strongest oversold: RSI 27.8)
- Best SELL: SOLUSDT (strongest overbought: RSI 72.1)
- Portfolio Risk: Medium (3 BUY, 2 SELL, balanced)
```

---

## Scenario 5: Risk Management Example

### Single Trade Setup (BTCUSDT BUY Signal)

```
Market Condition: OVERSOLD
Signal: BUY at $40,100
Current Price: $40,100
Stop Loss %: 2.5%

Position Sizing:
  Account Size: $10,000
  Risk per Trade: 1% = $100
  Entry: $40,100
  Stop Loss: $39,097.99
  Quantity: $10,000 / $40,100 = 0.249 BTC (approximately)
  
Trade Setup:
  Entry Order: Market order at $40,100 for 0.249 BTC
  Stop Loss: Limit/Stop at $39,097.99
  Take Profit: First target at $41,200 (RSI = 50)
  
Profit/Loss Scenarios:
  - Worst Case: -$100 (hits stop loss)
  - Best Case: +$547.48 (reaches target at $41,200)
  - Risk/Reward Ratio: 1:5.5 ✓ (Excellent)
```

---

## Scenario 6: Continuous Monitoring Output

### First 3 Scans of Continuous Monitoring

```
SCAN #1 | 2026-02-13T18:30:00Z
─────────────────────────────
BUY Signals: 3 (ETHUSDT, ADAUSDT, LINKUSDT)
SELL Signals: 2 (SOLUSDT, AVAXUSDT)
HOLD Signals: 5

SCAN #2 | 2026-02-13T18:30:30Z
─────────────────────────────
BUY Signals: 2 (ETHUSDT recovered, LINKUSDT still)
SELL Signals: 3 (SOLUSDT + AVAXUSDT + new DOGEUSDT)
HOLD Signals: 5

SCAN #3 | 2026-02-13T18:31:00Z
─────────────────────────────
BUY Signals: 4 (ETHUSDT, ADAUSDT, LINKUSDT, XRPUSDT oversold)
SELL Signals: 1 (SOLUSDT pullback complete, buy again)
HOLD Signals: 5

Trend Analysis:
- Market turning bearish (more SELL signals appearing)
- Potential bottom forming (OVERSOLD signals increasing)
- Best action: Scale in on BUY signals, reduce SELL positions
```

---

## Scenario 7: Trading Signal Combination Example

### Technical Confluence = Stronger Signal

```
When Multiple Indicators Agree:

Example: BTCUSDT
┌─────────────────────────────────────────┐
│ RSI: 25 (< 30)        → OVERSOLD        │
│ Stochastic: 15% (< 20) → OVERSOLD       │
│ MACD: Negative hist.   → BEARISH        │
└─────────────────────────────────────────┘

Analysis:
- 2 indicators agree (oversold)
- MACD shows downtrend potentially bottoming
- Confidence: HIGH
- Signal Strength: STRONG
- Recommendation: STRONG BUY

vs. Weak Signal:

Example: SOLUSDT
┌─────────────────────────────────────────┐
│ RSI: 35 (neutral)      → NO SIGNAL      │
│ Stochastic: 35% (neutral) → NO SIGNAL   │
│ MACD: Slightly positive → Slight bullish│
└─────────────────────────────────────────┘

Analysis:
- No clear indicator agreement
- RSI and Stochastic neutral
- Confidence: LOW
- Signal Strength: WEAK
- Recommendation: HOLD (wait for clearer setup)
```

---

## Scenario 8: Log File Analysis

### Reading binance_monitor.jsonl

```bash
# Get latest scan summary
tail -1 binance_monitor.jsonl | python3 -m json.tool

# Count all BUY signals
grep -o '"recommendation": "BUY"' binance_monitor.jsonl | wc -l

# Get all oversold signals
grep -o '"signal_type": "OVERSOLD"' binance_monitor.jsonl | wc -l

# Export to CSV for analysis
python3 -c "
import json
with open('binance_monitor.jsonl') as f:
    for line in f:
        data = json.loads(line)
        for pair in data['data']:
            print(f\"{pair['timestamp']},{pair['symbol']},{pair['current_price']},{pair['current_rsi']},{pair['recommendation']}\")
" > signals.csv
```

---

## Signal Interpretation Summary

| Situation | RSI | Stochastic | Recommendation | Confidence |
|-----------|-----|-----------|---|---|
| Strong Oversold | 15-25 | 5-15% | **BUY** | HIGH |
| Mild Oversold | 25-30 | 15-20% | **BUY** | MEDIUM |
| Neutral Low | 30-40 | 20-40% | **HOLD** | LOW |
| Neutral | 40-60 | 40-60% | **HOLD** | LOW |
| Neutral High | 60-70 | 60-80% | **HOLD** | LOW |
| Mild Overbought | 70-75 | 80-85% | **SELL** | MEDIUM |
| Strong Overbought | 75-85 | 85-95% | **SELL** | HIGH |

---

## Next Steps

1. **Run demo:** `python3 binance_perps_monitor.py --demo`
2. **Review outputs** above to understand signals
3. **Deploy script:** `python3 binance_perps_monitor.py --continuous`
4. **Implement trading:** Use recommendations to enter/exit trades
5. **Backtest:** Analyze log files to validate strategy

---

**Remember:** Technical indicators are tools to help decision-making, not guaranteed predictors. Always use proper risk management (stop losses, position sizing).
