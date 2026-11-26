export function DocumentosVenta({ nroRemito, nroFactura }: { nroRemito?: string | null; nroFactura?: string | null }) {
  return <div className="space-y-0.5">
    <p>Remito {nroRemito || '—'}</p>
    {nroFactura && <p>Factura {nroFactura}</p>}
  </div>
}
