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

/**
 * Un solo ejercicio puede venir plano (`{ id, name, ... }`) o envuelto (`{ data: { id, ... } }`, `exercise`, JSON:API).
 */
export function unwrapExerciseResponse(body) {
  if (body == null || typeof body !== 'object') return null
  if (body.id != null) return body
  const d = body.data
  if (d != null && typeof d === 'object' && d.id != null) {
    if (d.attributes != null && typeof d.attributes === 'object') {
      return { id: d.id, ...d.attributes, categories: d.categories }
    }
    return d
  }
  const ex = body.exercise
  if (ex != null && typeof ex === 'object' && ex.id != null) return ex
  return null
}

/**
 * GET /workouts/:id (o /display) puede devolver el recurso plano o envuelto en `data` / `workout` (Laravel).
 * No confundir con el índice paginado `{ data: [], meta }`.
 */
export function unwrapWorkoutResponse(body) {
  if (body == null || typeof body !== 'object') return null
  const inner = body.data
  if (Array.isArray(inner) && body.meta != null) return null
  if (body.id != null) return body
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    if (inner.attributes != null && typeof inner.attributes === 'object') {
      return { id: inner.id, ...inner.attributes, blocks: inner.blocks }
    }
    if (inner.id != null || inner.name !== undefined || Array.isArray(inner.blocks)) return inner
  }
  const w = body.workout
  if (w != null && typeof w === 'object' && w.id != null) return w
  return null
}

/**
 * Multipart upload with progress (XMLHttpRequest). Do not set Content-Type; the browser sets the boundary.
 * @param {{ endpoint: string, method?: string, formData: FormData, onProgress?: (pct: number) => void }} opts
 */
export const apiUploadForm = ({ endpoint, method = 'POST', formData, onProgress }) => {
  const token = localStorage.getItem('token')
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    xhr.responseType = 'json'
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100))
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      let data = null
      if (xhr.responseType === 'json') {
        data = xhr.response
        if (data === null && xhr.status >= 200 && xhr.status < 300) {
          const raw = (xhr.responseText ?? '').replace(/^\uFEFF/, '').trim()
          if (raw) {
            try {
              data = JSON.parse(raw)
            } catch {
              reject(new Error('La respuesta del servidor no es JSON válido.'))
              return
            }
          }
        }
      } else {
        const raw = (xhr.responseText ?? '').replace(/^\uFEFF/, '').trim()
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            if (xhr.status >= 200 && xhr.status < 300) {
              reject(new Error('La respuesta del servidor no es JSON válido.'))
              return
            }
            data = raw
          }
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
        return
      }

      const message =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${xhr.status}`
      reject(new Error(message))
    }

    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'))
    xhr.send(formData)
  })
}