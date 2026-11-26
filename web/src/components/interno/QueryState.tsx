'use client'

import { ReactNode, useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function QueryState({ loading, error, retry, children }: { loading?: boolean; error?: string; retry?: () => void; children?: ReactNode }) {
  if (error) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error} {retry && <button type="button" onClick={retry} className="font-semibold underline">Reintentar</button>}</div>
  if (loading) return <p role="status" aria-live="polite" className="p-4 text-sm text-slate-600">Cargando…</p>
  return <>{children}</>
}

/** A result belongs to its URL. New filters never display an old result as current. */
export function useApiQuery<T>(url: string | null, version = 0) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ url: string | null; data?: T; loading: boolean; error?: string }>({ url: null, loading: true })
  useEffect(() => {
    if (!url) return
    const abort = new AbortController()
    setState(previous => ({ url, data: previous.url === url ? previous.data : undefined, loading: true }))
    api.get<T>(url, abort.signal).then(data => {
      if (!abort.signal.aborted) setState({ url, data, loading: false })
    }).catch(e => {
      if (!abort.signal.aborted) setState(previous => ({ ...previous, loading: false, error: e.message || 'No se pudo cargar la información.' }))
    })
    return () => abort.abort()
  }, [url, revision, version])
  return { data: state.url === url ? state.data : undefined, loading: !!url && (state.url !== url || state.loading),
    error: state.url === url ? state.error : undefined, retry: () => setRevision(r => r + 1) }
}
