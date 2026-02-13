# 🚀 Solana Momentum Trading Bot

A production-ready autonomous momentum trading bot for Solana DEX tokens with comprehensive risk management and social sentiment analysis.

## 📊 Features

- **Momentum Trading Strategy**: Identifies tokens with strong buy volume, price breakouts, and positive sentiment
- **Multi-Platform Sentiment Analysis**: Twitter, Discord, Telegram integration
- **Jupiter DEX Integration**: Real-time price feeds and swap execution
- **Risk Management**: Position-level stops, portfolio-level safeguards, emergency kill switch
- **Position Management**: Automated entry, exit, P&L tracking
- **Comprehensive Logging**: Trade execution, performance metrics, error tracking
- **Dry-Run Mode**: Test strategy without risking funds
- **Autonomous Execution**: No approval needed (with safeguards in place)

## 🎯 Strategy Overview

### Entry Criteria (ALL required)
✅ Token liquidity > $1M  
✅ Token age > 24 hours  
✅ Strong buy volume in last 4 hours  
✅ Price breaking resistance levels (>2.5%)  
✅ Positive sentiment on social media (score ≥ 0.6)  

### Exit Conditions
📊 Take Profit: +30% gains  
🛑 Stop Loss: -20% loss  
🚨 Portfolio Stop Loss: -30% total loss (kill switch)  

### Risk Parameters
- Starting Capital: 2 SOL
- Max Position Size: 0.5 SOL per trade
- Max Simultaneous Positions: 4
- Daily Loss Limit: 0.6 SOL

## 📦 Project Structure

```
solana-trading-bot/
├── src/
│   ├── bot.js                 # Main bot orchestration
│   ├── config.js              # Configuration loader & validation
│   ├── logger.js              # Winston logging system
│   ├── jupiterData.js         # DEX data fetching & token screening
│   ├── sentimentAnalysis.js   # Social sentiment analysis
│   ├── positionManager.js     # Position tracking & risk management
│   ├── tradeExecution.js      # Trade execution & wallet management
│   └── test.js               # Testing utilities
├── data/
│   └── positions.json         # Persistent position storage
├── logs/
│   ├── trading.log           # All trading activity
│   ├── trades.log            # Executed trades
│   ├── sentiment.log         # Sentiment analysis
│   └── error.log             # Errors & warnings
├── .env.example              # Configuration template
├── .env                      # Your configuration (create from example)
├── package.json              # Dependencies
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Configuration
```bash
cp .env.example .env
# Edit .env with your wallet and API keys
```

### 3. Test in Dry-Run Mode
```bash
# In .env, set: DRY_RUN=true
npm start
```

### 4. Enable Live Trading
```bash
# In .env, set: DRY_RUN=false
npm start
```

## 📝 Configuration

Key environment variables in `.env`:

```env
# Wallet
WALLET_PRIVATE_KEY=your_key_here
WALLET_ADDRESS=7TCVKKobfYgubXJaQVNnAKjK6QRWVcuZWFxYYDQ2jUrF

# Risk Management
STARTING_CAPITAL_SOL=2
MAX_POSITION_SIZE_SOL=0.5
MAX_SIMULTANEOUS_POSITIONS=4
STOP_LOSS_PERCENT=-20
TAKE_PROFIT_PERCENT=30
PORTFOLIO_STOP_LOSS_PERCENT=-30

# Strategy
MIN_LIQUIDITY_USD=1000000
TOKEN_MIN_AGE_HOURS=24
SCAN_INTERVAL_SECONDS=30

# Execution
DRY_RUN=false
SLIPPAGE_TOLERANCE=1.5
ENABLE_SAFEGUARDS=true

