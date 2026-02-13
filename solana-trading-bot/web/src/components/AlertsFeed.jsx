/**
 * Alerts Feed Component
 * Displays recent alerts and events
 */
export default function AlertsFeed({ alerts, loading }) {
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

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>

      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm">No recent alerts</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alerts.map((alert, idx) => {
            const typeColor =
              alert.type === 'error'
                ? 'text-red-400 bg-red-900/20'
                : alert.type === 'warning'
                ? 'text-yellow-400 bg-yellow-900/20'
                : 'text-green-400 bg-green-900/20'

            const typeEmoji =
              alert.type === 'error' ? '✗' : alert.type === 'warning' ? '⚠' : '✓'

            return (
              <div
                key={idx}
                className={`${typeColor} rounded p-3 text-sm flex items-start gap-3`}
              >
                <span className="font-bold mt-0.5">{typeEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">{alert.timestamp}</div>
                  <div className="truncate">{alert.message}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
