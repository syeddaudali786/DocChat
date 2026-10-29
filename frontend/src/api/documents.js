import client from './client'

// Returns a page: { items, total, limit, offset }
export const listDocuments = ({ limit = 20, offset = 0 } = {}) =>
  client.get('/documents', { params: { limit, offset } }).then((r) => r.data)

export function uploadDocument(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  return client
    .post('/documents', form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
    .then((r) => r.data)
}

export const deleteDocument = (id) => client.delete(`/documents/${id}`)
