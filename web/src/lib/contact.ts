// Datos de contacto de KIMAR, usados en el sitio público y en los documentos PDF generados.
// Fuente única de verdad: cambiar acá se propaga a todos los lugares que lo importen.
export const kimarContact = {
  telefonoAdmin: '+54 9 11 2572-7299',
  telefonoVentas: '+54 9 11 3012-3555',
  emailVentas: 'ventas@kimarcompany.com',
  emailAdmin: 'administracion@kimarcompany.com',
  horario: 'Lunes a Sábados, 7:00 – 20:00 hs',
  cobertura: 'Toda la Argentina',
} as const

/** Convierte un teléfono con formato humano en un link wa.me (solo dígitos, sin "+"). */
export function whatsappUrl(telefono: string, mensaje?: string): string {
  const digits = telefono.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base
}
