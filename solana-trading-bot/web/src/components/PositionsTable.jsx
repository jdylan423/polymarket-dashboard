/**
 * Positions Table Component
 * Shows open and closed positions
 */
export default function PositionsTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-gray-400">
        <p>No positions data</p>
      </div>
    )
  }

  const openPositions = data.open || []
  const closedPositions = data.closed || []

  return (
    <div className="space-y-6">
      {/* Open Positions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Open Positions ({openPositions.length})</h2>

        {openPositions.length === 0 ? (
          <p className="text-gray-400 text-sm">No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-3 px-3">Token</th>
                  <th className="text-right py-3 px-3">Entry</th>
                  <th className="text-right py-3 px-3">Current</th>
                  <th className="text-right py-3 px-3">P&L</th>
                  <th className="text-right py-3 px-3">%</th>
                  <th className="text-right py-3 px-3">Time Held</th>
                  <th className="text-right py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((pos) => {
                  const pnlColor = pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  const statusColor =
                    pos.status === 'active' ? 'text-green-400' : 'text-yellow-400'

                  return (
                    <tr
                      key={pos.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                    >
                      <td className="py-3 px-3 font-medium">{pos.symbol}</td>
                      <td className="py-3 px-3 text-right">${pos.entryPrice.toFixed(6)}</td>
                      <td className="py-3 px-3 text-right">${pos.currentPrice.toFixed(6)}</td>
                      <td className={`py-3 px-3 text-right ${pnlColor} font-medium`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(4)} SOL
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlColor} font-medium`}>
                        {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {Math.floor(pos.duration / 3600)}h {Math.floor((pos.duration % 3600) / 60)}m
                      </td>
                      <td className={`py-3 px-3 text-right ${statusColor}`}>
                        {pos.status === 'active' ? '✓' : '⚠'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Positions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Trade History ({closedPositions.length})</h2>

        {closedPositions.length === 0 ? (
          <p className="text-gray-400 text-sm">No closed positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-3 px-3">Token</th>
                  <th className="text-right py-3 px-3">Entry → Exit</th>
                  <th className="text-right py-3 px-3">P&L</th>
                  <th className="text-right py-3 px-3">%</th>
                  <th className="text-right py-3 px-3">Duration</th>
                  <th className="text-left py-3 px-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((pos) => {
                  const pnlColor = pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'

                  return (
                    <tr key={pos.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="py-3 px-3 font-medium">{pos.symbol}</td>
                      <td className="py-3 px-3 text-right text-xs">
                        ${pos.entryPrice.toFixed(6)} → ${pos.exitPrice.toFixed(6)}
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlColor} font-medium`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(4)} SOL
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlColor} font-medium`}>
                        {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {Math.floor(pos.duration / 3600)}h {Math.floor((pos.duration % 3600) / 60)}m
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {pos.exitReason === 'take_profit' && '✓ TP'}
                        {pos.exitReason === 'stop_loss' && '✗ SL'}
                        {pos.exitReason === 'manual' && '⏹ Manual'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
