import { useState, useEffect } from 'react'
import './App.css'
import StatusPanel from './components/StatusPanel'
import PortfolioOverview from './components/PortfolioOverview'
import PositionsTable from './components/PositionsTable'
import AlertsFeed from './components/AlertsFeed'
import PerformanceCharts from './components/PerformanceCharts'
import SentimentOverview from './components/SentimentOverview'
import RiskMonitor from './components/RiskMonitor'

/**
 * Main Dashboard App
 * Real-time monitoring of Solana Trading Bot
 */
function App() {
  const [status, setStatus] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [positions, setPositions] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  /**
   * Fetch all dashboard data
   */
  const fetchData = async () => {
    try {
      const [
        statusRes,
        portfolioRes,
        positionsRes,
        alertsRes,
        sentimentRes,
        performanceRes,
        riskRes,
      ] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/portfolio'),
        fetch('/api/positions'),
        fetch('/api/alerts?limit=15'),
        fetch('/api/sentiment'),
        fetch('/api/performance'),
        fetch('/api/risk'),
      ])

      if (!statusRes.ok) throw new Error('Failed to fetch status')

      const [statusData, portfolioData, positionsData, alertsData, sentimentData, performanceData, riskData] =
        await Promise.all([
          statusRes.json(),
          portfolioRes.json(),
          positionsRes.json(),
          alertsRes.json(),
          sentimentRes.json(),
          performanceRes.json(),
          riskRes.json(),
        ])

      setStatus(statusData)
      setPortfolio(portfolioData)
      setPositions(positionsData)
      setAlerts(alertsData.alerts || [])
      setSentiment(sentimentData)
      setPerformance(performanceData)
      setRisk(riskData)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Initial load and refresh every 5 seconds
   */
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (error && loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">⚠️ Connection Error</h1>
          <p className="text-xl mb-4">{error}</p>
          <p className="text-gray-400">Make sure the dashboard server is running on port 3001</p>
          <p className="text-gray-400 mt-2">Run: npm run dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">🤖 Trading Bot Dashboard</h1>
              <div className="text-sm text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              ⟳ Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Row: Status and Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <StatusPanel data={status} loading={loading} />
          <PortfolioOverview data={portfolio} loading={loading} />
          <RiskMonitor data={risk} loading={loading} />
        </div>

        {/* Middle Row: Charts and Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceCharts data={performance} loading={loading} />
          <SentimentOverview data={sentiment} loading={loading} />
        </div>

        {/* Bottom Row: Positions and Alerts */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <PositionsTable data={positions} loading={loading} />
        </div>

        {/* Alerts Feed */}
        <div className="mb-8">
          <AlertsFeed alerts={alerts} loading={loading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Auto-refreshing every 5 seconds • Solana Trading Bot v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}

export default App
