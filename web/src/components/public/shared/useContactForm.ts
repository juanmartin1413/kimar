'use client'

import { useState } from 'react'

export type ContactFormData = { nombre: string; email: string; telefono: string; mensaje: string }

const vacio: ContactFormData = { nombre: '', email: '', telefono: '', mensaje: '' }

export const contactFields = [
  { name: 'nombre', label: 'Nombre completo *', type: 'text', required: true, placeholder: 'Tu nombre' },
  { name: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'tu@email.com' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', required: false, placeholder: '011 15-XXXX-XXXX' },
] as const satisfies readonly { name: keyof ContactFormData; label: string; type: string; required: boolean; placeholder: string }[]

/** Estado del formulario de contacto. Hoy no envía a ningún backend: sólo marca "enviado". */
export function useContactForm() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState<ContactFormData>(vacio)

  function update(name: keyof ContactFormData, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  function reset() {
    setSent(false)
    setForm(vacio)
  }

  return { form, sent, update, handleSubmit, reset }
}
