# Modelo de Datos

> Fase 1: implementado en TypeScript como interfaces + localStorage.
> Fase 2: se mapea a entidades de Entity Framework Core con PostgreSQL.

## Entidades Principales

### Usuario
```typescript
interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'gestor' | 'vendedor'
  activo: boolean
  fechaCreacion: string // ISO 8601
}
```

### Vendedor
```typescript
interface Vendedor {
  id: string
  nombre: string
  usuarioId?: string  // usuario del sistema asociado
  activo: boolean
}
```

### Cliente
```typescript
interface Cliente {
  id: string
  nombre: string              // obligatorio
  calle?: string
  altura?: string
  localidad?: string
  provincia?: string
  telefono1?: string          // formato: código área + número (Argentina)
  telefono2?: string
  email?: string
  vendedorId?: string         // vendedor asignado
  activo: boolean
  fechaCreacion: string
}
```

### Producto
```typescript
interface Producto {
  id: string
  nombre: string
  categoria: 'calamares' | 'langostinos' | 'bivalvos' | 'pescados' | 'pulpos' | 'otros'
  precioKg: number            // precio en ARS por kg
  unidad: 'kg'               // unidad de medida (por ahora siempre kg)
  activo: boolean
}
```

### Pedido
```typescript
interface Pedido {
  id: string
  clienteId: string
  vendedorId: string
  fecha: string               // ISO 8601
  estado: 'pendiente' | 'confirmado' | 'cancelado'
  items: ItemPedido[]
  observaciones?: string
  fechaCreacion: string
}

interface ItemPedido {
  id: string
  productoId: string
  cantidad: number            // en kg
  precioUnitario: number      // precio acordado (puede diferir del precio de lista)
  subtotal: number            // cantidad * precioUnitario
}
```

### Venta
```typescript
interface Venta {
  id: string
  pedidoId?: string           // pedido de origen (opcional, puede cargarse directo)
  clienteId: string
  vendedorId: string
  fechaEntrega: string        // ISO 8601
  nroRemito?: string
  nroFactura?: string
  items: ItemVenta[]
  total: number
  estado: 'debe' | 'cobrado_parcial' | 'pagado'
  cobranzas: Cobranza[]
  observaciones?: string
  fechaCreacion: string
}

interface ItemVenta {
  id: string
  productoId: string
  descripcion: string         // nombre del producto al momento de la venta
  cantidad: number            // en kg
  precioUnitario: number
  subtotal: number
}
```

### Cobranza
```typescript
interface Cobranza {
  id: string
  ventaId?: string            // venta asociada (opcional)
  clienteId: string
  fecha: string               // fecha en que se cobró o se espera cobrar
  monto: number               // en ARS
  formaPago: 'efectivo' | 'transferencia' | 'cheque'
  estado: 'pendiente' | 'cobrado' | 'vencido'
  observaciones?: string
  fechaCreacion: string
}
```

### Proveedor
```typescript
interface Proveedor {
  id: string
  nombre: string
  cuit?: string
  telefono?: string
  email?: string
  contacto?: string           // nombre de la persona de contacto
  activo: boolean
}
```

### DeudaProveedor
```typescript
interface DeudaProveedor {
  id: string
  proveedorId: string
  concepto: string
  monto: number
  fechaVencimiento: string
  estado: 'debe' | 'pagado'
  observaciones?: string
}
```

### MovimientoStock
```typescript
interface MovimientoStock {
  id: string
  productoId: string
  tipo: 'entrada' | 'salida'
  cantidad: number            // en kg
  motivo: 'compra' | 'venta' | 'ajuste' | 'merma'
  ventaId?: string            // si es salida por venta
  fecha: string
  observaciones?: string
}
```

### GastoFijo
```typescript
interface GastoFijo {
  id: string
  descripcion: string
  categoria: 'alquiler' | 'servicios' | 'sueldos' | 'transporte' | 'otros'
  monto: number
  mes: number                 // 1-12
  anio: number
  pagado: boolean
  fechaPago?: string
}
```

## Relaciones

```
Vendedor ─── atiende ──► Cliente (1:N)
Cliente ──── tiene ────► Venta (1:N)
Venta ───── tiene ────► ItemVenta (1:N)
Venta ───── tiene ────► Cobranza (1:N)
Pedido ──── origina ──► Venta (1:1 opcional)
Pedido ──── tiene ────► ItemPedido (1:N)
Producto ── aparece en ► ItemPedido / ItemVenta
Proveedor ─ tiene ────► DeudaProveedor (1:N)
Producto ── tiene ────► MovimientoStock (1:N)
```

## Persistencia en Prototipo (localStorage)

Cada colección se guarda bajo una clave distinta:
```
kimar_usuarios
kimar_vendedores
kimar_clientes
kimar_productos
kimar_pedidos
kimar_ventas
kimar_cobranzas
kimar_proveedores
kimar_deudas_proveedor
kimar_stock_movimientos
kimar_gastos_fijos
```
