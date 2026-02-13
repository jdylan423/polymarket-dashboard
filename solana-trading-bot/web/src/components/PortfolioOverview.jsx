/**
 * Portfolio Overview Component
 * Displays P&L, win rate, and portfolio metrics
 */
export default function PortfolioOverview({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-gray-400">
        <p>No portfolio data</p>
      </div>
    )
  }

  const pnlColor = data.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
  const pnlBgColor = data.totalPnl >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Portfolio Overview</h2>

      {/* Main P&L */}
      <div className={`${pnlBgColor} rounded-lg p-4 mb-4`}>
        <div className="text-sm text-gray-400 mb-1">Total P&L</div>
        <div className={`${pnlColor} text-3xl font-bold`}>
          {data.totalPnl >= 0 ? '+' : ''}{data.totalPnl.toFixed(4)} SOL
        </div>
        <div className={`${pnlColor} text-sm mt-1`}>
          ({data.totalPnlPercent >= 0 ? '+' : ''}{data.totalPnlPercent.toFixed(2)}%)
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Realized P&L</span>
          <span className={data.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.realizedPnl >= 0 ? '+' : ''}{data.realizedPnl.toFixed(4)} SOL
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Unrealized P&L</span>
          <span className={data.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.unrealizedPnl >= 0 ? '+' : ''}{data.unrealizedPnl.toFixed(4)} SOL
          </span>
        </div>

        <div className="border-t border-gray-700 my-2"></div>

        <div className="flex justify-between">
          <span className="text-gray-400">Win Rate</span>
          <span className="font-medium">{data.winRate.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Trades</span>
          <span className="font-medium">{data.winTrades}W / {data.lossTrades}L ({data.totalTrades})</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Avg Win / Loss</span>
          <span className="font-medium">
            <span className="text-green-400">+{data.avgWin.toFixed(4)}</span> / <span className="text-red-400">{data.avgLoss.toFixed(4)}</span>
          </span>
        </div>

        <div className="border-t border-gray-700 my-2"></div>

        <div className="flex justify-between">
          <span className="text-gray-400">Best Trade</span>
          <span className="text-green-400">+{data.bestTrade.toFixed(4)} SOL</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Worst Trade</span>
          <span className="text-red-400">{data.worstTrade.toFixed(4)} SOL</span>
        </div>
      </div>
    </div>
  )
}
