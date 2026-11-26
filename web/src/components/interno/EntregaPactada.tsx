'use client'

export function horarioEntrega(desde?: string, hasta?: string) {
  return desde ? `${desde.slice(0, 5)}${hasta ? ` a ${hasta.slice(0, 5)}` : ''} hs` : 'Horario a coordinar'
}

export function EntregaPactada({ fecha, desde, hasta, onChange, disabled = false }: {
  fecha: string; desde: string; hasta: string; disabled?: boolean
  onChange: (fecha: string, desde: string, hasta: string) => void
}) {
  const modo = !desde ? 'coordinar' : hasta ? 'rango' : 'exacta'
  const field = 'w-full border rounded-lg px-3 py-2 text-sm disabled:opacity-60'
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="text-sm font-semibold">Entrega pactada</legend>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">Fecha *<input required type="date" className={field} value={fecha} onChange={e => onChange(e.target.value, desde, hasta)} /></label>
      <label className="text-sm">Horario<select className={field} value={modo} onChange={e => onChange(fecha, e.target.value === 'coordinar' ? '' : desde || '09:00', e.target.value === 'rango' ? '18:00' : '')}>
        <option value="coordinar">A coordinar</option><option value="exacta">Hora exacta</option><option value="rango">Rango horario</option>
      </select></label>
      {modo !== 'coordinar' && <label className="text-sm">{modo === 'rango' ? 'Desde' : 'Hora'}<input required type="time" className={field} value={desde.slice(0, 5)} onChange={e => onChange(fecha, e.target.value, hasta)} /></label>}
      {modo === 'rango' && <label className="text-sm">Hasta<input required type="time" className={field} value={hasta.slice(0, 5)} onChange={e => onChange(fecha, desde, e.target.value)} /></label>}
    </div>
    {hasta && hasta <= desde && <p role="alert" className="text-sm text-red-700">La hora final debe ser posterior al inicio, dentro del mismo día.</p>}
  </fieldset>
}
