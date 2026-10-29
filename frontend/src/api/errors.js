// FastAPI errors come in three shapes:
//   { detail: "message" }                 HTTPException
//   { detail: [{ loc, msg }, ...] }       Pydantic validation (422)
//   { error: "Rate limit exceeded: ..." } slowapi (429)
export function getErrorMessage(error, overrides = {}) {
  const status = error?.response?.status
  if (status && overrides[status]) return overrides[status]

  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Cannot reach the server. Check your connection and that the API is running.'
  }

  const data = error.response.data
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (typeof data?.detail === 'string') return data.detail
  if (Array.isArray(data?.detail) && data.detail.length) {
    return data.detail.map((d) => d.msg.replace(/^Value error, /, '')).join('. ')
  }
  if (typeof data?.error === 'string') return data.error
  if (status >= 500) return 'Something went wrong on the server. Please try again.'
  return 'Something went wrong. Please try again.'
}
