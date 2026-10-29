import { useCallback, useRef, useState } from 'react'
import * as api from '../api/chat'
import { getErrorMessage } from '../api/errors'

const PAGE_SIZE = 100 // API maximum

const CHAT_ERRORS = {
  404: 'This chat no longer exists. Start a new chat and try again.',
  409: 'The selected document is not ready yet. Wait for processing to finish or search all documents.',
  429: 'You are sending questions too quickly. Wait a moment, then retry.',
  502: 'The language model is temporarily unavailable. Please retry in a few seconds.',
}

let localId = 0
const localMessage = (role, content, sources = []) => ({ id: `local-${++localId}`, role, content, sources })

export default function useChat({ onSessionChanged } = {}) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [earliestOffset, setEarliestOffset] = useState(0) // offset of the first loaded message
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null) // { message, question, documentId } of the failed send
  // Bumped on every session switch so late responses for an old session are ignored.
  const generation = useRef(0)

  const newChat = useCallback(() => {
    generation.current++
    setSessionId(null)
    setMessages([])
    setEarliestOffset(0)
    setError(null)
    setSending(false)
    setLoadingMessages(false)
  }, [])

  const openSession = useCallback(async (id) => {
    const gen = ++generation.current
    setSessionId(id)
    setMessages([])
    setError(null)
    setSending(false)
    setLoadingMessages(true)
    try {
      // Messages come oldest first; show the latest page.
      let page = await api.listMessages(id, { limit: PAGE_SIZE })
      if (page.total > PAGE_SIZE) {
        page = await api.listMessages(id, { limit: PAGE_SIZE, offset: page.total - PAGE_SIZE })
      }
      if (gen !== generation.current) return
      setMessages(page.items)
      setEarliestOffset(page.offset)
    } catch (err) {
      if (gen === generation.current) setError({ message: getErrorMessage(err, { 404: 'This chat no longer exists.' }) })
    } finally {
      if (gen === generation.current) setLoadingMessages(false)
    }
  }, [])

  const loadEarlier = useCallback(async () => {
    const gen = generation.current
    const offset = Math.max(earliestOffset - PAGE_SIZE, 0)
    setLoadingEarlier(true)
    try {
      const page = await api.listMessages(sessionId, { limit: earliestOffset - offset, offset })
      if (gen !== generation.current) return
      setMessages((list) => [...page.items, ...list])
      setEarliestOffset(offset)
    } catch (err) {
      setError({ message: getErrorMessage(err) })
    } finally {
      setLoadingEarlier(false)
    }
  }, [sessionId, earliestOffset])

  const send = useCallback(
    async (question, documentId) => {
      const gen = generation.current
      setError(null)
      setSending(true)
      setMessages((list) => [...list, localMessage('user', question)])
      try {
        const res = await api.askQuestion({ question, sessionId, documentId })
        if (gen !== generation.current) return
        setMessages((list) => [...list, localMessage('assistant', res.answer, res.sources)])
        setSessionId(res.session_id)
        onSessionChanged?.(res.session_id)
      } catch (err) {
        if (gen !== generation.current) return
        // Drop the unanswered question; the error banner offers to resend it.
        setMessages((list) => list.slice(0, -1))
        setError({ message: getErrorMessage(err, CHAT_ERRORS), question, documentId, status: err.response?.status })
      } finally {
        if (gen === generation.current) setSending(false)
      }
    },
    [sessionId, onSessionChanged],
  )

  const retry = useCallback(() => {
    if (error?.question) send(error.question, error.documentId)
  }, [error, send])

  return {
    sessionId,
    messages,
    loadingMessages,
    loadingEarlier,
    hasEarlier: earliestOffset > 0,
    sending,
    error,
    dismissError: () => setError(null),
    newChat,
    openSession,
    loadEarlier,
    send,
    retry,
  }
}
