#!/usr/bin/env python3
import requests
import json

API_BASE = "https://gamma-api.polymarket.com"

# Fetch markets
resp = requests.get(
    f"{API_BASE}/markets",
    params={"limit": 500, "active": "true", "closed": "false"},
    timeout=10
)
data = resp.json()

print(f"Total active markets: {len(data)}\n")

# Search for crypto
crypto_found = []
for market in data:
    q = market.get('question', '').lower()
    
    if any(x in q for x in ['bitcoin', 'ethereum', 'btc', 'eth', 'solana', 'sol', 'crypto', 'price']):
        crypto_found.append({
            'question': market.get('question'),
            'slug': market.get('slug'),
            'id': market.get('id'),
            'outcomes': json.loads(market.get('outcomes', '[]')),
            'prices': json.loads(market.get('outcomePrices', '[]')),
            'liquidity': market.get('liquidity', 0),
            'volume24': market.get('volume24hr', 0),
            'conditionId': market.get('conditionId'),
            'endDate': market.get('endDate')
        })

print(f"Crypto-related markets: {len(crypto_found)}\n")
print("=" * 120)

for i, m in enumerate(crypto_found[:20], 1):
    prices = [float(p) if p else 0 for p in m['prices']]
    print(f"\n{i}. {m['question']}")
    print(f"   ID: {m['id']} | Slug: {m['slug']}")
    print(f"   Outcomes: {m['outcomes']}")
    print(f"   Prices: {[round(p, 4) for p in prices]}")
    print(f"   Liquidity: ${float(m['liquidity']) or 0:.2f}")
    print(f"   24h Volume: ${float(m['volume24']) or 0:.2f}")
    print(f"   Expires: {m['endDate']}")
    print(f"   Condition: {m['conditionId'][:20]}...")
