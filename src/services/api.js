const API_URL = (import.meta?.env?.VITE_API_URL || '/api').replace(/\/$/, '')

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const raw = await response.text()
  const data = raw ? (() => { try { return JSON.parse(raw) } catch { return raw } })() : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' ? data : null) ||
      `HTTP ${response.status}`
    throw new Error(message)
  }

  return data
}