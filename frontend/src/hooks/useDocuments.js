import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api/documents'
import { getErrorMessage } from '../api/errors'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 20
const POLL_MS = 3000

export default function useDocuments() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.listDocuments({ limit: PAGE_SIZE })
      setItems(page.items)
      setTotal(page.total)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const page = await api.listDocuments({ limit: PAGE_SIZE, offset: itemsRef.current.length })
      setItems((list) => [...list, ...page.items.filter((d) => !list.some((x) => x.id === d.id))])
      setTotal(page.total)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }, [toast])

  // Poll while anything is processing. There is no single-document endpoint,
  // so re-fetch the loaded window and announce status changes.
  const hasProcessing = items.some((d) => d.status === 'processing')
  useEffect(() => {
    if (!hasProcessing) return
    const timer = setInterval(async () => {
      try {
        const limit = Math.min(Math.max(itemsRef.current.length, PAGE_SIZE), 100)
        const page = await api.listDocuments({ limit })
        const before = new Map(itemsRef.current.map((d) => [d.id, d.status]))
        for (const doc of page.items) {
          if (before.get(doc.id) !== 'processing' || doc.status === 'processing') continue
          if (doc.status === 'ready') toast.success(`“${doc.filename}” is ready to chat with.`)
          else toast.error(`“${doc.filename}” failed to process.`)
        }
        setItems((list) => [...page.items, ...list.slice(page.items.length).filter((d) => !page.items.some((x) => x.id === d.id))])
        setTotal(page.total)
      } catch {
        // transient; the next tick retries (a 401 is handled globally)
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [hasProcessing, toast])

  const upload = useCallback(async (file, onProgress) => {
    const doc = await api.uploadDocument(file, onProgress)
    setItems((list) => [doc, ...list])
    setTotal((t) => t + 1)
    return doc
  }, [])

  const remove = useCallback(async (id) => {
    await api.deleteDocument(id)
    setItems((list) => list.filter((d) => d.id !== id))
    setTotal((t) => Math.max(t - 1, 0))
  }, [])

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: items.length < total,
    readyDocuments: items.filter((d) => d.status === 'ready'),
    reload: load,
    loadMore,
    upload,
    remove,
  }
}
