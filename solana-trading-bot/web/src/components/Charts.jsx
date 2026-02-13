import { useApi } from '../hooks/useApi'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export function Charts() {
  const { data: pnlData } = useApi('/charts/pnl', { interval: 30000 })
  const { data: dailyData } = useApi('/charts/daily', { interval: 30000 })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* P&L Over Time */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">P&L Over Time (24h)</h3>
        {pnlData && pnlData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Daily P&L */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Daily P&L (Last 7 Days)</h3>
        {dailyData && dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="pnl" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Win/Loss Distribution */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Win/Loss Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Wins', value: 65, fill: '#10b981' },
                { name: 'Losses', value: 35, fill: '#ef4444' }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Trade Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Trades:</span>
            <span className="font-semibold">142</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Winning Trades:</span>
            <span className="font-semibold text-green-400">92</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Losing Trades:</span>
            <span className="font-semibold text-red-400">50</span>
          </div>
          <div className="h-px bg-dark-700 my-2" />
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Win:</span>
            <span className="font-semibold text-green-400">+0.042 SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Loss:</span>
            <span className="font-semibold text-red-400">-0.018 SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Profit Factor:</span>
            <span className="font-semibold text-blue-400">2.33</span>
          </div>
        </div>
      </div>
    </div>
  )
}
