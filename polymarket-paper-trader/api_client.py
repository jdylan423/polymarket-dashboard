#!/usr/bin/env python3
"""
Polymarket API Client
Handles all API interactions with Polymarket
"""

import requests
import json
from datetime import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class PolymarketAPI:
    def __init__(self, base_url: str = "https://gamma-api.polymarket.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "PolymarketTradingBot/1.0"
        })
    
    def get_markets(self, limit: int = 200, active: bool = True, closed: bool = False) -> List[Dict]:
        """Fetch all markets"""
        try:
            response = self.session.get(
                f"{self.base_url}/markets",
                params={
                    "limit": limit,
                    "active": str(active).lower(),
                    "closed": str(closed).lower()
                },
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching markets: {e}")
            return []
    
    def get_market(self, market_id: str) -> Optional[Dict]:
        """Fetch specific market details"""
        try:
            response = self.session.get(
                f"{self.base_url}/markets/{market_id}",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching market {market_id}: {e}")
            return None
    
    def get_market_prices(self, market_id: str) -> Optional[Dict]:
        """Fetch current prices for a market"""
        market = self.get_market(market_id)
        if not market:
            return None
        
        try:
            outcomes = json.loads(market.get("outcomes", "[]"))
            prices = json.loads(market.get("outcomePrices", "[]"))
            
            return {
                "market_id": market_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "outcomes": outcomes,
                "prices": [float(p) if p else 0 for p in prices],
                "question": market.get("question"),
                "conditionId": market.get("conditionId"),
                "liquidity": float(market.get("liquidity", 0)),
                "volume24hr": float(market.get("volume24hr", 0)),
                "bid": float(market.get("bestBid", 0)),
                "ask": float(market.get("bestAsk", 1)),
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing market prices: {e}")
            return None
    
    def get_order_book(self, condition_id: str) -> Optional[Dict]:
        """Fetch order book for a market condition"""
        try:
            response = self.session.get(
                f"{self.base_url}/order-book",
                params={"conditionId": condition_id},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching order book: {e}")
            return None
    
    def get_market_history(self, market_id: str, limit: int = 100) -> Optional[Dict]:
        """Fetch price history for a market"""
        try:
            response = self.session.get(
                f"{self.base_url}/markets/{market_id}/price-history",
                params={"limit": limit},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching market history: {e}")
            return None
    
    def search_markets(self, query: str, limit: int = 50) -> List[Dict]:
        """Search for markets by keyword"""
        try:
            response = self.session.get(
                f"{self.base_url}/markets",
                params={
                    "search": query,
                    "limit": limit,
                    "active": "true",
                    "closed": "false"
                },
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching markets: {e}")
            return []
    
    def filter_crypto_markets(self, markets: List[Dict]) -> List[Dict]:
        """Filter markets for crypto-related ones"""
        crypto_keywords = ["bitcoin", "ethereum", "solana", "btc", "eth", "sol", "crypto"]
        
        filtered = []
        for market in markets:
            question = market.get("question", "").lower()
            if any(kw in question for kw in crypto_keywords):
                filtered.append(market)
        
        return filtered
    
    def parse_market_data(self, market: Dict) -> Dict:
        """Parse and normalize market data"""
        try:
            outcomes = json.loads(market.get("outcomes", "[]"))
            prices = json.loads(market.get("outcomePrices", "[]"))
            prices = [float(p) if p else 0 for p in prices]
            
            return {
                "id": market.get("id"),
                "question": market.get("question"),
                "slug": market.get("slug"),
                "outcomes": outcomes,
                "prices": prices,
                "liquidity": float(market.get("liquidity", 0)),
                "volume24hr": float(market.get("volume24hr", 0)),
                "volume1d": float(market.get("volume24hr", 0)),
                "endDate": market.get("endDate"),
                "conditionId": market.get("conditionId"),
                "active": market.get("active", False),
                "closed": market.get("closed", False),
                "bid": float(market.get("bestBid", 0)),
                "ask": float(market.get("bestAsk", 1)),
                "spread": float(market.get("bestAsk", 1)) - float(market.get("bestBid", 0)),
            }
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.error(f"Error parsing market data: {e}")
            return {}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test the API
    api = PolymarketAPI()
    
    print("Testing Polymarket API...")
    print("\n1. Fetching active markets...")
    markets = api.get_markets(limit=10, active=True, closed=False)
    print(f"   Got {len(markets)} markets")
    
    print("\n2. Filtering for crypto markets...")
    crypto = api.filter_crypto_markets(markets)
    print(f"   Found {len(crypto)} crypto markets")
    
    if crypto:
        market = crypto[0]
        print(f"\n3. Testing market parsing on: {market.get('question')}")
        parsed = api.parse_market_data(market)
        print(f"   Outcomes: {parsed.get('outcomes')}")
        print(f"   Prices: {parsed.get('prices')}")
        print(f"   Liquidity: ${parsed.get('liquidity', 0):.2f}")
        
        print(f"\n4. Fetching market prices...")
        prices = api.get_market_prices(str(market.get('id')))
        if prices:
            print(f"   Timestamp: {prices['timestamp']}")
            print(f"   Bid/Ask: {prices['bid']:.4f} / {prices['ask']:.4f}")
