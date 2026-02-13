# Polymarket Paper Trading System

## API Discovery Results

### Available Crypto Markets
The Polymarket API has identified these crypto-related markets:
- "Will bitcoin hit $1m before GTA VI?" (ID: 540844) ✓ Most active
- "MegaETH market cap >$2B" (ID: 556062)
- "MegaETH market cap >$6B" (ID: 556063)
- "Will MegaETH perform an airdrop by June 30?" (ID: 556108)

**Note:** Polymarket doesn't currently have dedicated short-term "Up/Down" directional markets for crypto like some other platforms do (Deribit, Hyperliquid). However, we can:

1. **Use the available prediction markets** for paper trading
2. **Build mean-reversion logic** on market probability spreads
3. **Use Binance perpetuals data** for directional signals to inform trades

## System Architecture

### Components

```
polymarket-paper-trader/
├── market_discovery.py          # Find and list available markets
├── api_client.py                # Polymarket API wrapper
├── price_monitor.py             # Real-time price fetching
├── trading_bot.py               # Mean-reversion logic + paper trading
├── trades.json                  # Trade journal (paper trading)
├── dashboard.html               # HTML dashboard viewer
├── dashboard_server.py          # Python server for live dashboard
└── config.yaml                  # Bot configuration
```

### Key API Endpoints

```
GET /markets                     # List all markets
GET /markets/{id}               # Get specific market details
GET /order-book                 # Fetch order book for a market
POST /order                     # Place order (requires auth)
```

### Data Structure

Each market has:
- `id`: Unique market identifier
- `conditionId`: Used for orders and order book queries
- `question`: Human-readable market description
- `outcomes`: ["Yes", "No"] (or multiple outcomes)
- `outcomePrices`: Current probabilities [YES_price, NO_price]
- `liquidity`: Total available liquidity
- `volume24hr`: 24-hour trading volume

## Strategy

### Mean-Reversion Logic

Since Polymarket doesn't have true up/down markets, we'll:

1. **Monitor market probability spreads** - If a market is showing extreme YES/NO ratios
2. **Check Binance perpetuals** - Get actual BTC/ETH/SOL price direction
3. **Trade the spread** - If market odds diverge from reality, place a paper trade
4. **Position sizing** - Max $10 per trade
5. **Circuit breaker** - Stop after 3 consecutive losses

### Example: "Will Bitcoin hit $1M?"

- Market shows: YES=0.48, NO=0.52
- If BTC is in uptrend + YES odds drop below 0.40 → Buy YES
- If BTC is in downtrend + YES odds rise above 0.60 → Sell YES
- Target: 2-3% spread capture

## Paper Trading System

All trades logged to `trades.json`:

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
    "total_trades": 0,
    "wins": 0,
    "losses": 0,
    "win_rate": 0,
    "total_pnl": 0,
    "consecutive_losses": 0
  }
}
```

## Dashboard

Real-time HTML dashboard showing:
- Total P&L + Win Rate
- Recent trades with entry/exit
- Circuit breaker status
- Current market prices
- Trade history graph

## Configuration

Create `config.yaml`:

```yaml
strategy:
  position_size: 10           # Max $ per trade
  target_spread: 0.03         # 3% target profit
  circuit_breaker_losses: 3   # Stop after 3 losses
  check_interval_minutes: 15  # Run bot every 15 min

markets:
  # Market ID: [BTC/ETH/SOL indicator]
  540844: "bitcoin"           # "Will bitcoin hit $1M?"
  556062: "ethereum"          # "MegaETH >$2B?"

strategy_params:
  oversold_threshold: 0.40    # Buy if YES < 40%
  overbought_threshold: 0.60  # Sell if YES > 60%
```

## Next Steps

1. ✅ API discovery (markets identified)
2. → Build `api_client.py` (wrapper for API calls)
3. → Build `price_monitor.py` (fetch real-time prices + Binance data)
4. → Build `trading_bot.py` (mean-reversion + paper trading logic)
5. → Build `dashboard.html + dashboard_server.py`
6. → Setup cron job for 15-min execution

Ready to build?
