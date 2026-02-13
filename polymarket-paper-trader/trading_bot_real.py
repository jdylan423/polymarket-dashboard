#!/usr/bin/env python3
"""
Polymarket Real Trading Bot
Mean-reversion strategy with REAL orders on Polymarket
"""

import json
import logging
import yaml
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time
from api_client import PolymarketAPI
from credentials import CredentialsManager
from polymarket_client import PolymarketTrader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('polymarket_trading_real.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TradeJournal:
    """Manages trading journal (paper or real)"""
    
    def __init__(self, filename: str = "trades.json"):
        self.filename = filename
        self.data = self._load()
    
    def _load(self) -> Dict:
        """Load trades from file"""
        try:
            with open(self.filename, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "trades": [],
                "stats": {
                    "total_trades": 0,
                    "wins": 0,
                    "losses": 0,
                    "win_rate": 0.0,
                    "total_pnl": 0.0,
                    "consecutive_losses": 0,
                    "avg_pnl_pct": 0.0
                }
            }
    
    def add_trade(self, trade: Dict):
        """Add a new trade"""
        self.data["trades"].append(trade)
        self._update_stats()
        self._save()
    
    def close_trade(self, trade_index: int, exit_price: float, exit_time: datetime):
        """Close an open trade"""
        if trade_index >= len(self.data["trades"]):
            return
        
        trade = self.data["trades"][trade_index]
        trade["exit_price"] = exit_price
        trade["exit_time"] = exit_time.isoformat() + "Z"
        
        # Calculate P&L
        if trade["side"] == "buy":
            trade["pnl"] = (exit_price - trade["entry_price"]) * trade["position_size"]
        else:
            trade["pnl"] = (trade["entry_price"] - exit_price) * trade["position_size"]
        
        trade["pnl_pct"] = (trade["pnl"] / (trade["position_size"] * trade["entry_price"])) * 100
        
        entry_dt = datetime.fromisoformat(trade["entry_time"].replace("Z", "+00:00"))
        duration = exit_time - entry_dt
        trade["duration_minutes"] = int(duration.total_seconds() / 60)
        
        self._update_stats()
        self._save()
    
    def _update_stats(self):
        """Recalculate statistics"""
        closed_trades = [t for t in self.data["trades"] if "exit_price" in t]
        
        stats = self.data["stats"]
        stats["total_trades"] = len(closed_trades)
        stats["wins"] = len([t for t in closed_trades if t.get("pnl", 0) > 0])
        stats["losses"] = len([t for t in closed_trades if t.get("pnl", 0) < 0])
        
        if stats["total_trades"] > 0:
            stats["win_rate"] = (stats["wins"] / stats["total_trades"]) * 100
            stats["total_pnl"] = sum(t.get("pnl", 0) for t in closed_trades)
            stats["avg_pnl_pct"] = sum(t.get("pnl_pct", 0) for t in closed_trades) / len(closed_trades)
        
        # Consecutive losses
        stats["consecutive_losses"] = 0
        for trade in reversed(closed_trades):
            if trade.get("pnl", 0) < 0:
                stats["consecutive_losses"] += 1
            else:
                break
    
    def _save(self):
        """Save trades to file"""
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_stats(self) -> Dict:
        """Get current statistics"""
        return self.data["stats"]
    
    def get_consecutive_losses(self) -> int:
        """Get consecutive losses"""
        return self.data["stats"]["consecutive_losses"]


class PolymarketRealTradingBot:
    """Real trading bot - executes actual orders on Polymarket"""
    
    def __init__(self, config_file: str = "config.yaml"):
        self.config = self._load_config(config_file)
        self.api = PolymarketAPI(self.config["api"]["base_url"])
        self.journal = TradeJournal(self.config["logging"]["trades_file"])
        
        # Initialize trader with real credentials
        api_key, api_secret, api_passphrase = CredentialsManager.get_polymarket_credentials()
        
        if not all([api_key, api_secret, api_passphrase]):
            logger.error("Failed to load Polymarket credentials!")
            raise RuntimeError("Missing Polymarket API credentials")
        
        self.trader = PolymarketTrader(api_key, api_secret, api_passphrase)
        logger.info("✓ Real Polymarket trader initialized")
    
    def _load_config(self, config_file: str) -> Dict:
        """Load configuration"""
        try:
            with open(config_file, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.error(f"Config file not found: {config_file}")
            return {}
    
    def run(self):
        """Main trading loop"""
        logger.info("=" * 80)
        logger.info("POLYMARKET REAL TRADING BOT STARTED")
        logger.info("=" * 80)
        
        while True:
            try:
                self._execute_trading_cycle()
            except Exception as e:
                logger.error(f"Error in trading cycle: {e}", exc_info=True)
            
            wait_time = self.config["strategy"]["check_interval_minutes"] * 60
            logger.info(f"Next cycle in {wait_time}s...")
            time.sleep(wait_time)
    
    def _execute_trading_cycle(self):
        """Execute one trading cycle"""
        logger.info("\n" + "=" * 80)
        logger.info(f"TRADING CYCLE - {datetime.utcnow().isoformat()}Z")
        logger.info("=" * 80)
        
        # Check circuit breaker
        consecutive_losses = self.journal.get_consecutive_losses()
        circuit_breaker_limit = self.config["strategy"]["circuit_breaker_losses"]
        
        if consecutive_losses >= circuit_breaker_limit:
            logger.warning(f"⛔ CIRCUIT BREAKER ACTIVE - {consecutive_losses} consecutive losses")
            logger.warning("Bot is paused. Losses must be cleared before trading resumes.")
            return
        
        # Check balance
        balance = self.trader.get_balance()
        if balance is None:
            logger.error("Could not fetch account balance")
            return
        
        logger.info(f"Account Balance: ${balance:.2f}")
        
        # Check markets
        markets_config = self.config.get("markets", {})
        
        for market_id, asset_name in markets_config.items():
            logger.info(f"\nAnalyzing {asset_name} market (ID: {market_id})...")
            
            # Fetch market prices
            prices = self.api.get_market_prices(market_id)
            if not prices:
                logger.error(f"Could not fetch prices for market {market_id}")
                continue
            
            # Check market conditions
            if not self._check_market_conditions(market_id, prices):
                logger.info(f"Market conditions not met for {market_id}")
                continue
            
            # Generate signal
            signal = self._generate_signal(market_id, prices, asset_name)
            if not signal:
                logger.info(f"No trading signal for {market_id}")
                continue
            
            # Check if we have enough balance
            position_size = self.config["strategy"]["position_size"]
            if balance < position_size:
                logger.warning(f"Insufficient balance for trade (need ${position_size}, have ${balance:.2f})")
                continue
            
            # Execute REAL order
            logger.info(f"✅ SIGNAL: {signal['action'].upper()} {signal['outcome']}")
            logger.info(f"   Reason: {signal['reason']}")
            logger.info(f"   Entry Price: {signal['entry_price']:.4f}")
            logger.info(f"   Position Size: ${position_size}")
            
            trade = self._execute_real_order(market_id, prices, signal, position_size)
            
            if trade:
                self.journal.add_trade(trade)
                logger.info(f"✅ Order executed and recorded")
                self._print_stats()
            else:
                logger.error(f"Failed to execute order for market {market_id}")
    
    def _check_market_conditions(self, market_id: str, prices: Dict) -> bool:
        """Check market conditions"""
        params = self.config["strategy_params"]
        
        if prices["liquidity"] < params["min_liquidity_usd"]:
            logger.debug(f"Insufficient liquidity: ${prices['liquidity']:.0f}")
            return False
        
        if prices["volume24hr"] < params["min_24h_volume"]:
            logger.debug(f"Insufficient volume: ${prices['volume24hr']:.0f}")
            return False
        
        return True
    
    def _generate_signal(self, market_id: str, prices: Dict, asset_name: str) -> Optional[Dict]:
        """Generate trading signal"""
        params = self.config["strategy_params"]
        
        outcomes = prices["outcomes"]
        outcome_prices = prices["prices"]
        
        if len(outcomes) < 2 or len(outcome_prices) < 2:
            return None
        
        yes_price = outcome_prices[0]
        no_price = outcome_prices[1]
        
        logger.info(f"   YES: {yes_price:.4f} | NO: {no_price:.4f}")
        
        if yes_price < params["oversold_threshold"]:
            return {
                "action": "buy",
                "outcome": "Yes",
                "entry_price": yes_price,
                "reason": f"Oversold: YES @ {yes_price:.4f} < {params['oversold_threshold']}",
                "side": "buy"
            }
        
        elif yes_price > params["overbought_threshold"]:
            return {
                "action": "sell",
                "outcome": "Yes",
                "entry_price": yes_price,
                "reason": f"Overbought: YES @ {yes_price:.4f} > {params['overbought_threshold']}",
                "side": "sell"
            }
        
        return None
    
    def _execute_real_order(self, market_id: str, prices: Dict, signal: Dict, position_size: float) -> Optional[Dict]:
        """Execute a REAL order on Polymarket"""
        
        # Calculate quantity based on position size and entry price
        quantity = position_size / signal["entry_price"]
        
        # Place order
        if signal["side"] == "buy":
            result = self.trader.place_buy_order(
                market_id=market_id,
                price=signal["entry_price"],
                quantity=quantity
            )
        else:
            result = self.trader.place_sell_order(
                market_id=market_id,
                price=signal["entry_price"],
                quantity=quantity
            )
        
        if not result:
            logger.error(f"Order placement failed for market {market_id}")
            return None
        
        # Create trade record
        trade = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entry_time": datetime.utcnow().isoformat() + "Z",
            "market_id": market_id,
            "market_name": prices.get("question", "Unknown"),
            "side": signal["side"],
            "outcome": signal["outcome"],
            "entry_price": signal["entry_price"],
            "position_size": position_size,
            "quantity": quantity,
            "order_id": result.get("id"),
            "reason": signal["reason"],
            "real_order": True
        }
        
        return trade
    
    def _print_stats(self):
        """Print trading statistics"""
        stats = self.journal.get_stats()
        
        logger.info("\n" + "-" * 80)
        logger.info("TRADING STATISTICS")
        logger.info("-" * 80)
        logger.info(f"Total Trades: {stats['total_trades']}")
        logger.info(f"Wins: {stats['wins']} | Losses: {stats['losses']}")
        logger.info(f"Win Rate: {stats['win_rate']:.1f}%")
        logger.info(f"Total P&L: ${stats['total_pnl']:.2f}")
        logger.info(f"Avg P&L %: {stats['avg_pnl_pct']:.2f}%")
        logger.info(f"Consecutive Losses: {stats['consecutive_losses']}")
        logger.info("-" * 80)


if __name__ == "__main__":
    try:
        bot = PolymarketRealTradingBot("config.yaml")
        bot.run()
    except KeyboardInterrupt:
        logger.info("\n\nBot stopped by user")
        exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        exit(1)
