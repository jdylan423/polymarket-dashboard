#!/usr/bin/env python3
"""
Solana Momentum Trading Backtester
Scans Solana tokens for momentum trades based on volume, liquidity, and price action.
"""

import json
import os
import sys
import time
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
import random
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class TradingRules:
    """Penn's trading rules"""
    max_trade_size: float = 40.0  # Max $40 per trade
    max_positions: int = 4  # Max 4 open positions
    stop_loss_pct: float = -20.0  # -20% stop loss
    take_profit_pct: float = 30.0  # +30% take profit
    portfolio_stop_loss_pct: float = -30.0  # -30% portfolio stop loss
    
@dataclass
class TokenCriteria:
    """Minimum criteria for tokens to consider"""
    min_liquidity_usd: float = 1_000_000  # >$1m liquidity
    min_age_hours: int = 24  # >24h old
    volume_spike_multiplier: float = 2.0  # >2x volume spike in last 4h
    min_volume_usd_24h: float = 100_000  # Minimum daily volume

@dataclass
class Token:
    """Token data"""
    symbol: str
    address: str
    price: float
    liquidity: float
    volume_24h: float
    volume_4h: float
    age_hours: float
    holders: int = 0
    twitter_mentions: int = 0
    sentiment_score: float = 0.5  # 0-1, neutral by default
    
    def meets_criteria(self, criteria: TokenCriteria) -> bool:
        """Check if token meets entry criteria"""
        if self.liquidity < criteria.min_liquidity_usd:
            return False
        if self.age_hours < criteria.min_age_hours:
            return False
        if self.volume_24h < criteria.min_volume_usd_24h:
            return False
        if self.volume_4h > 0:
            volume_ratio = self.volume_24h / (self.volume_4h * 6)
            if volume_ratio < criteria.volume_spike_multiplier:
                return False
        return True
    
    def to_dict(self):
        return asdict(self)

@dataclass
class Trade:
    """Trade record"""
    token_symbol: str
    token_address: str
    entry_price: float
    entry_time: str
    exit_price: Optional[float] = None
    exit_time: Optional[str] = None
    quantity: float = 0.0
    entry_value: float = 0.0
    exit_value: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    exit_reason: Optional[str] = None
    
    def close_trade(self, exit_price: float, exit_time: str, exit_reason: str):
        """Close a trade and calculate P&L"""
        self.exit_price = exit_price
        self.exit_time = exit_time
        self.exit_reason = exit_reason
        
        if self.entry_value > 0:
            self.exit_value = exit_price * self.quantity
            self.pnl = self.exit_value - self.entry_value
            self.pnl_pct = (self.pnl / self.entry_value) * 100
    
    def to_dict(self):
        return asdict(self)