# API Keys (Optional)
TWITTER_BEARER_TOKEN=your_bearer_token
DISCORD_WEBHOOK_ALERTS=your_webhook_url
```

See [SETUP.md](SETUP.md) for complete configuration guide.

## 🔍 Monitoring

### View Live Logs
```bash
npm run logs
```

### View Trades
```bash
tail -f logs/trades.log
```

### Check Performance
View `data/positions.json` for:
- Win/loss ratio
- Total P&L
- Open positions
- Closed trades

## 🛡️ Safety Features

1. **Position-Level Protection**
   - Individual stop loss (-20%)
   - Individual take profit (+30%)
   - Max position size (0.5 SOL)

2. **Portfolio-Level Protection**
   - Max 4 simultaneous positions
   - Portfolio stop loss (-30%)
   - Daily loss limit (0.6 SOL)

3. **Safeguard Monitoring**
   - Continuous position monitoring every 10 seconds
   - Automatic exit on stop loss/take profit
   - Emergency close if portfolio stop loss triggered

4. **Execution Safety**
   - Configurable slippage tolerance
   - Priority fee management
   - Transaction confirmation before marking trades complete

## 📊 Architecture

### Data Flow
```
Token Scan (every 30s)
    ↓
Technical Screening (liquidity, volume, price action)
    ↓
Sentiment Analysis (Twitter, Discord, Telegram)
    ↓
Trade Signals (candidates passing ALL criteria)
    ↓
Position Management (entry, exit, P&L tracking)
    ↓
Logging & Monitoring (metrics & performance)
```

### Module Responsibilities

| Module | Responsibility |
|--------|-----------------|
| `bot.js` | Main orchestration & trading loop |
| `jupiterData.js` | Token screening & DEX data |
| `sentimentAnalysis.js` | Social media sentiment scoring |
| `tradeExecution.js` | Wallet & trade execution |
| `positionManager.js` | Position tracking & risk management |
| `logger.js` | Comprehensive logging system |
| `config.js` | Configuration validation |

## 🔄 Trading Loop

1. **Every 30 seconds**: Scan for momentum tokens
2. **Filter technically**: Liquidity, volume, price action
3. **Analyze sentiment**: Twitter, Discord, Telegram scores
4. **Execute trades**: Pass positions to execution module
5. **Monitor positions**: Check exit conditions every 10 seconds
6. **Exit trades**: Auto-exit on stop loss, take profit, or safeguard trigger

## 📈 Performance Tracking

The bot logs detailed metrics:

```json
{
  "totalCapitalDeployed": 1.5,
  "totalRealizedPnl": 0.45,
  "totalUnrealizedPnl": -0.05,
  "totalPnl": 0.40,
  "totalPnlPercent": 20,
  "openPositionsCount": 3,
  "closedPositionsCount": 5,
  "winningTrades": 4,
  "losingTrades": 1,
  "winRate": 80
}
```

## 🚀 Deployment

### Local Machine
```bash
npm start
```

### VPS (24/7)
Use PM2 or systemd (see SETUP.md for details)

### Docker (Optional)
Create Dockerfile for containerized deployment

## ⚠️ Important Notes

1. **Risk Warning**: This bot trades real money. Start with small amounts and test thoroughly in dry-run mode.

2. **Gas Fees**: Solana transactions cost ~0.00005 SOL. The bot accounts for this in profitability calculations.

3. **Market Conditions**: Bot performance depends on market volatility and token availability.

4. **API Limitations**: Jupiter and sentiment APIs have rate limits. Adjust `SCAN_INTERVAL_SECONDS` if needed.

5. **Private Key Security**: Never commit `.env` to version control. Use hardware wallet for large amounts.

## 🛠️ Development

### Run in Development Mode (auto-reload)
```bash
npm run dev
```

### Debug Logging
```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Test Strategy
```bash
npm test
```

## 📚 Resources

- **Solana Docs**: https://docs.solana.com/
- **Jupiter API**: https://jup.ag/docs
- **Web3.js**: https://solana-labs.github.io/solana-web3.js/

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional sentiment data sources
- Advanced technical indicators
- ML-based signal detection
- Performance optimization

## ⚖️ Disclaimer

**This software trades real cryptocurrency. Use at your own risk.**

The authors provide no warranty and assume no responsibility for financial losses. Always:
- Test in dry-run mode first
- Start with small amounts
- Monitor actively
- Understand all strategy parameters
- Keep safeguards enabled

**You are fully responsible for your trading decisions and financial outcomes.**

---

**Ready to trade?** See [SETUP.md](SETUP.md) for detailed setup instructions.
