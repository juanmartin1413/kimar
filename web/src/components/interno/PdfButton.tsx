import { ComponentProps } from 'react'
import { FileText } from 'lucide-react'

export function PdfButton({ children = 'Descargar PDF', className = '', ...props }: ComponentProps<'button'>) {
  return <button type="button" {...props} className={'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ' + className}><FileText aria-hidden="true" className="h-4 w-4 shrink-0" />{children}</button>
}
