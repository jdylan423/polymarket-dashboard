/**
 * Performance Charts Component
 * Displays P&L trends and performance metrics
 */
export default function PerformanceCharts({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-gray-400">
        <p>No performance data</p>
      </div>
    )
  }

  const pnlChart = data.pnl_chart || []
  const minPnl = Math.min(...pnlChart.map(d => d.pnl), 0)
  const maxPnl = Math.max(...pnlChart.map(d => d.pnl), 0)
  const range = maxPnl - minPnl || 1

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">24H P&L Trend</h2>

      {/* Simple Chart Visualization */}
      <div className="h-48 flex items-end justify-between gap-1 bg-gray-900/30 rounded p-4 mb-4">
        {pnlChart.slice(-48).map((point, idx) => {
          const height = ((point.pnl - minPnl) / range) * 100
          const color = point.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'

          return (
            <div
              key={idx}
              className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
              style={{
                height: `${Math.max(height, 2)}%`,
                minHeight: '2px',
              }}
              title={`${point.pnl.toFixed(4)} SOL`}
            ></div>
          )
        })}
      </div>

      <div className="text-xs text-gray-400 text-center mb-4">Last 24 hours (5-min intervals)</div>

      {/* Top Wins */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Top Wins</h3>
        <div className="space-y-1">
          {(data.largest_wins || []).slice(0, 3).map((trade, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm p-2 bg-green-900/20 rounded text-green-400"
            >
              <span>{trade.symbol}</span>
              <span>+{trade.pnl.toFixed(4)} SOL (+{trade.pnl_percent.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Losses */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Top Losses</h3>
        <div className="space-y-1">
          {(data.largest_losses || []).slice(0, 3).map((trade, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm p-2 bg-red-900/20 rounded text-red-400"
            >
              <span>{trade.symbol}</span>
              <span>{trade.pnl.toFixed(4)} SOL ({trade.pnl_percent.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
