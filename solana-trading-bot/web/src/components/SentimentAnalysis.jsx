import { useApi } from '../hooks/useApi'

export function SentimentAnalysis() {
  const { data: sentiments, loading } = useApi('/sentiment', { interval: 60000 })

  if (loading) {
    return <div className="card animate-pulse h-48 bg-dark-700" />
  }

  if (!sentiments || sentiments.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
        <div className="text-center py-8 text-gray-400">No sentiment data available</div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>

      <div className="space-y-4">
        {sentiments.slice(0, 5).map((token, idx) => (
          <SentimentItem key={idx} token={token} />
        ))}
      </div>
    </div>
  )
}

function SentimentItem({ token }) {
  const score = token.score || 0
  const getColor = () => {
    if (score < 0.4) return 'bg-red-600'
    if (score < 0.6) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  const getScoreText = () => {
    if (score < 0.4) return 'Negative'
    if (score < 0.6) return 'Neutral'
    return 'Positive'
  }

  const getScoreColor = () => {
    if (score < 0.4) return 'text-red-400'
    if (score < 0.6) return 'text-yellow-400'
    return 'text-green-400'
  }

  const platforms = token.platforms || {}

  return (
    <div className="border border-dark-600 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{token.token}</h3>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${getScoreColor()}`}>
            {getScoreText()}
          </span>
          <span className="text-sm text-gray-400">
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="w-full bg-dark-700 h-2 rounded overflow-hidden mb-3">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${score * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        {platforms.twitter !== undefined && (
          <div className="bg-dark-700 p-2 rounded">
            <div className="text-gray-400">Twitter</div>
            <div className="font-semibold text-blue-400">
              {(platforms.twitter * 100).toFixed(0)}%
            </div>
          </div>
        )}
        {platforms.discord !== undefined && (
          <div className="bg-dark-700 p-2 rounded">
            <div className="text-gray-400">Discord</div>
            <div className="font-semibold text-purple-400">
              {(platforms.discord * 100).toFixed(0)}%
            </div>
          </div>
        )}
        {platforms.telegram !== undefined && (
          <div className="bg-dark-700 p-2 rounded">
            <div className="text-gray-400">Telegram</div>
            <div className="font-semibold text-blue-400">
              {(platforms.telegram * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
