#!/usr/bin/env python3
from api_client import PolymarketAPI
import logging

logging.basicConfig(level=logging.ERROR)

api = PolymarketAPI()

# Get more markets
print("Fetching 500 active markets...")
markets = api.get_markets(limit=500, active=True, closed=False)
print(f"Got {len(markets)} markets\n")

# Filter crypto
crypto = api.filter_crypto_markets(markets)
print(f"Found {len(crypto)} crypto-related markets\n")

# Show them
for i, m in enumerate(crypto[:10], 1):
    parsed = api.parse_market_data(m)
    print(f"{i}. {parsed.get('question')}")
    print(f"   ID: {parsed.get('id')}")
    print(f"   Outcomes: {parsed.get('outcomes')}")
    print(f"   Prices: {[round(p, 4) for p in parsed.get('prices', [])]}")
    print(f"   Liquidity: ${parsed.get('liquidity', 0):,.0f}")
    print()

# Now let's test fetching a specific market's prices
if crypto:
    market = crypto[0]
    mid = market.get('id')
    print(f"Testing market prices for: {market.get('question')}")
    prices = api.get_market_prices(str(mid))
    if prices:
        print(f"Market ID: {prices['market_id']}")
        print(f"Outcomes: {prices['outcomes']}")
        print(f"Prices: {[round(p, 4) for p in prices['prices']]}")
        print(f"Bid: {prices['bid']:.4f}, Ask: {prices['ask']:.4f}")
        print(f"Liquidity: ${prices['liquidity']:,.0f}")
        print(f"24h Volume: ${prices['volume24hr']:,.0f}")
