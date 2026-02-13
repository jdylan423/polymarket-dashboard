import { useState } from 'react'
import { StatusPanel } from '../components/StatusPanel'
import { PortfolioOverview } from '../components/PortfolioOverview'
import { PositionsTable } from '../components/PositionsTable'
import { Charts } from '../components/Charts'
import { TradeHistory } from '../components/TradeHistory'
import { AlertsFeed } from '../components/AlertsFeed'
import { RiskMonitor } from '../components/RiskMonitor'
import { SentimentAnalysis } from '../components/SentimentAnalysis'

export function Dashboard() {
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { label: 'Overview', id: 'overview' },
    { label: 'Positions', id: 'positions' },
    { label: 'Charts', id: 'charts' },
    { label: 'Trade History', id: 'history' },
    { label: 'Risk Monitor', id: 'risk' },
    { label: 'Sentiment', id: 'sentiment' },
  ]

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-dark-900 text-white min-h-screen">
        {/* Header */}
        <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">Trading Bot Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Toggle theme"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4 10a2 2 0 11-4 0 2 2 0 014 0zm14 0a2 2 0 11-4 0 2 2 0 014 0zm0 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1h-4a1 1 0 011-1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                TB
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-64 bg-dark-800 border-r border-dark-700 min-h-screen">
              <nav className="p-6 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block px-4 py-3 rounded-lg hover:bg-dark-700 transition-colors font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <section id="overview">
              <h2 className="text-2xl font-bold mb-4">System Status</h2>
              <StatusPanel />
            </section>

            <section id="overview">
              <PortfolioOverview />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AlertsFeed />
              </div>
              <div>
                <RiskMonitor />
              </div>
            </div>

            <section id="positions">
              <PositionsTable />
            </section>

            <section id="charts">
              <Charts />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <section id="history">
                  <TradeHistory />
                </section>
              </div>
              <div>
                <section id="sentiment">
                  <SentimentAnalysis />
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
