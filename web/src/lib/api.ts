const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kimar_token') : null
  const hasBody = body !== undefined

  const res = await fetch(`${BASE}${path}`, {
    method,
    signal,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kimar_token')
      localStorage.removeItem('kimar_user')
      window.location.href = '/acceso'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text
    try { message = JSON.parse(text).error || text } catch { /* respuesta sin JSON */ }
    throw new Error(message || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export const api = {
  download: async (path: string, filename: string) => {
    const token = localStorage.getItem('kimar_token')
    const res = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + token } })
    if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.error || 'No se pudo descargar el documento') }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  get:    <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
}
