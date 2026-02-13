#!/usr/bin/env python3
"""
Polymarket CLOB Client
Real trading on Polymarket using API credentials
"""

import requests
import json
import time
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class PolymarketCLOBClient:
    """Client for Polymarket CLOB API - Real trading"""
    
    def __init__(self, api_key: str, api_secret: str, api_passphrase: str, 
                 host: str = "https://clob.polymarket.com"):
        self.api_key = api_key
        self.api_secret = api_secret
        self.api_passphrase = api_passphrase
        self.host = host
        self.session = requests.Session()
    
    def _generate_signature(self, timestamp: str, method: str, path: str, body: str = "") -> str:
        """Generate HMAC-SHA256 signature for request"""
        message = timestamp + method + path + body
        signature = hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        # Base64 encode
        import base64
        return base64.b64encode(signature).decode()
    
    def _request(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Make authenticated request to Polymarket CLOB API"""
        try:
            url = f"{self.host}{endpoint}"
            timestamp = str(int(time.time() * 1000))
            
            body = json.dumps(data) if data else ""
            signature = self._generate_signature(timestamp, method, endpoint, body)
            
            headers = {
                "POLY_API_KEY": self.api_key,
                "POLY_SIGNATURE": signature,
                "POLY_TIMESTAMP": timestamp,
                "POLY_PASSPHRASE": self.api_passphrase,
                "Content-Type": "application/json"
            }
            
            if method == "GET":
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = self.session.post(url, headers=headers, json=data, timeout=10)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=10)
            else:
                return None
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"CLOB API Error ({method} {endpoint}): {e}")
            return None
    
    def get_balance(self) -> Optional[Dict]:
        """Get user balance"""
        return self._request("GET", "/user/balance")
    
    def get_orders(self, market_id: str = None) -> Optional[List[Dict]]:
        """Get open orders"""
        endpoint = "/user/orders"
        if market_id:
            endpoint += f"?market={market_id}"
        return self._request("GET", endpoint)
    
    def post_order(self, order: Dict) -> Optional[Dict]:
        """Post a signed order to the order book
        
        order should contain:
        {
            "market": "market_id",
            "side": "BUY" or "SELL",
            "amount": 100,
            "price": 0.65,
            "saltNonce": 0
        }
        """
        return self._request("POST", "/order", order)
    
    def cancel_order(self, order_id: str) -> Optional[Dict]:
        """Cancel an open order"""
        return self._request("DELETE", f"/order/{order_id}")
    
    def cancel_all_orders(self, market_id: str = None) -> Optional[Dict]:
        """Cancel all open orders, optionally for a specific market"""
        endpoint = "/user/orders"
        if market_id:
            endpoint += f"?market={market_id}"
        return self._request("DELETE", endpoint)
    
    def get_trades(self, limit: int = 50) -> Optional[List[Dict]]:
        """Get user's trade history"""
        return self._request("GET", f"/user/trades?limit={limit}")


class PolymarketTrader:
    """Wrapper for simpler trading operations"""
    
    def __init__(self, api_key: str, api_secret: str, api_passphrase: str):
        self.client = PolymarketCLOBClient(api_key, api_secret, api_passphrase)
        self.last_request_time = 0
        self.min_request_interval = 0.1  # Rate limiting
    
    def _rate_limit(self):
        """Simple rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)
        self.last_request_time = time.time()
    
    def get_balance(self) -> Optional[float]:
        """Get current USDC balance"""
        self._rate_limit()
        balance_data = self.client.get_balance()
        if balance_data:
            return float(balance_data.get("balance", 0))
        return None
    
    def place_buy_order(self, market_id: str, price: float, quantity: float) -> Optional[Dict]:
        """Place a buy order"""
        self._rate_limit()
        
        order = {
            "market": market_id,
            "side": "BUY",
            "amount": quantity,
            "price": price,
            "saltNonce": int(time.time() * 1000)
        }
        
        result = self.client.post_order(order)
        if result:
            logger.info(f"Buy order placed: {quantity} @ {price} in market {market_id}")
        return result
    
    def place_sell_order(self, market_id: str, price: float, quantity: float) -> Optional[Dict]:
        """Place a sell order"""
        self._rate_limit()
        
        order = {
            "market": market_id,
            "side": "SELL",
            "amount": quantity,
            "price": price,
            "saltNonce": int(time.time() * 1000)
        }
        
        result = self.client.post_order(order)
        if result:
            logger.info(f"Sell order placed: {quantity} @ {price} in market {market_id}")
        return result
    
    def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        self._rate_limit()
        result = self.client.cancel_order(order_id)
        return result is not None
    
    def get_open_orders(self) -> Optional[List[Dict]]:
        """Get all open orders"""
        self._rate_limit()
        return self.client.get_orders()
    
    def get_trade_history(self, limit: int = 20) -> Optional[List[Dict]]:
        """Get recent trades"""
        self._rate_limit()
        return self.client.get_trades(limit=limit)


if __name__ == "__main__":
    import os
    
    logging.basicConfig(level=logging.INFO)
    
    # Test with encrypted credentials
    api_key = os.getenv("POLYMARKET_API_KEY")
    api_secret = os.getenv("POLYMARKET_API_SECRET")
    api_passphrase = os.getenv("POLYMARKET_API_PASSPHRASE")
    
    if not all([api_key, api_secret, api_passphrase]):
        print("ERROR: Missing Polymarket credentials in environment")
        print("Set: POLYMARKET_API_KEY, POLYMARKET_API_SECRET, POLYMARKET_API_PASSPHRASE")
        exit(1)
    
    trader = PolymarketTrader(api_key, api_secret, api_passphrase)
    
    print("Testing Polymarket CLOB Client...")
    
    # Get balance
    balance = trader.get_balance()
    print(f"Balance: ${balance:.2f}" if balance is not None else "Could not fetch balance")
    
    # Get open orders
    orders = trader.get_open_orders()
    print(f"Open orders: {len(orders) if orders else 0}")
    
    # Get recent trades
    trades = trader.get_trade_history(limit=5)
    if trades:
        print(f"Recent trades ({len(trades)}):")
        for trade in trades:
            print(f"  - {trade}")
