import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = '/api'

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}${endpoint}`)
      setData(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh if interval is specified
    if (options.interval) {
      const timer = setInterval(fetchData, options.interval)
      return () => clearInterval(timer)
    }
  }, [endpoint, options.interval])

  return { data, loading, error, refetch: fetchData }
}

export function useApiMutation(endpoint) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = async (method = 'GET', body = null) => {
    try {
      setLoading(true)
      const config = { method, url: `${API_BASE}${endpoint}` }
      if (body) {
        config.data = body
      }
      const response = await axios(config)
      setError(null)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
