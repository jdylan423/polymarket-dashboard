/**
 * Status Panel Component
 * Shows bot running status, uptime, and health indicators
 */
export default function StatusPanel({ data, loading }) {
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
        <p>No data available</p>
      </div>
    )
  }

  const statusColor = data.running ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
  const statusIcon = data.running ? '✓' : '✗'

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Bot Status</h2>
      
      {/* Status Indicator */}
      <div className={`${statusColor} rounded-lg p-4 mb-4 font-semibold`}>
        <div className="text-2xl mb-2">{statusIcon}</div>
        <div>{data.running ? 'RUNNING' : 'STOPPED'}</div>
      </div>

      {/* Stats */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Uptime</span>
          <span className="font-medium">{data.uptimeFormatted || '0h 0m'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Market Scans</span>
          <span className="font-medium">{data.scanCount || 0}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Total Trades</span>
          <span className="font-medium">{data.tradeCount || 0}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Memory Usage</span>
          <span className="font-medium">
            {Math.round((data.memory?.heapUsed || 0) / 1024 / 1024)}MB / {Math.round((data.memory?.heapTotal || 0) / 1024 / 1024)}MB
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Errors</span>
          <span className={data.errors > 0 ? 'text-red-400 font-medium' : 'font-medium'}>
            {data.errors || 0}
          </span>
        </div>
      </div>

      {/* Session ID */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 truncate">
          Session: {data.sessionId}
        </div>
      </div>
    </div>
  )
}
