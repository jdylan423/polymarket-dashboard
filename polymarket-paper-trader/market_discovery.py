#!/usr/bin/env python3
"""
Polymarket API - Market Discovery Script
Finds active crypto "Up or Down" markets for BTC, ETH, SOL
"""

import requests
import json
from datetime import datetime

API_BASE = "https://gamma-api.polymarket.com"

def discover_crypto_markets():
    """Fetch active crypto markets from Polymarket"""
    print("🔍 Fetching active Polymarket crypto markets...\n")
    
    try:
        # Get all markets with limit
        response = requests.get(
            f"{API_BASE}/markets",
            params={
                "limit": 200,
                "active": True,
                "closed": False
            },
            timeout=10
        )
        response.raise_for_status()
        markets = response.json()
        
        print(f"✓ Retrieved {len(markets)} active markets\n")
        
        # Filter for crypto "up" or "down" markets
        crypto_keywords = ["bitcoin", "ethereum", "solana", "btc", "eth", "sol"]
        up_down_keywords = ["up", "down", "higher", "lower", "above", "below"]
        
        crypto_markets = []
        
        for market in markets:
            question = market.get("question", "").lower()
            slug = market.get("slug", "").lower()
            
            # Check if it's a crypto market
            is_crypto = any(kw in question or kw in slug for kw in crypto_keywords)
            
            # Check if it's an up/down market
            is_up_down = any(kw in question for kw in up_down_keywords)
            
            if is_crypto and is_up_down:
                crypto_markets.append({
                    "id": market.get("id"),
                    "question": market.get("question"),
                    "slug": market.get("slug"),
                    "active": market.get("active"),
                    "closed": market.get("closed"),
                    "endDate": market.get("endDate"),
                    "outcomes": json.loads(market.get("outcomes", "[]")),
                    "outcomePrices": json.loads(market.get("outcomePrices", "[]")),
                    "liquidity": float(market.get("liquidity", 0)),
                    "volume24hr": float(market.get("volume24hr", 0)),
                    "conditionId": market.get("conditionId"),
                })
        
        # Display results
        print(f"📊 Found {len(crypto_markets)} crypto 'up/down' markets:\n")
        print("=" * 100)
        
        for i, m in enumerate(crypto_markets[:15], 1):  # Show top 15
            print(f"\n{i}. {m['question']}")
            print(f"   Slug: {m['slug']}")
            print(f"   ID: {m['id']}")
            print(f"   Status: {'ACTIVE' if m['active'] else 'INACTIVE'} | {'OPEN' if not m['closed'] else 'CLOSED'}")
            print(f"   Outcomes: {m['outcomes']}")
            print(f"   Prices: {[f'{float(p):.4f}' for p in m['outcomePrices']]}")
            print(f"   Liquidity: ${m['liquidity']:.2f}")
            print(f"   24h Volume: ${m['volume24hr']:.2f}")
            print(f"   Expires: {m['endDate']}")
            print(f"   Condition ID: {m['conditionId']}")
        
        # Save to JSON
        output_file = "discovered_crypto_markets.json"
        with open(output_file, "w") as f:
            json.dump(crypto_markets, f, indent=2)
        
        print(f"\n\n✅ Saved {len(crypto_markets)} markets to {output_file}")
        
        return crypto_markets
        
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        return []

def fetch_market_details(market_id):
    """Fetch detailed info for a specific market"""
    try:
        response = requests.get(
            f"{API_BASE}/markets/{market_id}",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching market {market_id}: {e}")
        return None

def get_order_book(condition_id):
    """Fetch order book for a market condition"""
    try:
        # Polymarket CLOB order book endpoint
        response = requests.get(
            f"{API_BASE}/order-book",
            params={"conditionId": condition_id},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching order book: {e}")
        return None

if __name__ == "__main__":
    print("\n" + "="*100)
    print("POLYMARKET PAPER TRADING - MARKET DISCOVERY")
    print("="*100 + "\n")
    
    markets = discover_crypto_markets()
    
    if markets:
        print("\n" + "="*100)
        print("NEXT STEPS:")
        print("="*100)
        print("""
1. Review discovered_crypto_markets.json for suitable markets
2. Choose markets with:
   - Active status + Open (not closed)
   - Reasonable liquidity (>$1000 preferred)
   - 24h volume (indicates trading activity)
   - Clear "Up" or "Down" outcomes

3. Use market IDs and condition IDs for trading:
   - Market ID: Used in API calls to fetch current prices
   - Condition ID: Used for order book and trading orders

4. Next: Build the trading bot with mean-reversion strategy
        """)
