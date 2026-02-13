/**
 * Sentiment Overview Component
 * Displays sentiment analysis for monitored tokens
 */
export default function SentimentOverview({ data, loading }) {
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
        <p>No sentiment data</p>
      </div>
    )
  }

  const tokens = data.tokens || []

  const getSentimentColor = (score) => {
    if (score >= 0.7) return 'bg-green-900/30 border-green-700'
    if (score >= 0.5) return 'bg-yellow-900/30 border-yellow-700'
    return 'bg-red-900/30 border-red-700'
  }

  const getSentimentLabel = (score) => {
    if (score >= 0.7) return '🟢 Positive'
    if (score >= 0.5) return '🟡 Neutral'
    return '🔴 Negative'
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Sentiment Analysis</h2>

      {tokens.length === 0 ? (
        <p className="text-gray-400 text-sm">No sentiment data available</p>
      ) : (
        <div className="space-y-3">
          {tokens.map((token, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 border ${getSentimentColor(token.sentiment_score)}`}
            >
              {/* Token Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{token.symbol}</h3>
                  <p className="text-sm text-gray-400">{getSentimentLabel(token.sentiment_score)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {(token.sentiment_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-400">Sentiment</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      token.sentiment_score >= 0.7
                        ? 'bg-green-500'
                        : token.sentiment_score >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${token.sentiment_score * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-400">
                  <div>Twitter</div>
                  <div className="text-white">
                    {token.twitter_mentions} mentions
                    <span className={token.twitter_growth >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {' '}({token.twitter_growth >= 0 ? '+' : ''}{token.twitter_growth}%)
                    </span>
                  </div>
                </div>
                <div className="text-gray-400">
                  <div>Discord</div>
                  <div className="text-white">
                    {token.discord_members.toLocaleString()} members
                    <span className="text-green-400"> ({token.discord_online} online)</span>
                  </div>
                </div>
              </div>

              {/* Trending Score */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Trending Score</span>
                  <span className="font-semibold">
                    {(token.trending_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Average Sentiment */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Average Sentiment</span>
              <span className="font-semibold">
                {(data.average_sentiment * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
