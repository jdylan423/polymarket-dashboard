import { useState } from 'react'
import { useApi } from '../hooks/useApi'

export function TradeHistory() {
  const { data: trades, loading } = useApi('/positions/closed', { interval: 30000 })
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  if (loading) {
    return <div className="card animate-pulse h-64 bg-dark-700" />
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Trade History</h2>
        <div className="text-center py-8 text-gray-400">No closed trades</div>
      </div>
    )
  }

  let filtered = trades
  if (filter !== 'all') {
    filtered = trades.filter(t => t.reason === filter)
  }
  if (searchTerm) {
    filtered = filtered.filter(t => t.symbol.includes(searchTerm.toUpperCase()))
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Trade History</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
          <div className="flex gap-2">
            {['all', 'TP', 'SL', 'Manual'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-dark-700 border-b border-dark-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-400">Token</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-400">Entry Price</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-400">Exit Price</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-400">P&L</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-400">Duration</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-400">Result</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trade, idx) => {
              const pnlColor = trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              const resultColor = trade.reason === 'TP' ? 'bg-green-900 text-green-100' :
                                 trade.reason === 'SL' ? 'bg-red-900 text-red-100' :
                                 'bg-yellow-900 text-yellow-100'

              return (
                <tr
                  key={idx}
                  className="border-b border-dark-700 hover:bg-dark-700 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold">{trade.symbol}</td>
                  <td className="text-right px-4 py-3 text-gray-400">
                    ${trade.entryPrice.toFixed(6)}
                  </td>
                  <td className="text-right px-4 py-3 text-gray-400">
                    ${trade.exitPrice.toFixed(6)}
                  </td>
                  <td className={`text-right px-4 py-3 font-semibold ${pnlColor}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(4)} SOL
                  </td>
                  <td className="text-right px-4 py-3 text-gray-400">
                    {formatDuration(trade.duration)}
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${resultColor}`}>
                      {trade.reason}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 text-gray-400">
                    {new Date(trade.exitTime).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          No trades match your search
        </div>
      )}
    </div>
  )
}

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}
