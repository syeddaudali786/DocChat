import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api/chat'
import { getErrorMessage } from '../api/errors'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 20

export default function useSessions() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const countRef = useRef(0)
  countRef.current = items.length

  // Re-fetch from the top (sessions are ordered by last activity), keeping as many rows as are shown.
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const limit = Math.min(Math.max(countRef.current, PAGE_SIZE), 100)
      const page = await api.listSessions({ limit })
      setItems(page.items)
      setTotal(page.total)
    } catch (err) {
      if (silent) toast.error(getErrorMessage(err))
      else setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const page = await api.listSessions({ limit: PAGE_SIZE, offset: countRef.current })
      setItems((list) => [...list, ...page.items.filter((s) => !list.some((x) => x.id === s.id))])
      setTotal(page.total)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }, [toast])

  const remove = useCallback(async (id) => {
    await api.deleteSession(id)
    setItems((list) => list.filter((s) => s.id !== id))
    setTotal((t) => Math.max(t - 1, 0))
  }, [])

  return { items, total, loading, loadingMore, error, hasMore: items.length < total, refresh, loadMore, remove }
}
