import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch from API
        const response = await axios.get('/api/trades');
        setStats(response.data.stats);
        setTrades(response.data.trades || []);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError('Failed to load data. Make sure the API is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '0.9em', color: '#aaa' }}>
            Make sure the trading bot is running and has generated trades.
          </p>
        </div>
      </div>
    );
  }

  const closedTrades = trades.filter(t => 'exit_price' in t);
  const openTrades = trades.filter(t => !('exit_price' in t));

  const pnlData = closedTrades.map((t, i) => ({
    trade: i + 1,
    pnl: parseFloat((t.pnl || 0).toFixed(2))
  }));

  const winLossData = [
    { name: 'Wins', value: stats?.wins || 0, fill: '#00ff88' },
    { name: 'Losses', value: stats?.losses || 0, fill: '#ff4757' }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>📊 Polymarket Trading Dashboard</h1>
          <p style={styles.subtitle}>Real-time trading performance & analytics</p>
        </div>
        <div style={styles.lastUpdate}>
          {lastUpdated && (
            <small>Last updated: {format(lastUpdated, 'HH:mm:ss UTC')}</small>
          )}
        </div>
      </header>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>Bot Status</span>
          <span style={{ ...styles.statusValue, color: '#00ff88' }}>● ACTIVE</span>
        </div>
        {stats?.consecutive_losses > 0 && (
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Circuit Breaker</span>
            <span style={{ ...styles.statusValue, color: '#ff6b00' }}>⚠ {stats.consecutive_losses} losses</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Total P&L"
          value={`$${(stats?.total_pnl || 0).toFixed(2)}`}
          color={stats?.total_pnl > 0 ? '#00ff88' : stats?.total_pnl < 0 ? '#ff4757' : '#00d4ff'}
          subtitle={`${(stats?.avg_pnl_pct || 0).toFixed(2)}% avg per trade`}
        />
        <StatCard
          title="Win Rate"
          value={`${(stats?.win_rate || 0).toFixed(1)}%`}
          color="#00d4ff"
          subtitle={`${stats?.wins || 0}W / ${stats?.losses || 0}L`}
        />
        <StatCard
          title="Total Trades"
          value={stats?.total_trades || 0}
          color="#a0a0ff"
          subtitle={`${openTrades.length} open, ${closedTrades.length} closed`}
        />
        <StatCard
          title="Circuit Breaker"
          value={stats?.consecutive_losses >= 3 ? '🛑 ACTIVE' : '✓ OK'}
          color={stats?.consecutive_losses >= 3 ? '#ff4757' : '#00ff88'}
          subtitle={`${stats?.consecutive_losses || 0} consecutive losses`}
        />
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        {/* P&L Chart */}
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>P&L Per Trade</h3>
          {pnlData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.1)" />
                <XAxis dataKey="trade" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  contentStyle={styles.tooltipStyle}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#00ff88"
                  dot={{ fill: '#00ff88', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.emptyState}>No closed trades yet</p>
          )}
        </div>

        {/* Win/Loss Pie */}
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Win/Loss Distribution</h3>
          {(stats?.wins || 0) + (stats?.losses || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={styles.tooltipStyle}
                  formatter={(value) => [`${value} trades`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.emptyState}>No trades yet</p>
          )}
        </div>
      </div>

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🟢 Open Positions ({openTrades.length})</h3>
          <div style={styles.tradesTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Time</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Position</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.slice(0, 10).map((trade, i) => (
                  <tr key={i} style={styles.tableRow}>
                    <td>{format(parseISO(trade.entry_time), 'MMM dd, HH:mm:ss')}</td>
                    <td style={{ fontSize: '0.9em', color: '#a0a0a0' }}>{trade.market_id}</td>
                    <td style={{ color: trade.side === 'buy' ? '#00ff88' : '#ff4757' }}>
                      {trade.side.toUpperCase()}
                    </td>
                    <td>{trade.entry_price.toFixed(4)}</td>
                    <td>${trade.position_size.toFixed(2)}</td>
                    <td>Pending</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade History */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📈 Trade History ({closedTrades.length})</h3>
        {closedTrades.length > 0 ? (
          <div style={styles.tradesTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Entry Time</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Position</th>
                  <th>P&L</th>
                  <th>Return %</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.slice(0, 20).reverse().map((trade, i) => {
                  const isWin = trade.pnl > 0;
                  return (
                    <tr key={i} style={styles.tableRow}>
                      <td style={{ fontSize: '0.85em' }}>
                        {format(parseISO(trade.entry_time), 'MMM dd, HH:mm')}
                      </td>
                      <td style={{ fontSize: '0.9em', color: '#a0a0a0' }}>{trade.market_id}</td>
                      <td style={{ color: trade.side === 'buy' ? '#00ff88' : '#ff4757' }}>
                        {trade.side.toUpperCase()}
                      </td>
                      <td>{trade.entry_price.toFixed(4)}</td>
                      <td>{trade.exit_price?.toFixed(4) || '--'}</td>
                      <td>${trade.position_size.toFixed(2)}</td>
                      <td style={{ color: isWin ? '#00ff88' : '#ff4757', fontWeight: 'bold' }}>
                        ${trade.pnl?.toFixed(2) || 0}
                      </td>
                      <td style={{ color: isWin ? '#00ff88' : '#ff4757', fontWeight: 'bold' }}>
                        {trade.pnl_pct?.toFixed(1) || 0}%
                      </td>
                      <td>{trade.duration_minutes || '--'}m</td>
                      <td style={{ color: isWin ? '#00ff88' : '#ff4757' }}>
                        {isWin ? '✓ WIN' : '✗ LOSS'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.emptyState}>No closed trades yet. Waiting for first signal...</p>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Polymarket Paper Trading Dashboard • Real-time updates every 30 seconds</p>
        <p style={{ fontSize: '0.85em', color: '#808080' }}>
          Data source: Local trading bot • Last sync: {lastUpdated ? format(lastUpdated, 'HH:mm:ss UTC') : 'Never'}
        </p>
      </footer>
    </div>
  );
}

function StatCard({ title, value, color, subtitle }) {
  return (
    <div style={{ ...styles.statCard, borderColor: color }}>
      <h4 style={styles.statTitle}>{title}</h4>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      {subtitle && <p style={styles.statSubtitle}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
    color: '#e0e0e0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '20px',
  },
  header: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #00d4ff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '2.5em',
    margin: 0,
    marginBottom: '5px',
    background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    margin: 0,
    color: '#a0a0a0',
    fontSize: '1em',
  },
  lastUpdate: {
    textAlign: 'right',
    color: '#808080',
  },
  statusBar: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    padding: '15px',
    background: 'rgba(0,212,255,0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(0,212,255,0.1)',
  },
  statusItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#a0a0a0',
    fontSize: '0.9em',
  },
  statusValue: {
    fontWeight: 'bold',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '15px',
    marginBottom: '40px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%)',
    border: '2px solid #00d4ff',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  statTitle: {
    margin: 0,
    marginBottom: '10px',
    color: '#00d4ff',
    fontSize: '0.85em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statValue: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  statSubtitle: {
    margin: 0,
    color: '#a0a0a0',
    fontSize: '0.85em',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  chartContainer: {
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%)',
    border: '2px solid #00d4ff',
    borderRadius: '12px',
    padding: '20px',
  },
  chartTitle: {
    margin: '0 0 20px 0',
    color: '#00d4ff',
    fontSize: '1em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tooltipStyle: {
    background: '#1a1a3e',
    border: '1px solid #00d4ff',
    borderRadius: '8px',
    color: '#e0e0e0',
  },
  emptyState: {
    textAlign: 'center',
    color: '#a0a0a0',
    padding: '40px 20px',
  },
  section: {
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%)',
    border: '2px solid #00d4ff',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    color: '#00d4ff',
    fontSize: '1.1em',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tradesTable: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9em',
  },
  tableHeader: {
    background: 'rgba(0,212,255,0.1)',
    borderBottom: '2px solid #00d4ff',
  },
  tableRow: {
    borderBottom: '1px solid rgba(0,212,255,0.1)',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    borderTop: '2px solid #00d4ff',
    color: '#808080',
    fontSize: '0.85em',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(0,212,255,0.3)',
    borderTop: '3px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
    textAlign: 'center',
  },
};

// Add animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
