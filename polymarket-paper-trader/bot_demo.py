#!/usr/bin/env python3
"""
Polymarket Trading Bot - DEMO
Single trading cycle to test the system
"""

import logging
import yaml
from api_client import PolymarketAPI
from trading_bot import TradeJournal, PolymarketTradingBot
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

def demo():
    """Run a single demo trading cycle"""
    
    print("\n" + "=" * 100)
    print("POLYMARKET PAPER TRADING BOT - DEMO")
    print("=" * 100)
    
    # Load config
    try:
        with open("config.yaml", 'r') as f:
            config = yaml.safe_load(f)
    except FileNotFoundError:
        logger.error("config.yaml not found!")
        return
    
    # Initialize API
    api = PolymarketAPI()
    
    # Fetch markets
    print("\n📊 Fetching crypto markets...")
    markets = api.get_markets(limit=500)
    crypto_markets = api.filter_crypto_markets(markets)
    
    print(f"✓ Found {len(crypto_markets)} crypto-related markets")
    
    # Show top markets
    print("\n📈 Top 5 Crypto Markets:")
    print("-" * 100)
    for i, market in enumerate(crypto_markets[:5], 1):
        parsed = api.parse_market_data(market)
        prices = [round(p, 4) for p in parsed.get('prices', [])]
        print(f"{i}. {parsed.get('question')}")
        print(f"   ID: {parsed.get('id')}")
        print(f"   Outcomes: {parsed.get('outcomes')}")
        print(f"   Prices: {prices}")
        print(f"   Liquidity: ${parsed.get('liquidity'):,.0f} | Volume: ${parsed.get('volume24hr'):,.0f}\n")
    
    # Test with the Bitcoin market
    print("\n" + "=" * 100)
    print("STRATEGY TEST: Mean-Reversion on Bitcoin Market")
    print("=" * 100)
    
    market_id = "540844"  # Will bitcoin hit $1m before GTA VI?
    
    print(f"\nFetching market {market_id}...")
    prices = api.get_market_prices(market_id)
    
    if prices:
        print(f"✓ Market: {prices['question']}")
        print(f"  Outcomes: {prices['outcomes']}")
        print(f"  Prices: YES={prices['prices'][0]:.4f}, NO={prices['prices'][1]:.4f}")
        print(f"  Bid/Ask: {prices['bid']:.4f} / {prices['ask']:.4f}")
        print(f"  Liquidity: ${prices['liquidity']:,.0f}")
        print(f"  24h Volume: ${prices['volume24hr']:,.0f}")
        
        # Check for signals
        params = config["strategy_params"]
        yes_price = prices['prices'][0]
        
        print(f"\n🎯 Signal Analysis:")
        print(f"  Oversold Threshold: {params['oversold_threshold']:.2f}")
        print(f"  Overbought Threshold: {params['overbought_threshold']:.2f}")
        print(f"  Current YES Price: {yes_price:.4f}")
        
        if yes_price < params['oversold_threshold']:
            print(f"  → SIGNAL: BUY (oversold at {yes_price:.4f})")
        elif yes_price > params['overbought_threshold']:
            print(f"  → SIGNAL: SELL (overbought at {yes_price:.4f})")
        else:
            print(f"  → NO SIGNAL (price in normal range)")
    
    # Show existing trades
    print("\n" + "=" * 100)
    print("TRADE JOURNAL STATUS")
    print("=" * 100)
    
    journal = TradeJournal("trades.json")
    stats = journal.get_stats()
    
    print(f"\nTotal Trades: {stats['total_trades']}")
    print(f"Wins: {stats['wins']} | Losses: {stats['losses']}")
    print(f"Win Rate: {stats['win_rate']:.1f}%")
    print(f"Total P&L: ${stats['total_pnl']:.2f}")
    print(f"Avg P&L: {stats['avg_pnl_pct']:.2f}%")
    print(f"Consecutive Losses: {stats['consecutive_losses']}")
    
    if journal.data["trades"]:
        print(f"\nLast 5 Trades:")
        print("-" * 100)
        for i, trade in enumerate(journal.data["trades"][-5:], 1):
            status = "✓" if "exit_price" in trade else "○"
            pnl = trade.get("pnl", "OPEN")
            print(f"{status} {i}. {trade['market_id']} | {trade['side'].upper()} {trade['outcome']} @ {trade['entry_price']:.4f}")
            if isinstance(pnl, (int, float)):
                print(f"     P&L: ${pnl:.2f} ({trade.get('pnl_pct', 0):.1f}%)")
            print()
    
    print("=" * 100)
    print("\nDEMO COMPLETE!")
    print("\nNext steps:")
    print("1. Edit config.yaml to adjust strategy parameters")
    print("2. Run: python3 trading_bot.py (for continuous trading)")
    print("3. Run: python3 dashboard_server.py (for web dashboard)")
    print("4. Setup cron job: */15 * * * * cd /path && python3 bot_single_cycle.py")
    print("=" * 100 + "\n")

if __name__ == "__main__":
    demo()
