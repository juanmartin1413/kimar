import { brand } from '@/components/public/shared/content'

export default function Footer() {
  return (
    <footer className="bg-pub-deep text-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6 text-center text-sm space-y-1">
        <p className="font-semibold text-white">{brand.nombre} {brand.tagline}</p>
        <p className="text-pub-on-deep">{brand.descripcion}</p>
        <p className="text-pub-on-deep-muted">© {new Date().getFullYear()} {brand.nombre}. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
