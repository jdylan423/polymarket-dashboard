#!/usr/bin/env python3
"""
OpenSea Perpetuals Tick Data Monitor - DEMO VERSION
Includes mock data for testing without API access.
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import sys
import random

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
    
    d_percent = k_percent
    
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
    
    fast_ema = np.mean(prices_arr[-fast_period:])
    slow_ema = np.mean(prices_arr[-slow_period:])
    
    macd_line = fast_ema - slow_ema
    signal_line = (fast_ema + slow_ema) / 2
    histogram = macd_line - signal_line
    
    return {
        "macd": float(macd_line),
        "signal": float(signal_line),
        "histogram": float(histogram)
    }


# ============================================================================
# MOCK DATA GENERATION
# ============================================================================

def generate_mock_prices(
    start_price: float,
    num_candles: int = 100,
    volatility: float = 0.02,
    trend: float = 0.001
) -> Tuple[List[float], List[float], List[float], List[float]]:
    """Generate realistic mock OHLCV data"""
    
    closes = [start_price]
    opens = [start_price]
    highs = [start_price]
    lows = [start_price]
    
    current = start_price
    
    for _ in range(num_candles - 1):
        # Random walk with trend
        change = np.random.normal(trend, volatility)
        current = current * (1 + change)
        
        # OHLC structure
        o = current * (1 + np.random.normal(0, 0.001))
        h = max(o, current) * (1 + abs(np.random.normal(0, volatility)))
        l = min(o, current) * (1 - abs(np.random.normal(0, volatility)))
        c = current
        
        opens.append(o)
        highs.append(h)
        lows.append(l)
        closes.append(c)
    
    return (opens, highs, lows, closes)


def create_mock_pair_data(
    symbol: str,
    base_price: float,
    signal_type: Optional[str] = None
) -> Dict:
    """Create mock data for a trading pair with optional signal injection"""
    
    opens, highs, lows, closes = generate_mock_prices(base_price)
    
    # Inject specific signals if requested
    if signal_type == "oversold":
        # Push prices down to trigger RSI < 30
        closes = [p * 0.92 for p in closes[-20:]]
        closes = closes[-20:] + [p * 0.90 for p in closes[-10:]]
    elif signal_type == "overbought":
        # Push prices up to trigger RSI > 70
        closes = [p * 1.08 for p in closes[-20:]]
        closes = closes[-20:] + [p * 1.10 for p in closes[-10:]]
    
    current_price = closes[-1]
    price_change = ((current_price - closes[0]) / closes[0]) * 100
    
    # Build full OHLCV array
    opens_adj, highs_adj, lows_adj, closes_adj = generate_mock_prices(base_price)
    
    # Override closes with injected signal
    if signal_type:
        closes_adj = closes
    
    return {
        "symbol": symbol,
        "current_price": current_price,
        "price_change_24h_pct": price_change,
        "opens": opens_adj,
        "highs": highs_adj,
        "lows": lows_adj,
        "closes": closes_adj
    }


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
    
    if rsi is not None:
        if rsi < 30:
            signals.append("OVERSOLD_RSI")
            reasons.append(f"RSI {rsi:.2f} < 30 (oversold)")
        elif rsi > 70:
            signals.append("OVERBOUGHT_RSI")
            reasons.append(f"RSI {rsi:.2f} > 70 (overbought)")
        elif 45 <= rsi <= 55:
            signals.append("NEUTRAL_RSI")
    
    if stochastic:
        k_percent, d_percent = stochastic
        if k_percent < 20:
            signals.append("OVERSOLD_STOCHASTIC")
            reasons.append(f"Stochastic %K {k_percent:.2f} < 20 (oversold)")
        elif k_percent > 80:
            signals.append("OVERBOUGHT_STOCHASTIC")
            reasons.append(f"Stochastic %K {k_percent:.2f} > 80 (overbought)")
    
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
# MONITORING
# ============================================================================

def analyze_pair(
    symbol: str,
    data: Dict,
    price_history: Dict[str, List]
) -> Dict:
    """Analyze a single trading pair"""
    
    closes = data["closes"]
    opens = data["opens"]
    highs = data["highs"]
    lows = data["lows"]
    current_price = data["current_price"]
    
    # Update price history
    if symbol not in price_history:
        price_history[symbol] = []
    price_history[symbol].extend(closes)
    price_history[symbol] = price_history[symbol][-200:]
    
    # Calculate indicators
    rsi = calculate_rsi(price_history[symbol], period=14)
    stochastic = calculate_stochastic(highs, lows, closes, period=14)
    macd = calculate_macd(price_history[symbol])
    
    # Detect signals
    signal_result = detect_signals(symbol, rsi, stochastic, macd, current_price)
    
    return {
        "symbol": symbol,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "current_price": round(current_price, 2),
        "price_change_24h_pct": round(data["price_change_24h_pct"], 2),
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


def run_demo_monitor(
    symbols: List[str],
    iterations: int = 2
):
    """Run demo monitoring with mock data"""
    
    # Create base prices for each symbol
    base_prices = {
        "BTCUSDT": 42500,
        "ETHUSDT": 2300,
        "BNBUSDT": 610,
        "SOLUSDT": 98,
        "XRPUSDT": 2.45,
        "ADAUSDT": 0.98,
        "DOGEUSDT": 0.38,
        "DOTUSDT": 7.60,
        "LINKUSDT": 19.50,
        "MATICUSDT": 0.90
    }
    
    price_history: Dict[str, List] = {}
    
    # Inject some signals randomly
    signal_pairs = random.sample(symbols, min(2, len(symbols)))
    signal_map = {
        signal_pairs[0]: "oversold" if len(signal_pairs) > 0 else None,
        signal_pairs[1] if len(signal_pairs) > 1 else None: "overbought"
    }
    
    for iteration in range(1, iterations + 1):
        print(f"\n{'='*70}")
        print(f"Iteration {iteration} | {datetime.utcnow().isoformat()}Z")
        print(f"{'='*70}\n")
        
        results = []
        
        for symbol in symbols:
            base_price = base_prices.get(symbol, 100)
            mock_data = create_mock_pair_data(
                symbol,
                base_price,
                signal_type=signal_map.get(symbol)
            )
            result = analyze_pair(symbol, mock_data, price_history)
            results.append(result)
        
        # Filter for signals
        signals_found = [r for r in results if r.get("signals") != ["NO_SIGNAL"]]
        
        # Output
        output = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "iteration": iteration,
            "total_pairs_monitored": len(symbols),
            "pairs_with_signals": len(signals_found),
            "data": results
        }
        
        print(json.dumps(output, indent=2))
        
        # Save to log
        with open("monitoring_log_demo.jsonl", "a") as f:
            f.write(json.dumps(output) + "\n")
        
        if iteration < iterations:
            print("\n⏳ Demo pause between iterations...")
            time.sleep(2)
    
    print("\n" + "="*70)
    print("✅ Demo monitoring complete!")
    print("="*70)


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    print("🔍 OpenSea Perpetuals Tick Data Monitor - DEMO")
    print("   Using mock data (no API access required)")
    print("=" * 70)
    
    # Top 10 pairs
    top_pairs = [
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "ADAUSDT",
        "DOGEUSDT",
        "DOTUSDT",
        "LINKUSDT",
        "MATICUSDT"
    ]
    
    print(f"\n🚀 Monitoring {len(top_pairs)} trading pairs with mock data")
    print(f"📊 Running 2 iterations")
    print(f"   Signals injected: Yes (to demonstrate detection)\n")
    
    run_demo_monitor(top_pairs, iterations=2)
    
    print("\n📊 Results saved to: monitoring_log_demo.jsonl")
