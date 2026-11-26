'use client'

import { useRef, useState } from 'react'
import { FileText, Paperclip, Plus, Trash2 } from 'lucide-react'

export function ComprobantesPagoSelector({ files, onChange, disabled = false, buttonLabel = 'Seleccionar archivos' }: {
  files: File[]; onChange: (files: File[]) => void; disabled?: boolean; buttonLabel?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function agregar(selected: File[]) {
    const validos = selected.filter(file => file.size > 0 && file.size <= 8 * 1024 * 1024 &&
      ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    const rechazados = selected.filter(file => !validos.includes(file))
    setError(rechazados.length ? `No se agregaron: ${rechazados.map(f => f.name).join(', ')}. Elegí PDF, JPG, PNG o WebP, no vacíos y de hasta 8 MB cada uno.` : '')
    const nuevos = [...files]
    for (const file of validos) {
      if (!nuevos.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) nuevos.push(file)
    }
    onChange(nuevos)
  }

  return <section aria-label="Adjuntar comprobantes de pago" className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
    <div className="flex items-start gap-3">
      <span className="rounded-lg bg-blue-100 p-2 text-blue-800"><Paperclip className="h-5 w-5" aria-hidden="true" /></span>
      <div>
        <h3 className="font-semibold text-slate-900">Adjuntar comprobantes <span className="font-normal text-sm text-slate-500">(opcional)</span></h3>
        <p className="text-sm text-slate-600">Podés agregar varios archivos y quitar los que seleccionaste por error.</p>
      </div>
    </div>
    <div className="rounded-lg border-2 border-dashed border-blue-200 bg-white p-4 text-center space-y-2">
      <input ref={input} className="hidden" type="file" multiple disabled={disabled} accept="application/pdf,image/jpeg,image/png,image/webp"
        aria-label="Seleccionar comprobantes" onChange={e => { agregar(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      <button type="button" disabled={disabled} onClick={() => input.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        <Plus className="h-4 w-4" aria-hidden="true" />{files.length ? 'Agregar más archivos' : buttonLabel}
      </button>
      <p className="text-xs text-slate-500">PDF, JPG, PNG o WebP · Hasta 8 MB por archivo</p>
    </div>
    <p role="status" className="text-sm text-slate-600">{files.length ? `${files.length} archivo(s) pendiente(s) de adjuntar` : 'Todavía no seleccionaste archivos.'}</p>
    {files.length > 0 && <ul className="space-y-2">
      {files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <FileText className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
        <div className="min-w-0 flex-1"><p className="break-all text-sm font-medium text-slate-800">{file.name}</p>
          <p className="text-xs text-slate-500">{file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</p>
        </div>
        <button type="button" disabled={disabled} aria-label={`Quitar ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg p-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
          <Trash2 className="h-4 w-4" aria-hidden="true" />Quitar
        </button>
      </li>)}
    </ul>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>
}
