// Contenido compartido por los tres estilos del sitio público.
// Sólo afirmaciones respaldadas por el negocio (copy existente, datos del seed,
// flyer de precios). Nada inventado: sin testimonios ni cifras no verificables.
import type { CategoriaProducto } from '@/lib/types'

export const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/contacto', label: 'Contacto' },
] as const

export const brand = {
  nombre: 'KIMAR',
  tagline: 'Mariscos Premium',
  slogan: 'Excelencia en cada proceso',
  descripcion: 'Más de 15 años al servicio de los mejores restaurantes y pescaderías de Argentina.',
} as const

export const hero = {
  eyebrow: 'Más de 15 años de trayectoria',
  title: 'Mariscos Premium',
  titleAccent: 'a tu mesa',
  lead:
    'Distribuidora especializada en mariscos y productos del mar de primera calidad. Proveemos a los mejores restaurantes, cadenas de sushi y pescaderías de Argentina.',
  ctaPrimary: 'Ver Productos',
  ctaSecondary: 'Contactanos',
} as const

export const features = [
  {
    key: 'experiencia',
    title: '+15 años de experiencia',
    desc: 'Una trayectoria sólida construida sobre confianza y calidad.',
  },
  {
    key: 'premium',
    title: 'Productos premium',
    desc: 'Seleccionamos los mejores productos del mar nacional e importado.',
  },
  {
    key: 'distribucion',
    title: 'Distribución puntual',
    desc: 'Entregas directas con cadena de frío garantizada.',
  },
  {
    key: 'atencion',
    title: 'Atención personalizada',
    desc: 'Un vendedor dedicado que conoce tu negocio y tus necesidades.',
  },
] as const

/** "Cómo trabajamos": del pedido a la entrega. */
export const proceso = [
  {
    n: '01',
    title: 'Consultá',
    desc: 'Escribinos por WhatsApp o hablá con tu vendedor dedicado. Conoce tu carta, tus volúmenes y tus tiempos.',
  },
  {
    n: '02',
    title: 'Seleccionamos',
    desc: 'Elegimos producto premium del mar nacional e importado, de marcas como Lanzal, Iberconsa y Sta. Helena.',
  },
  {
    n: '03',
    title: 'Conservamos',
    desc: 'Cadena de frío controlada en cada etapa, desde el depósito hasta la puerta de tu local.',
  },
  {
    n: '04',
    title: 'Entregamos',
    desc: 'Logística propia y entregas directas y puntuales en toda la Argentina.',
  },
] as const

/** "A quién abastecemos". Derivado de la cartera real de clientes; confirmar redacción con el dueño. */
export const segmentos = [
  {
    key: 'restaurantes',
    title: 'Restaurantes',
    desc: 'Cocinas que necesitan calidad constante y reposición confiable, todas las semanas.',
  },
  {
    key: 'sushi',
    title: 'Cadenas de sushi',
    desc: 'Salmón, langostinos y kanikama con el estándar que exige la barra.',
  },
  {
    key: 'pescaderias',
    title: 'Pescaderías',
    desc: 'Surtido amplio para mostrador, con precios por kilo claros y entrega puntual.',
  },
] as const

export const stats = [
  { key: 'anios', value: 15, prefix: '+', label: 'años de trayectoria' },
  { key: 'productos', value: 30, prefix: '+', label: 'productos en lista' },
  { key: 'cobertura', text: 'Nacional', label: 'entregas en toda la Argentina' },
] as const

export const marcas = ['Lanzal', 'Iberconsa', 'Sta. Helena'] as const

export const seleccionDestacada = [
  'Langostinos',
  'Calamares',
  'Pulpo Español',
  'Salmón',
  'Vieiras',
  'Mejillones',
  'Centolla',
  'Merluza Negra',
] as const

/** Compromisos que ya figuran en el flyer de precios. */
export const compromisos = [
  { key: 'calidad', title: 'Calidad premium', desc: 'Producto seleccionado, nacional e importado.' },
  { key: 'frio', title: 'Cadena de frío controlada', desc: 'Temperatura cuidada en cada proceso.' },
  { key: 'procesos', title: 'Procesos certificados', desc: 'Manipulación y almacenamiento bajo norma.' },
  { key: 'logistica', title: 'Logística propia', desc: 'Entregas directas, sin intermediarios.' },
] as const

export const faq = [
  {
    q: '¿Cómo hago un pedido o consulto precios?',
    a: 'Escribinos por WhatsApp a Ventas o consultá con tu vendedor. También podés descargar la lista de precios actualizada desde la sección Productos.',
  },
  {
    q: '¿Los precios incluyen IVA?',
    a: 'No. Los precios están expresados en pesos argentinos, IVA no incluido, y están sujetos a cambios sin previo aviso.',
  },
  {
    q: '¿Hay cantidades mínimas?',
    a: 'Sí, varían según el producto. Consultá disponibilidad y mínimos con tu vendedor.',
  },
  {
    q: '¿A qué zonas entregan?',
    a: 'Distribuimos en toda la Argentina, con cadena de frío garantizada en cada entrega.',
  },
  {
    q: '¿Cuál es el horario de atención?',
    a: 'Lunes a sábados de 7:00 a 20:00 hs.',
  },
  {
    q: '¿Con qué marcas trabajan?',
    a: 'Trabajamos con las mejores marcas del mercado: Lanzal, Iberconsa, Sta. Helena y más.',
  },
] as const

export const categoriaLabels: Record<CategoriaProducto, string> = {
  calamares: 'Calamares',
  langostinos: 'Langostinos',
  bivalvos: 'Bivalvos',
  pescados: 'Pescados',
  pulpos: 'Pulpos',
  otros: 'Otros',
}

export const categoriaOrden: CategoriaProducto[] = ['calamares', 'langostinos', 'bivalvos', 'pescados', 'pulpos', 'otros']

export const precios = {
  titulo: 'Lista de Precios',
  intro: 'Precios por kg, sujetos a cambios sin previo aviso. Consultá disponibilidad con tu vendedor.',
  nota: '* Precios en Pesos Argentinos (ARS). /kg = por kilogramo · /u = por unidad. IVA no incluido. Cantidades mínimas según producto.',
  descargar: 'Descargar Lista',
} as const

export const contacto = {
  titulo: 'Contacto',
  intro: 'Estamos disponibles para atender tu consulta o pedido.',
  formTitulo: 'Envianos un mensaje',
  enviado: '¡Mensaje enviado!',
  enviadoDesc: 'Nos pondremos en contacto a la brevedad.',
  otro: 'Enviar otro mensaje',
  placeholderMensaje: '¿En qué podemos ayudarte?',
} as const