class SolanaBacktester:
    def __init__(self, initial_balance: float = 160.0):
        self.rules = TradingRules()
        self.criteria = TokenCriteria()
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.open_positions: List[Trade] = []
        self.closed_trades: List[Trade] = []
        self.all_tokens_scanned: List[Token] = []
        self.tokens_matched: List[Token] = []
        self.start_time = datetime.now()
        
    def generate_synthetic_tokens(self, count: int = 150) -> List[Token]:
        """Generate synthetic token data for backtesting"""
        tokens = []
        symbols = ['SOL', 'COPE', 'ORCA', 'SABER', 'RAYDIUM', 'MARINADE', 'MAGIC', 'COPE2']
        
        for i in range(count):
            # Create realistic token data with some meeting criteria
            random.seed(i)
            
            # Bias ~15-20% to meet criteria
            meets_criteria_odds = random.random() < 0.18
            
            if meets_criteria_odds:
                # Token meets criteria
                liquidity = random.uniform(1_000_000, 10_000_000)
                age_hours = random.uniform(24, 720)
                volume_24h = random.uniform(500_000, 5_000_000)
                volume_4h = volume_24h / (6 * random.uniform(2.5, 4.0))
            else:
                # Token doesn't meet criteria
                liquidity = random.uniform(100_000, 1_000_000)
                age_hours = random.uniform(0.5, 24)
                volume_24h = random.uniform(10_000, 500_000)
                volume_4h = volume_24h / 6
            
            base_price = 10 ** random.uniform(-6, -2)
            price = base_price * random.uniform(0.8, 1.2)
            
            symbol = f"{random.choice(symbols[:-1])}-{i:04d}"
            address = f"token{i:06d}{'0'*27}"[-44:]
            
            twitter_mentions = int(random.gauss(50, 30)) if meets_criteria_odds else int(random.gauss(10, 5))
            twitter_mentions = max(0, twitter_mentions)
            
            sentiment = random.gauss(0.6 if meets_criteria_odds else 0.5, 0.2)
            sentiment = max(0.0, min(1.0, sentiment))
            
            token = Token(
                symbol=symbol,
                address=address,
                price=price,
                liquidity=liquidity,
                volume_24h=volume_24h,
                volume_4h=volume_4h,
                age_hours=age_hours,
                holders=int(random.gauss(500, 200)),
                twitter_mentions=twitter_mentions,
                sentiment_score=sentiment
            )
            tokens.append(token)
        
        return tokens
    
    def scan_tokens(self, tokens: List[Token]) -> Tuple[List[Token], List[Token]]:
        """Scan tokens and find those matching entry criteria"""
        self.all_tokens_scanned = tokens
        matched = []
        
        for token in tokens:
            if token.meets_criteria(self.criteria):
                matched.append(token)
        
        self.tokens_matched = matched
        logger.info(f"Scanned {len(tokens)} tokens, matched {len(matched)} criteria")
        return matched, tokens
    
    def simulate_trade(self, token: Token, timestamp: str) -> Optional[Trade]:
        """Attempt to open a trade on a token"""
        # Check position limit
        if len(self.open_positions) >= self.rules.max_positions:
            logger.debug(f"Position limit reached, skipping {token.symbol}")
            return None
        
        # Check balance
        if self.balance < self.rules.max_trade_size:
            logger.debug(f"Insufficient balance for {token.symbol}")
            return None
        
        # Open trade
        quantity = self.rules.max_trade_size / token.price
        trade = Trade(
            token_symbol=token.symbol,
            token_address=token.address,
            entry_price=token.price,
            entry_time=timestamp,
            quantity=quantity,
            entry_value=self.rules.max_trade_size
        )
        
        self.open_positions.append(trade)
        self.balance -= self.rules.max_trade_size
        logger.info(f"Opened trade: {token.symbol} @ ${token.price:.8f}, qty={quantity:.2f}")
        return trade
    
    def simulate_price_action(self, trades: List[Trade], timestamp: str) -> List[Trade]:
        """Simulate price movements and check for exits"""
        closed_trades = []
        
        for trade in trades[:]:  # Iterate over copy
            # Simulate price movement (random walk)
            price_change_pct = random.gauss(0.0, 3.0)  # Mean 0, std 3%
            new_price = trade.entry_price * (1 + price_change_pct / 100)
            
            # Calculate unrealized P&L
            unrealized_pnl_pct = ((new_price - trade.entry_price) / trade.entry_price) * 100
            
            # Check for exit triggers
            should_exit = False
            exit_reason = None
            
            if unrealized_pnl_pct >= self.rules.take_profit_pct:
                should_exit = True
                exit_reason = f"Take profit hit ({unrealized_pnl_pct:.2f}%)"
                new_price = trade.entry_price * (1 + self.rules.take_profit_pct / 100)
            
            elif unrealized_pnl_pct <= self.rules.stop_loss_pct:
                should_exit = True
                exit_reason = f"Stop loss hit ({unrealized_pnl_pct:.2f}%)"
                new_price = trade.entry_price * (1 + self.rules.stop_loss_pct / 100)
            
            if should_exit:
                trade.close_trade(new_price, timestamp, exit_reason)
                self.open_positions.remove(trade)
                self.closed_trades.append(trade)
                closed_trades.append(trade)
                
                # Update balance
                self.balance += trade.exit_value
                logger.info(f"Closed trade: {trade.token_symbol} @ ${new_price:.8f}, P&L: ${trade.pnl:.2f} ({trade.pnl_pct:.2f}%)")
        
        return closed_trades
    
    def check_portfolio_stop(self) -> bool:
        """Check if portfolio drawdown exceeds limit"""
        portfolio_value = self.balance + sum(t.entry_value for t in self.open_positions)
        portfolio_pnl_pct = ((portfolio_value - self.initial_balance) / self.initial_balance) * 100
        
        if portfolio_pnl_pct <= self.rules.portfolio_stop_loss_pct:
            logger.warning(f"Portfolio stop loss triggered! P&L: {portfolio_pnl_pct:.2f}%")
            return True
        return False
    
    def run_backtest(self, num_days: int = 1, tokens_per_day: int = 150):
        """Run the backtest simulation"""
        logger.info(f"Starting backtest: {num_days} day(s), simulating {tokens_per_day} tokens/day")
        logger.info(f"Trading rules: Max trade ${self.rules.max_trade_size}, Max positions {self.rules.max_positions}")
        logger.info(f"Initial balance: ${self.initial_balance:.2f}")
        
        current_time = datetime.now()
        
        for day in range(num_days):
            day_start = current_time - timedelta(days=num_days-day-1)
            logger.info(f"\n=== DAY {day+1}/{num_days} ({day_start.strftime('%Y-%m-%d')}) ===")
            
            # Generate and scan tokens
            tokens = self.generate_synthetic_tokens(tokens_per_day)
            matched, all_scanned = self.scan_tokens(tokens)
            
            # Try to open trades on matched tokens
            for i, token in enumerate(matched):
                timestamp = (day_start + timedelta(hours=i*4)).isoformat()
                self.simulate_trade(token, timestamp)
                
                # Simulate price action
                self.simulate_price_action(self.open_positions, timestamp)
                
                # Check portfolio stop
                if self.check_portfolio_stop():
                    break
            
            # End of day: close remaining positions at random prices
            for trade in self.open_positions[:]:
                price_change_pct = random.gauss(0.0, 5.0)
                end_price = trade.entry_price * (1 + price_change_pct / 100)
                timestamp = (day_start + timedelta(hours=23)).isoformat()
                trade.close_trade(end_price, timestamp, "End of day")
                self.open_positions.remove(trade)
                self.closed_trades.append(trade)
                self.balance += trade.exit_value
        
        logger.info(f"\n=== BACKTEST COMPLETE ===")
        logger.info(f"Final balance: ${self.balance:.2f}")
    
    def generate_report(self) -> Dict:
        """Generate backtest report"""
        if not self.closed_trades:
            return {"error": "No trades executed"}
        
        total_pnl = sum(t.pnl for t in self.closed_trades if t.pnl is not None)
        total_pnl_pct = (total_pnl / self.initial_balance) * 100
        winning_trades = [t for t in self.closed_trades if t.pnl is not None and t.pnl > 0]
        losing_trades = [t for t in self.closed_trades if t.pnl is not None and t.pnl <= 0]
        
        win_rate = len(winning_trades) / len(self.closed_trades) * 100 if self.closed_trades else 0
        avg_win = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0
        profit_factor = abs(sum(t.pnl for t in winning_trades) / sum(t.pnl for t in losing_trades)) if losing_trades and sum(t.pnl for t in losing_trades) != 0 else 0
        
        report = {
            "backtest_date": datetime.now().isoformat(),
            "period": f"{self.start_time.isoformat()} to {datetime.now().isoformat()}",
            "summary": {
                "initial_capital": self.initial_balance,
                "final_balance": round(self.balance, 2),
                "total_pnl": round(total_pnl, 2),
                "total_pnl_pct": round(total_pnl_pct, 2),
                "total_trades": len(self.closed_trades),
                "winning_trades": len(winning_trades),
                "losing_trades": len(losing_trades),
                "win_rate_pct": round(win_rate, 2),
                "avg_win": round(avg_win, 2),
                "avg_loss": round(avg_loss, 2),
                "profit_factor": round(profit_factor, 2),
            },
            "tokens": {
                "total_scanned": len(self.all_tokens_scanned),
                "matched_criteria": len(self.tokens_matched),
                "match_rate_pct": round(len(self.tokens_matched) / len(self.all_tokens_scanned) * 100, 2) if self.all_tokens_scanned else 0,
            },
            "top_performers": sorted(
                [t for t in self.closed_trades if t.pnl is not None],
                key=lambda x: x.pnl or 0,
                reverse=True
            )[:5],
            "worst_performers": sorted(
                [t for t in self.closed_trades if t.pnl is not None],
                key=lambda x: x.pnl or 0
            )[:5],
            "all_trades": self.closed_trades,
        }
        
        return report
    
    def print_report(self, report: Dict):
        """Print human-readable report"""
        if "error" in report:
            print(report["error"])
            return
        
        print("\n" + "="*70)
        print("SOLANA MOMENTUM TRADING BACKTEST REPORT")
        print("="*70)
        
        summary = report["summary"]
        print(f"\nBACKTEST PERIOD: {report['period']}")
        print(f"\nCAPITAL SUMMARY:")
        print(f"  Initial Capital:        ${summary['initial_capital']:.2f}")
        print(f"  Final Balance:          ${summary['final_balance']:.2f}")
        print(f"  Total P&L:              ${summary['total_pnl']:.2f}")
        print(f"  Total Return:           {summary['total_pnl_pct']:.2f}%")
        
        tokens = report["tokens"]
        print(f"\nTOKEN SCANNING:")
        print(f"  Total Scanned:          {tokens['total_scanned']}")
        print(f"  Matched Criteria:       {tokens['matched_criteria']}")
        print(f"  Match Rate:             {tokens['match_rate_pct']:.2f}%")
        
        print(f"\nTRADING STATISTICS:")
        print(f"  Total Trades:           {summary['total_trades']}")
        print(f"  Winning Trades:         {summary['winning_trades']}")
        print(f"  Losing Trades:          {summary['losing_trades']}")
        print(f"  Win Rate:               {summary['win_rate_pct']:.2f}%")
        print(f"  Avg Win:                ${summary['avg_win']:.2f}")
        print(f"  Avg Loss:               ${summary['avg_loss']:.2f}")
        print(f"  Profit Factor:          {summary['profit_factor']:.2f}x")
        
        print(f"\nTOP 5 PERFORMERS:")
        for i, trade in enumerate(report["top_performers"], 1):
            print(f"  {i}. {trade.token_symbol:15s} | Entry: ${trade.entry_price:.8f} | Exit: ${trade.exit_price:.8f} | P&L: ${trade.pnl:.2f} ({trade.pnl_pct:.2f}%)")
        
        print(f"\nWORST 5 PERFORMERS:")
        for i, trade in enumerate(report["worst_performers"], 1):
            print(f"  {i}. {trade.token_symbol:15s} | Entry: ${trade.entry_price:.8f} | Exit: ${trade.exit_price:.8f} | P&L: ${trade.pnl:.2f} ({trade.pnl_pct:.2f}%)")
        
        print("\n" + "="*70)

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    backtester = SolanaBacktester(initial_balance=160.0)
    backtester.run_backtest(num_days=1, tokens_per_day=150)
    report = backtester.generate_report()
    backtester.print_report(report)
    
    # Save report to JSON
    report_file = "/Users/penn/.openclaw/workspace/backtest_report.json"
    with open(report_file, 'w') as f:
        # Convert Trade objects to dicts for JSON serialization
        report_copy = report.copy()
        report_copy["top_performers"] = [asdict(t) for t in report_copy["top_performers"]]
        report_copy["worst_performers"] = [asdict(t) for t in report_copy["worst_performers"]]
        report_copy["all_trades"] = [asdict(t) for t in report_copy["all_trades"]]
        json.dump(report_copy, f, indent=2, default=str)
    
    print(f"\nReport saved to: {report_file}")
