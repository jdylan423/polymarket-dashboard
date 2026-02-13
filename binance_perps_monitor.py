#!/usr/bin/env python3
"""
Binance Perpetuals Tick Data Monitor
Real-time monitoring of top 10 crypto pairs with technical indicators.

Features:
- Fetches OHLCV data every 30 seconds
- Calculates RSI, Stochastic Oscillator, MACD
- Identifies overbought/oversold signals
- Returns actionable JSON with recommendations
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import sys

try:
    import aiohttp
except ImportError:
    print("⚠️  Missing 'aiohttp'. Install: pip install aiohttp")
    sys.exit(1)

try:
    import numpy as np
except ImportError:
    print("⚠️  Missing 'numpy'. Install: pip install numpy")
    sys.exit(1)


# ============================================================================
# TECHNICAL INDICATORS
# ============================================================================

def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Calculate RSI (Relative Strength Index)"""
    if len(prices) < period + 1:
        return None
    
    prices_arr = np.array(prices[-period - 1:], dtype=float)
    deltas = np.diff(prices_arr)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains)
    avg_loss = np.mean(losses)
    
    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return float(rsi)


def calculate_stochastic(
    high_prices: List[float],
    low_prices: List[float],
    close_prices: List[float],
    period: int = 14
) -> Optional[float]:
    """Calculate Stochastic Oscillator (%K value)"""
    if len(high_prices) < period:
        return None
    
    highs = np.array(high_prices[-period:], dtype=float)
    lows = np.array(low_prices[-period:], dtype=float)
    
    max_high = np.max(highs)
    min_low = np.min(lows)
    
    if max_high == min_low:
        return 50.0
    
    k_percent = 100 * (close_prices[-1] - min_low) / (max_high - min_low)
    return float(k_percent)


def calculate_macd(prices: List[float]) -> Optional[Dict[str, float]]:
    """Calculate MACD (Moving Average Convergence Divergence)"""
    if len(prices) < 26:
        return None
    
    prices_arr = np.array(prices[-26:], dtype=float)
    
    fast_ema = np.mean(prices_arr[-12:])
    slow_ema = np.mean(prices_arr[-26:])
    
    macd_line = fast_ema - slow_ema
    signal_line = (fast_ema + slow_ema) / 2
    histogram = macd_line - signal_line
    
    return {
        "macd": float(macd_line),
        "signal": float(signal_line),
        "histogram": float(histogram)
    }


# ============================================================================
# SIGNAL DETECTION & RECOMMENDATIONS
# ============================================================================

def detect_signal_and_recommend(
    rsi: Optional[float],
    stochastic: Optional[float],
    macd: Optional[Dict],
    current_price: float,
    recent_high: float,
    recent_low: float
) -> Tuple[str, str, float]:
    """
    Detect trading signal and generate recommendation with stop loss.
    
    Returns: (signal_type, recommendation, stop_loss_pct)
    """
    
    signal_type = "NEUTRAL"
    recommendation = "HOLD"
    stop_loss_pct = 2.0  # Default stop loss
    
    # Count bullish and bearish signals
    bullish_count = 0
    bearish_count = 0
    
    # RSI signals
    if rsi is not None:
        if rsi < 30:
            signal_type = "OVERSOLD"
            bullish_count += 2
        elif rsi > 70:
            signal_type = "OVERBOUGHT"
            bearish_count += 2
    
    # Stochastic signals
    if stochastic is not None:
        if stochastic < 20:
            signal_type = "OVERSOLD"
            bullish_count += 1
        elif stochastic > 80:
            signal_type = "OVERBOUGHT"
            bearish_count += 1
    
    # MACD signals
    if macd and macd["histogram"] is not None:
        if macd["histogram"] > 0:
            bullish_count += 1
        else:
            bearish_count += 1
    
    # Generate recommendation
    if bullish_count >= 2 and signal_type == "OVERSOLD":
        recommendation = "BUY"
        stop_loss_pct = 2.5
    elif bearish_count >= 2 and signal_type == "OVERBOUGHT":
        recommendation = "SELL"
        stop_loss_pct = 2.5
    elif bullish_count > bearish_count:
        recommendation = "BUY"
        stop_loss_pct = 2.0
    elif bearish_count > bullish_count:
        recommendation = "SELL"
        stop_loss_pct = 2.0
    else:
        recommendation = "HOLD"
        stop_loss_pct = 1.5
    
    return (signal_type, recommendation, stop_loss_pct)


# ============================================================================
# BINANCE PERPETUALS API
# ============================================================================

