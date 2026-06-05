# Arquitectura del Sistema

## Monorepo Structure

```
kimar/
├── context/        # Documentación de arquitectura y negocio (este directorio)
├── web/            # Frontend Next.js 14
├── backend/        # .NET Core 8 + PostgreSQL (Fase 2)
└── mobile/         # React Native + Expo (Fase 3)
```

## Stack Tecnológico

### Frontend Web (Fase 1 - Activo)
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Persistencia Prototipo**: localStorage + React Context API
- **Paleta de colores**: Azul/Blanco (#0F3460, #1E6091, #2196F3 sobre blanco)

### Backend (Fase 2 - Pendiente)
- **Framework**: .NET Core 8
- **ORM**: Entity Framework Core
- **Base de datos**: PostgreSQL
- **API**: REST

### Mobile (Fase 3 - Futuro)
- **Framework**: React Native + Expo
- **Objetivo**: Vista de cobranzas para vendedores en campo

## Rutas de la Aplicación Web

### Sitio Público
```
/                   → Landing page
/productos          → Carta de productos y precios
/contacto           → Formulario de contacto + datos
/acceso             → Login (acceso interno)
```

### Sistema Interno (requiere autenticación)
```
/interno/dashboard              → Panel de control con KPIs
/interno/clientes               → Listado de clientes
/interno/clientes/[id]          → Ficha de cliente + cuenta corriente
/interno/cuenta-corriente       → Vista consolidada por vendedor
/interno/pedidos                → Gestión de pedidos
/interno/ventas                 → Gestión de ventas
/interno/cobranzas              → Agenda y registro de cobranzas
/interno/productos              → Catálogo y precios
/interno/stock                  → Inventario
/interno/proveedores            → Gestión de proveedores
/interno/gastos                 → Gastos fijos mensuales
/interno/vendedores             → ABM de vendedores
/interno/reportes               → Reportes (solo Admin)
/interno/configuracion          → Gestión de usuarios (solo Admin)
```

## Decisiones Técnicas

### Prototipo sin backend
La Fase 1 es un prototipo puro de frontend con datos persistidos en localStorage. Esto permite validar la experiencia de usuario con el cliente antes de invertir en infraestructura backend.

### shadcn/ui
Elegido por su flexibilidad (componentes copiables, no como librería de dependencia), consistencia visual y compatibilidad con Tailwind CSS.

### App Router de Next.js
Permite layouts anidados que facilitan separar el sitio público del sistema interno, con autenticación a nivel de layout.

### localStorage como persistencia
Suficiente para el prototipo. En Fase 2 se reemplaza por llamadas a la API REST de .NET Core. El Context API de React actúa como capa de abstracción que facilita este reemplazo.
