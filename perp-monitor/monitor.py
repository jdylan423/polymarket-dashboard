#!/usr/bin/env python3
"""
OpenSea Perpetuals Leverage Trading Monitor
Monitors overbought/oversold signals and alerts via Telegram
"""

import requests
import json
import time
from datetime import datetime
from collections import defaultdict
import numpy as np
from typing import Dict, List, Tuple
import os
import sys

# Configuration
BINANCE_API = "https://fapi.binance.com"
CHECK_INTERVAL = 30  # seconds
RSI_PERIOD = 14
STOCH_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

# Top pairs to monitor (from the screenshot)
TOP_PAIRS = [
    "BTC", "ETH", "SOL", "XRP", "ADA", 
    "BNB", "AVAX", "DOGE", "LINK", "UNI"
]

# Telegram config
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

class PerpMonitor:
    def __init__(self):
        self.price_history = defaultdict(list)  # Store OHLCV for each pair
        self.signals_log = []
        self.last_alert_time = {}
        
    def get_klines(self, symbol: str, interval: str = "1m", limit: int = 50) -> List:
        """Fetch klines (candlestick) data from Binance"""
        try:
            params = {
                "symbol": f"{symbol}USDT",
                "interval": interval,
                "limit": limit
            }
            response = requests.get(f"{BINANCE_API}/fapi/v1/klines", params=params, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return []
    
    def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period:
            return 50.0
        
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        rs = up / down if down != 0 else 0
        rsi = 100.0 - (100.0 / (1.0 + rs))
        
        for d in deltas[period:]:
            up = (up * (period - 1) + (d if d > 0 else 0)) / period
            down = (down * (period - 1) + (-d if d < 0 else 0)) / period
            rs = up / down if down != 0 else 0
            rsi = 100.0 - (100.0 / (1.0 + rs))
        
        return rsi
    
    def calculate_stochastic(self, prices: List[float], period: int = 14) -> Tuple[float, float]:
        """Calculate Stochastic Oscillator (%K and %D)"""
        if len(prices) < period:
            return 50.0, 50.0
        
        recent = prices[-period:]
        lowest = min(recent)
        highest = max(recent)
        
        if highest == lowest:
            k = 50.0
        else:
            k = 100 * (prices[-1] - lowest) / (highest - lowest)
        
        # %D is 3-period SMA of %K (simplified)
        d = k  # Placeholder for actual calculation
        
        return k, d
    
    def calculate_macd(self, prices: List[float]) -> Tuple[float, float, float]:
        """Calculate MACD"""
        if len(prices) < MACD_SLOW:
            return 0.0, 0.0, 0.0
        
        ema_fast = self.calculate_ema(prices, MACD_FAST)
        ema_slow = self.calculate_ema(prices, MACD_SLOW)
        macd = ema_fast - ema_slow
        
        signal = 0  # Simplified
        histogram = macd - signal
        
        return macd, signal, histogram
    
    def calculate_ema(self, prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return prices[-1] if prices else 0
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        
        for price in prices[period:]:
            ema = price * multiplier + ema * (1 - multiplier)
        
        return ema
    
    def analyze_pair(self, symbol: str) -> Dict:
        """Analyze a single pair for signals"""
        klines = self.get_klines(symbol, interval="1m", limit=50)
        
        if not klines:
            return None
        
        # Extract close prices
        closes = [float(kline[4]) for kline in klines]
        current_price = closes[-1]
        
        # Calculate indicators
        rsi = self.calculate_rsi(closes, RSI_PERIOD)
        stoch_k, stoch_d = self.calculate_stochastic(closes, STOCH_PERIOD)
        macd, signal, histogram = self.calculate_macd(closes)
        
        # Determine signal
        signal_type = None
        confidence = 0
        
        if rsi < 30 and stoch_k < 20:
            signal_type = "OVERSOLD_BUY"
            confidence = min(100, (30 - rsi) + (20 - stoch_k))
        elif rsi > 70 and stoch_k > 80:
            signal_type = "OVERBOUGHT_SHORT"
            confidence = min(100, (rsi - 70) + (stoch_k - 80))
        
        # Calculate volatility-based stop-loss
        recent_prices = closes[-20:]
        volatility = np.std(recent_prices) / np.mean(recent_prices) * 100
        
        if volatility < 2:
            stop_loss = 3.0
        elif volatility < 5:
            stop_loss = 5.0
        else:
            stop_loss = 8.0
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "rsi": round(rsi, 2),
            "stoch_k": round(stoch_k, 2),
            "stoch_d": round(stoch_d, 2),
            "macd": round(macd, 6),
            "signal_type": signal_type,
            "confidence": round(confidence, 1),
            "volatility": round(volatility, 2),
            "suggested_stop_loss_pct": stop_loss,
            "timestamp": datetime.now().isoformat()
        }
    
    def send_telegram_alert(self, analysis: Dict):
        """Send Telegram notification of opportunity"""
        if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
            print("Warning: Telegram not configured")
            return
        
        symbol = analysis["symbol"]
        signal = analysis["signal_type"]
        confidence = analysis["confidence"]
        stop_loss = analysis["suggested_stop_loss_pct"]
        rsi = analysis["rsi"]
        price = analysis["current_price"]
        
        if signal == "OVERSOLD_BUY":
            emoji = "🟢"
            action = "BUY"
        else:
            emoji = "🔴"
            action = "SHORT"
        
        message = f"""
{emoji} **OPPORTUNITY DETECTED**

Pair: {symbol}USDT
Action: {action}
Current Price: ${price:,.2f}

**Indicators:**
• RSI: {rsi} (Threshold: 30/70)
• Stochastic: {analysis['stoch_k']:.1f}
• Volatility: {analysis['volatility']:.2f}%

Confidence: {confidence}%
**Suggested Stop Loss: {stop_loss}%**

Time: {datetime.now().strftime('%H:%M:%S EST')}
"""
        
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            requests.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "Markdown"
            }, timeout=5)
            print(f"✓ Alert sent for {symbol}")
        except Exception as e:
            print(f"✗ Failed to send alert: {e}")
    
    def run(self):
        """Main monitoring loop"""
        print(f"🚀 Starting Perpetuals Monitor")
        print(f"Monitoring: {', '.join(TOP_PAIRS)}")
        print(f"Check interval: {CHECK_INTERVAL}s")
        print(f"Overbought threshold: RSI > 70")
        print(f"Oversold threshold: RSI < 30")
        print("=" * 60)
        
        while True:
            timestamp = datetime.now().strftime("%H:%M:%S EST")
            print(f"\n[{timestamp}] Checking signals...")
            
            opportunities = []
            
            for symbol in TOP_PAIRS:
                analysis = self.analyze_pair(symbol)
                
                if analysis:
                    if analysis["signal_type"]:
                        opportunities.append(analysis)
                        print(f"  {symbol}: {analysis['signal_type']} (RSI: {analysis['rsi']}, Conf: {analysis['confidence']}%)")
                    else:
                        print(f"  {symbol}: No signal (RSI: {analysis['rsi']})")
            
            # Send alerts for opportunities (throttle to 1 per pair per minute)
            for opp in opportunities:
                symbol = opp["symbol"]
                last_alert = self.last_alert_time.get(symbol, 0)
                
                if time.time() - last_alert > 60:  # 60s throttle
                    self.send_telegram_alert(opp)
                    self.last_alert_time[symbol] = time.time()
                    self.signals_log.append(opp)
            
            print(f"Found {len(opportunities)} opportunity(ies)")
            
            # Wait for next check
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    monitor = PerpMonitor()
    try:
        monitor.run()
    except KeyboardInterrupt:
        print("\n\n✓ Monitor stopped")
        sys.exit(0)