class BinancePerpetualsFetcher:
    """Fetch real-time OHLCV data from Binance Perpetuals API"""
    
    BASE_URL = "https://fapi.binance.com"
    
    def __init__(self, timeout: int = 10):
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_klines(
        self,
        symbol: str,
        interval: str = "5m",
        limit: int = 100
    ) -> Optional[List[List]]:
        """Fetch candlestick data"""
        if not self.session:
            raise RuntimeError("Session not initialized. Use 'async with'.")
        
        endpoint = f"{self.BASE_URL}/fapi/v1/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }
        
        try:
            async with self.session.get(endpoint, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    return None
        except Exception as e:
            print(f"❌ Error fetching {symbol}: {e}")
            return None
    
    async def get_ticker(self, symbol: str) -> Optional[Dict]:
        """Fetch 24h ticker data"""
        if not self.session:
            raise RuntimeError("Session not initialized.")
        
        endpoint = f"{self.BASE_URL}/fapi/v1/ticker/24hr"
        params = {"symbol": symbol}
        
        try:
            async with self.session.get(endpoint, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    return None
        except Exception as e:
            return None


# ============================================================================
# MONITORING LOGIC
# ============================================================================

async def analyze_pair(
    fetcher: BinancePerpetualsFetcher,
    symbol: str,
    price_history: Dict[str, List]
) -> Optional[Dict]:
    """Analyze a single trading pair"""
    
    klines = await fetcher.get_klines(symbol, interval="5m", limit=100)
    ticker = await fetcher.get_ticker(symbol)
    
    if not klines or not ticker:
        return {
            "symbol": symbol,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "ERROR",
            "signal_type": "ERROR",
            "error": "Failed to fetch data"
        }
    
    # Extract OHLCV data
    closes = [float(kline[4]) for kline in klines]
    opens = [float(kline[1]) for kline in klines]
    highs = [float(kline[2]) for kline in klines]
    lows = [float(kline[3]) for kline in klines]
    
    current_price = float(ticker["lastPrice"])
    recent_high = max(highs[-20:]) if len(highs) >= 20 else max(highs)
    recent_low = min(lows[-20:]) if len(lows) >= 20 else min(lows)
    
    # Update price history
    if symbol not in price_history:
        price_history[symbol] = []
    price_history[symbol].extend(closes)
    price_history[symbol] = price_history[symbol][-200:]
    
    # Calculate indicators
    rsi = calculate_rsi(price_history[symbol], period=14)
    stochastic = calculate_stochastic(highs, lows, closes, period=14)
    macd = calculate_macd(price_history[symbol])
    
    # Detect signal and recommendation
    signal_type, recommendation, stop_loss_pct = detect_signal_and_recommend(
        rsi, stochastic, macd, current_price, recent_high, recent_low
    )
    
    return {
        "symbol": symbol,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "current_price": round(current_price, 8),
        "signal_type": signal_type,
        "current_rsi": round(rsi, 2) if rsi else None,
        "current_stochastic": round(stochastic, 2) if stochastic else None,
        "recommendation": recommendation,
        "suggested_stop_loss_pct": round(stop_loss_pct, 2),
        "macd_histogram": round(macd["histogram"], 8) if macd else None
    }


async def run_monitoring(
    symbols: List[str],
    interval: int = 30,
    iterations: Optional[int] = None
):
    """Main monitoring loop"""
    
    price_history: Dict[str, List] = {}
    iteration = 0
    
    async with BinancePerpetualsFetcher() as fetcher:
        while iterations is None or iteration < iterations:
            iteration += 1
            
            print(f"\n{'='*80}")
            print(f"SCAN #{iteration} | {datetime.utcnow().isoformat()}Z")
            print(f"{'='*80}\n")
            
            start_time = time.time()
            
            # Fetch all pairs concurrently
            tasks = [
                analyze_pair(fetcher, symbol, price_history)
                for symbol in symbols
            ]
            results = await asyncio.gather(*tasks)
            
            # Filter for actionable signals
            actionable = [
                r for r in results 
                if r.get("status") != "ERROR" and r.get("signal_type") != "NEUTRAL"
            ]
            
            # Build output
            output = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "scan_number": iteration,
                "total_pairs": len(symbols),
                "pairs_with_signals": len(actionable),
                "data": results
            }
            
            # Display results
            print(json.dumps(output, indent=2))
            
            # Save to file
            with open("binance_monitor.jsonl", "a") as f:
                f.write(json.dumps(output) + "\n")
            
            elapsed = time.time() - start_time
            sleep_time = max(0, interval - elapsed)
            
            if sleep_time > 0 and (iterations is None or iteration < iterations):
                print(f"\n⏳ Next scan in {sleep_time:.1f}s...")
                await asyncio.sleep(sleep_time)


# ============================================================================
# DEMO MODE (Mock Data)
# ============================================================================

def generate_mock_klines(
    start_price: float,
    num_candles: int = 100,
    volatility: float = 0.02
) -> List[List]:
    """Generate realistic mock kline data"""
    
    klines = []
    current = start_price
    
    for i in range(num_candles):
        # Random walk
        change = np.random.normal(0, volatility)
        current = current * (1 + change)
        
        o = current * (1 + np.random.normal(0, 0.001))
        h = o * (1 + abs(np.random.normal(0, volatility)))
        l = o * (1 - abs(np.random.normal(0, volatility)))
        c = current
        v = np.random.uniform(1e6, 5e6)
        
        # [open_time, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base, taker_buy_quote, ignore]
        kline = [
            int((datetime.utcnow() - timedelta(minutes=5*(num_candles-i))).timestamp() * 1000),
            str(o),
            str(h),
            str(l),
            str(c),
            str(v),
            int((datetime.utcnow() - timedelta(minutes=5*(num_candles-i))).timestamp() * 1000),
            str(v * c),
            int(np.random.randint(100, 1000)),
            str(v * 0.5),
            str(v * 0.5 * c),
            "0"
        ]
        klines.append(kline)
    
    return klines


def demo_single_pair():
    """Quick demo with mock data"""
    print("🧪 DEMO MODE - Using Mock Data")
    print("="*80)
    
    base_prices = {
        "BTCUSDT": 42500,
        "ETHUSDT": 2300,
        "SOLUSDT": 98,
        "XRPUSDT": 2.45,
        "ADAUSDT": 0.98,
        "BNBUSDT": 610,
        "AVAXUSDT": 35.50,
        "DOGEUSDT": 0.38,
        "LINKUSDT": 19.50,
        "UNIUSDT": 5.80
    }
    
    price_history = {}
    
    for symbol, base_price in base_prices.items():
        klines = generate_mock_klines(base_price, num_candles=100)
        
        closes = [float(kline[4]) for kline in klines]
        highs = [float(kline[2]) for kline in klines]
        lows = [float(kline[3]) for kline in klines]
        
        current_price = closes[-1]
        recent_high = max(highs[-20:])
        recent_low = min(lows[-20:])
        
        # Simulate price history
        price_history[symbol] = closes
        
        # Calculate indicators
        rsi = calculate_rsi(closes, period=14)
        stochastic = calculate_stochastic(highs, lows, closes, period=14)
        macd = calculate_macd(closes)
        
        # Get signal
        signal_type, recommendation, stop_loss_pct = detect_signal_and_recommend(
            rsi, stochastic, macd, current_price, recent_high, recent_low
        )
        
        result = {
            "symbol": symbol,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "current_price": round(current_price, 8),
            "signal_type": signal_type,
            "current_rsi": round(rsi, 2) if rsi else None,
            "current_stochastic": round(stochastic, 2) if stochastic else None,
            "recommendation": recommendation,
            "suggested_stop_loss_pct": round(stop_loss_pct, 2),
            "macd_histogram": round(macd["histogram"], 8) if macd else None
        }
        
        print(f"\n{result['symbol']}")
        print(f"  Price: ${result['current_price']}")
        print(f"  Signal: {result['signal_type']} | Recommendation: {result['recommendation']}")
        print(f"  RSI: {result['current_rsi']} | Stoch: {result['current_stochastic']}%")
        print(f"  Stop Loss: -{result['suggested_stop_loss_pct']}%")


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    print("\n🚀 Binance Perpetuals Monitor")
    print("   Real-time technical analysis with trading signals")
    print("="*80)
    
    # Top 10 pairs
    top_pairs = [
        "BTCUSDT",
        "ETHUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "ADAUSDT",
        "BNBUSDT",
        "AVAXUSDT",
        "DOGEUSDT",
        "LINKUSDT",
        "UNIUSDT"
    ]
    
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        print("\n📊 Running demo with mock data...\n")
        demo_single_pair()
        print("\n✅ Demo complete!")
    else:
        print("\n💡 Usage:")
        print("   --demo          Run demo with mock data (no API)")
        print("   (no args)       Fetch from Binance API (1 iteration)")
        print("   --continuous    Run continuous monitoring\n")
        
        if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
            print(f"📡 Monitoring {len(top_pairs)} pairs continuously (30s interval)")
            print("   Press Ctrl+C to stop\n")
            try:
                asyncio.run(run_monitoring(top_pairs, interval=30, iterations=None))
            except KeyboardInterrupt:
                print("\n\n✋ Monitoring stopped.")
        else:
            print(f"📡 Fetching from Binance API ({len(top_pairs)} pairs, 1 iteration)...\n")
            asyncio.run(run_monitoring(top_pairs, interval=30, iterations=1))
