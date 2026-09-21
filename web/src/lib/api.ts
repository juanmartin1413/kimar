const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kimar_token') : null
  const hasBody = body !== undefined

  const res = await fetch(`${BASE}${path}`, {
    method,
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
    throw new Error(text || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export const api = {
  get:    <T>(path: string)                 => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
}
