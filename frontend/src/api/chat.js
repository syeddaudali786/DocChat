import client from './client'

// Omit sessionId to start a new session, documentId to search all documents.
export const askQuestion = ({ question, sessionId, documentId }) =>
  client
    .post('/chat', {
      question,
      session_id: sessionId ?? undefined,
      document_id: documentId ?? undefined,
    })
    .then((r) => r.data)

export const listSessions = ({ limit = 20, offset = 0 } = {}) =>
  client.get('/sessions', { params: { limit, offset } }).then((r) => r.data)

export const listMessages = (sessionId, { limit = 100, offset = 0 } = {}) =>
  client.get(`/sessions/${sessionId}/messages`, { params: { limit, offset } }).then((r) => r.data)

export const deleteSession = (id) => client.delete(`/sessions/${id}`)
