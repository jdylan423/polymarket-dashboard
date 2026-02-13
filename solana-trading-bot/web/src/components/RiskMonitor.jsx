/**
 * Risk Monitor Component
 * Displays safeguard status and risk levels
 */
export default function RiskMonitor({ data, loading }) {
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
        <p>No risk data</p>
      </div>
    )
  }

  const healthColor = 
    data.health_status === 'good' ? 'text-green-400' :
    data.health_status === 'warning' ? 'text-yellow-400' :
    'text-red-400'

  const capitalPercent = (data.current_positions / data.max_simultaneous_positions) * 100

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Risk Status</h2>

      {/* Health Status */}
      <div className={`${healthColor} font-semibold mb-4 p-3 bg-gray-700/50 rounded`}>
        ✓ Health: {data.health_status.toUpperCase()}
      </div>

      {/* Safeguards */}
      <div className="space-y-3 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Safeguards</span>
          <span className={data.safeguards_active ? 'text-green-400' : 'text-red-400'}>
            {data.safeguards_active ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>

        <div className="border-t border-gray-700"></div>

        {/* Portfolio Stop Loss */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Portfolio SL</span>
            <span className={data.portfolio_stop_loss_triggered ? 'text-red-400 font-bold' : ''}>
              {data.portfolio_current_loss_percent.toFixed(2)}% / {data.portfolio_stop_loss_percent}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded transition-all ${
                data.portfolio_current_loss_percent > data.portfolio_stop_loss_percent * 0.8
                  ? 'bg-red-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(
                  (data.portfolio_current_loss_percent / data.portfolio_stop_loss_percent) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Daily Loss Limit */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Daily Loss</span>
            <span className={data.daily_loss_triggered ? 'text-red-400 font-bold' : ''}>
              {data.daily_loss_current.toFixed(2)} / {data.daily_loss_limit} SOL
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded transition-all ${
                data.daily_loss_percent > 80 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(data.daily_loss_percent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Position Limit */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Positions</span>
            <span>
              {data.current_positions} / {data.max_simultaneous_positions}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded transition-all ${
                capitalPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${capitalPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error Status */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Recent Errors</span>
          <span className={data.error_count > 0 ? 'text-yellow-400' : 'text-green-400'}>
            {data.error_count}
          </span>
        </div>
      </div>
    </div>
  )
}
