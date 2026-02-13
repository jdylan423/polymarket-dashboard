#!/usr/bin/env python3
"""
Polymarket Paper Trading Dashboard Server
Flask backend for real-time trading dashboard
"""

import json
from flask import Flask, render_template_string, jsonify
from datetime import datetime
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# HTML Template
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polymarket Paper Trading Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
            color: #e0e0e0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #00d4ff;
            padding-bottom: 20px;
        }
        
        h1 {
            font-size: 2.5em;
            background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin-top: 10px;
        }
        
        .status.active {
            background: #00ff88;
            color: #000;
        }
        
        .status.paused {
            background: #ff6b00;
            color: #fff;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%);
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-card h3 {
            color: #00d4ff;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-value.positive { color: #00ff88; }
        .stat-value.negative { color: #ff4757; }
        .stat-value.neutral { color: #00d4ff; }
        
        .stat-detail {
            font-size: 0.8em;
            color: #a0a0a0;
            margin-top: 10px;
        }
        
        .circuit-breaker {
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 10px;
            font-size: 0.85em;
        }
        
        .circuit-breaker.active {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff4757;
            color: #ff4757;
        }
        
        .circuit-breaker.inactive {
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            color: #00ff88;
        }
        
        .charts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .chart-container {
            background: linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%);
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 25px;
            position: relative;
            height: 400px;
        }
        
        .chart-container h3 {
            color: #00d4ff;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .trades-section {
            background: linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%);
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 25px;
        }
        
        .trades-section h3 {
            color: #00d4ff;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .trades-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .trades-table th {
            background: rgba(0, 212, 255, 0.1);
            color: #00d4ff;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #00d4ff;
            font-size: 0.85em;
        }
        
        .trades-table td {
            padding: 12px;
            border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }
        
        .trades-table tr:hover {
            background: rgba(0, 212, 255, 0.05);
        }
        
        .trade-win { color: #00ff88; }
        .trade-loss { color: #ff4757; }
        .trade-open { color: #ffa502; }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #a0a0a0;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #00d4ff;
            color: #808080;
            font-size: 0.85em;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 1.5em; }
            .stats-grid { grid-template-columns: 1fr; }
            .charts { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Polymarket Paper Trading</h1>
            <p>Real-time Mean-Reversion Strategy Dashboard</p>
            <span id="status" class="status active">● ACTIVE</span>
        </header>
        
        <!-- Stats Grid -->
        <div class="stats-grid" id="stats-container">
            <div class="stat-card">
                <h3>Total Trades</h3>
                <div class="stat-value neutral" id="total-trades">0</div>
                <div class="stat-detail" id="active-trades">0 open positions</div>
            </div>
            
            <div class="stat-card">
                <h3>Total P&L</h3>
                <div class="stat-value" id="total-pnl">$0.00</div>
                <div class="stat-detail" id="avg-pnl">Avg: 0.00%</div>
            </div>
            
            <div class="stat-card">
                <h3>Win Rate</h3>
                <div class="stat-value" id="win-rate">0%</div>
                <div class="stat-detail"><span id="wins">0</span>W / <span id="losses">0</span>L</div>
            </div>
            
            <div class="stat-card">
                <h3>Circuit Breaker</h3>
                <div id="circuit-status" class="circuit-breaker inactive">✓ OPERATIONAL</div>
                <div class="stat-detail" id="consec-losses">0 consecutive losses</div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="charts">
            <div class="chart-container">
                <h3>P&L Distribution</h3>
                <canvas id="pnlChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Win/Loss Ratio</h3>
                <canvas id="winLossChart"></canvas>
            </div>
        </div>
        
        <!-- Recent Trades -->
        <div class="trades-section">
            <h3>Recent Trades</h3>
            <table class="trades-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Market</th>
                        <th>Side</th>
                        <th>Price</th>
                        <th>Position</th>
                        <th>Exit Price</th>
                        <th>P&L</th>
                        <th>Return %</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody id="trades-tbody">
                    <tr><td colspan="9" class="empty-state">No trades yet</td></tr>
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Last updated: <span id="last-update">--:--:--</span> UTC</p>
            <p>Polymarket API • Python Trading Bot • Paper Trading Only</p>
        </div>
    </div>
    
    <script>
        let pnlChart = null;
        let winLossChart = null;
        
        async function updateDashboard() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                // Update stats
                document.getElementById('total-trades').textContent = data.stats.total_trades;
                document.getElementById('total-pnl').textContent = '$' + data.stats.total_pnl.toFixed(2);
                document.getElementById('avg-pnl').textContent = 'Avg: ' + data.stats.avg_pnl_pct.toFixed(2) + '%';
                document.getElementById('win-rate').textContent = data.stats.win_rate.toFixed(1) + '%';
                document.getElementById('wins').textContent = data.stats.wins;
                document.getElementById('losses').textContent = data.stats.losses;
                
                // Update P&L color
                const pnlElement = document.getElementById('total-pnl');
                if (data.stats.total_pnl > 0) {
                    pnlElement.classList = 'stat-value positive';
                } else if (data.stats.total_pnl < 0) {
                    pnlElement.classList = 'stat-value negative';
                } else {
                    pnlElement.classList = 'stat-value neutral';
                }
                
                // Update circuit breaker
                const circuitStatus = document.getElementById('circuit-status');
                const circuitLimit = 3;
                if (data.stats.consecutive_losses >= circuitLimit) {
                    circuitStatus.classList = 'circuit-breaker active';
                    circuitStatus.textContent = '⛔ CIRCUIT BREAKER ACTIVE';
                } else {
                    circuitStatus.classList = 'circuit-breaker inactive';
                    circuitStatus.textContent = '✓ OPERATIONAL';
                }
                document.getElementById('consec-losses').textContent = data.stats.consecutive_losses + ' consecutive losses';
                
                // Update charts
                updateCharts(data.stats);
                
                // Update trades table
                updateTradesTable(data.trades);
                
                // Update timestamp
                document.getElementById('last-update').textContent = new Date().toLocaleTimeString('en-US', {hour12: false});
                
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }
        
        function updateCharts(stats) {
            // P&L Distribution
            const pnlCtx = document.getElementById('pnlChart').getContext('2d');
            if (pnlChart) pnlChart.destroy();
            
            pnlChart = new Chart(pnlCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Wins', 'Losses'],
                    datasets: [{
                        data: [stats.wins, stats.losses],
                        backgroundColor: ['#00ff88', '#ff4757'],
                        borderColor: '#1a1a3e',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#e0e0e0' }
                        }
                    }
                }
            });
            
            // Win/Loss Ratio
            const winLossCtx = document.getElementById('winLossChart').getContext('2d');
            if (winLossChart) winLossChart.destroy();
            
            const winRate = stats.total_trades > 0 ? (stats.wins / stats.total_trades) * 100 : 0;
            const lossRate = 100 - winRate;
            
            winLossChart = new Chart(winLossCtx, {
                type: 'bar',
                data: {
                    labels: ['Win Rate'],
                    datasets: [
                        {
                            label: 'Wins',
                            data: [winRate],
                            backgroundColor: '#00ff88'
                        },
                        {
                            label: 'Losses',
                            data: [lossRate],
                            backgroundColor: '#ff4757'
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, ticks: { color: '#a0a0a0' } },
                        y: { stacked: true, ticks: { color: '#a0a0a0' } }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#e0e0e0' }
                        }
                    }
                }
            });
        }
        
        function updateTradesTable(trades) {
            const tbody = document.getElementById('trades-tbody');
            
            if (!trades || trades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No trades yet. Waiting for signals...</td></tr>';
                return;
            }
            
            tbody.innerHTML = trades.reverse().slice(0, 20).map(trade => {
                const hasExit = 'exit_price' in trade;
                const pnl = trade.pnl ? trade.pnl.toFixed(2) : '--';
                const pnlPct = trade.pnl_pct ? trade.pnl_pct.toFixed(1) : '--';
                const pnlClass = hasExit ? (trade.pnl > 0 ? 'trade-win' : 'trade-loss') : 'trade-open';
                const duration = trade.duration_minutes ? trade.duration_minutes + 'm' : '--';
                
                const time = new Date(trade.entry_time).toLocaleTimeString('en-US', {hour12: false});
                const market = trade.market_id;
                
                return `
                    <tr>
                        <td>${time}</td>
                        <td>${market}</td>
                        <td>${trade.side.toUpperCase()}</td>
                        <td>${trade.entry_price.toFixed(4)}</td>
                        <td>$${trade.position_size.toFixed(2)}</td>
                        <td>${hasExit ? trade.exit_price.toFixed(4) : '--'}</td>
                        <td class="${pnlClass}">$${pnl}</td>
                        <td class="${pnlClass}">${pnlPct}%</td>
                        <td>${duration}</td>
                    </tr>
                `;
            }).join('');
        }
        
        // Update on load
        updateDashboard();
        
        // Auto-update every 30 seconds
        setInterval(updateDashboard, 30000);
    </script>
</body>
</html>
'''

@app.route('/')
def dashboard():
    """Serve the dashboard"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/stats')
def api_stats():
    """API endpoint for dashboard stats"""
    try:
        with open('trades.json', 'r') as f:
            data = json.load(f)
        
        return jsonify({
            'stats': data.get('stats', {}),
            'trades': data.get('trades', []),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    except FileNotFoundError:
        return jsonify({
            'stats': {
                'total_trades': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0,
                'total_pnl': 0,
                'consecutive_losses': 0,
                'avg_pnl_pct': 0
            },
            'trades': [],
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })

if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("POLYMARKET PAPER TRADING DASHBOARD")
    print("=" * 80)
    print("\n📊 Dashboard running at: http://localhost:5001")
    print("🔄 Auto-refresh every 30 seconds")
    print("\nPress Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
