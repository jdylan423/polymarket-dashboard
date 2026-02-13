#!/usr/bin/env python3
"""
OpenSea Perpetuals Tick Data Monitor
Fetches tick data every 30 seconds and calculates overbought/oversold indicators.
Uses Binance Perpetuals API (free tier).
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import sys

try:
    import aiohttp
except ImportError:
    print("⚠️ Missing 'aiohttp'. Install: pip install aiohttp")
    sys.exit(1)

try:
    import numpy as np
except ImportError:
    print("⚠️ Missing 'numpy'. Install: pip install numpy")
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
    period: int = 14,
    k_period: int = 3
) -> Optional[Tuple[float, float]]:
    """Calculate Stochastic Oscillator (%K, %D)"""
    if len(high_prices) < period:
        return None
    
    highs = np.array(high_prices[-period:], dtype=float)
    lows = np.array(low_prices[-period:], dtype=float)
    closes = np.array(close_prices[-period:], dtype=float)
    
    max_high = np.max(highs)
    min_low = np.min(lows)
    
    if max_high == min_low:
        k_percent = 50.0
    else:
        k_percent = 100 * (closes[-1] - min_low) / (max_high - min_low)
    
    # %D is SMA of %K (simplified: use last k_period values)
    d_percent = k_percent  # Simplified for single point; normally averages multiple K values
    
    return (float(k_percent), float(d_percent))


def calculate_macd(
    prices: List[float],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9
) -> Optional[Dict[str, float]]:
    """Calculate MACD (Moving Average Convergence Divergence)"""
    if len(prices) < slow_period:
        return None
    
    prices_arr = np.array(prices[-slow_period:], dtype=float)
    
    # Calculate EMAs
    fast_ema = np.mean(prices_arr[-fast_period:])  # Simplified
    slow_ema = np.mean(prices_arr[-slow_period:])
    
    macd_line = fast_ema - slow_ema
    signal_line = (fast_ema + slow_ema) / 2  # Simplified
    histogram = macd_line - signal_line
    
    return {
        "macd": float(macd_line),
        "signal": float(signal_line),
        "histogram": float(histogram)
    }


# ============================================================================
# DATA FETCHING
# ============================================================================

class BinancePerpetualsFetcher:
    """Fetch data from Binance Perpetuals API"""
    
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
        """Fetch candlestick data from Binance"""
        if not self.session:
            raise RuntimeError("Session not initialized. Use 'async with' context manager.")
        
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
                    print(f"❌ Binance API error {resp.status} for {symbol}")
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
            print(f"❌ Error fetching ticker {symbol}: {e}")
            return None


# ============================================================================
# SIGNAL DETECTION
# ============================================================================

def detect_signals(
    symbol: str,
    rsi: Optional[float],
    stochastic: Optional[Tuple[float, float]],
    macd: Optional[Dict[str, float]],
    current_price: float
) -> Dict:
    """Detect overbought/oversold signals"""
    
    signals = []
    reasons = []
    
    # RSI Signals
    if rsi is not None:
        if rsi < 30:
            signals.append("OVERSOLD_RSI")
            reasons.append(f"RSI {rsi:.2f} < 30 (oversold)")
        elif rsi > 70:
            signals.append("OVERBOUGHT_RSI")
            reasons.append(f"RSI {rsi:.2f} > 70 (overbought)")
        elif 45 <= rsi <= 55:
            signals.append("NEUTRAL_RSI")
    
    # Stochastic Signals
    if stochastic:
        k_percent, d_percent = stochastic
        if k_percent < 20:
            signals.append("OVERSOLD_STOCHASTIC")
            reasons.append(f"Stochastic %K {k_percent:.2f} < 20 (oversold)")
        elif k_percent > 80:
            signals.append("OVERBOUGHT_STOCHASTIC")
            reasons.append(f"Stochastic %K {k_percent:.2f} > 80 (overbought)")
    
    # MACD Signals
    if macd:
        if macd["histogram"] < 0 and macd["macd"] < macd["signal"]:
            signals.append("BEARISH_MACD")
            reasons.append(f"MACD histogram negative ({macd['histogram']:.6f})")
        elif macd["histogram"] > 0 and macd["macd"] > macd["signal"]:
            signals.append("BULLISH_MACD")
            reasons.append(f"MACD histogram positive ({macd['histogram']:.6f})")
    
    return {
        "signals": signals if signals else ["NO_SIGNAL"],
        "reasons": reasons if reasons else ["Price in normal range"],
        "confidence": "HIGH" if len(signals) > 1 else "MEDIUM"
    }


# ============================================================================
# MAIN MONITORING
# ============================================================================

async def monitor_pair(
    fetcher: BinancePerpetualsFetcher,
    symbol: str,
    price_history: Dict[str, List]
) -> Dict:
    """Monitor a single trading pair"""
    
    klines = await fetcher.get_klines(symbol, interval="5m", limit=100)
    ticker = await fetcher.get_ticker(symbol)
    
    if not klines or not ticker:
        return {
            "symbol": symbol,
            "status": "ERROR",
            "error": "Failed to fetch data"
        }
    
    # Extract OHLCV data
    closes = [float(kline[4]) for kline in klines]  # Close prices
    opens = [float(kline[1]) for kline in klines]
    highs = [float(kline[2]) for kline in klines]
    lows = [float(kline[3]) for kline in klines]
    volumes = [float(kline[7]) for kline in klines]  # Quote asset volume
    
    current_price = float(ticker["lastPrice"])
    price_change_pct = float(ticker["priceChangePercent"])
    
    # Update price history
    if symbol not in price_history:
        price_history[symbol] = []
    price_history[symbol].extend(closes)
    price_history[symbol] = price_history[symbol][-200:]  # Keep last 200
    
    # Calculate indicators
    rsi = calculate_rsi(price_history[symbol], period=14)
    stochastic = calculate_stochastic(
        [float(h) for h in highs],
        [float(l) for l in lows],
        closes,
        period=14
    )
    macd = calculate_macd(price_history[symbol])
    
    # Detect signals
    signal_result = detect_signals(symbol, rsi, stochastic, macd, current_price)
    
    return {
        "symbol": symbol,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "current_price": current_price,
        "price_change_24h_pct": price_change_pct,
        "indicators": {
            "rsi_14": round(rsi, 2) if rsi else None,
            "stochastic_k": round(stochastic[0], 2) if stochastic else None,
            "stochastic_d": round(stochastic[1], 2) if stochastic else None,
            "macd": round(macd["macd"], 6) if macd else None,
            "macd_signal": round(macd["signal"], 6) if macd else None,
            "macd_histogram": round(macd["histogram"], 6) if macd else None
        },
        "signals": signal_result["signals"],
        "reasons": signal_result["reasons"],
        "confidence": signal_result["confidence"]
    }


async def run_monitor(
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
            print(f"\n{'='*70}")
            print(f"Iteration {iteration} | {datetime.utcnow().isoformat()}Z")
            print(f"{'='*70}")
            
            start_time = time.time()
            results = []
            
            # Fetch data for all symbols concurrently
            tasks = [
                monitor_pair(fetcher, symbol, price_history)
                for symbol in symbols
            ]
            results = await asyncio.gather(*tasks)
            
            # Filter for signals
            signals_found = [r for r in results if r.get("signals") != ["NO_SIGNAL"]]
            
            # Output results
            output = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "iteration": iteration,
                "total_pairs_monitored": len(symbols),
                "pairs_with_signals": len(signals_found),
                "data": results
            }
            
            # Pretty print JSON
            print(json.dumps(output, indent=2))
            
            # Save to file
            with open("monitoring_log.jsonl", "a") as f:
                f.write(json.dumps(output) + "\n")
            
            elapsed = time.time() - start_time
            sleep_time = max(0, interval - elapsed)
            
            if sleep_time > 0:
                print(f"\n⏳ Sleeping {sleep_time:.1f}s until next fetch...")
                await asyncio.sleep(sleep_time)


# ============================================================================
# TESTING
# ============================================================================

async def test_single_pair():
    """Test script with a single pair"""
    print("🧪 Testing with BTC/USDT perpetual...")
    
    async with BinancePerpetualsFetcher() as fetcher:
        result = await monitor_pair(fetcher, "BTCUSDT", {})
        print("\n" + json.dumps(result, indent=2))
        return result


async def test_top_10_pairs():
    """Test with top 10 pairs (30 second interval, 2 iterations)"""
    
    # Top 10 pairs by liquidity
    top_pairs = [
        "BTCUSDT",    # Bitcoin
        "ETHUSDT",    # Ethereum
        "BNBUSDT",    # Binance Coin
        "SOLUSDT",    # Solana
        "XRPUSDT",    # Ripple
        "ADAUSDT",    # Cardano
        "DOGEUSDT",   # Dogecoin
        "DOTUSDT",    # Polkadot
        "LINKUSDT",   # Chainlink
        "MATICUSDT"   # Polygon
    ]
    
    print(f"🚀 Starting monitor with {len(top_pairs)} pairs...")
    print(f"📊 Interval: 30 seconds")
    print(f"🔄 Running 2 iterations for testing...\n")
    
    await run_monitor(top_pairs, interval=30, iterations=2)


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    print("🔍 OpenSea Perpetuals Tick Data Monitor")
    print("   Using Binance Perpetuals API (Free Tier)")
    print("=" * 70)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test-full":
        print("\n⏱️  Mode: Full Test (2 iterations, 30 second interval)")
        asyncio.run(test_top_10_pairs())
    else:
        print("\n✅ Mode: Quick Single Pair Test")
        print("   Run with: python perps_tick_monitor.py --test-full")
        print("   For full monitoring test (takes ~1 minute)\n")
        result = asyncio.run(test_single_pair())
        print("\n✅ Test complete!")
        if result.get("signals") != ["NO_SIGNAL"]:
            print(f"   🎯 Signal detected: {result['signals']}")
