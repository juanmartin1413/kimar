export type Rol = 'admin' | 'gestor' | 'vendedor'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  fechaCreacion: string
}

export interface Vendedor {
  id: string
  nombre: string
  usuarioId?: string
  activo: boolean
}

export interface Cliente {
  id: string
  nombre: string
  calle?: string
  altura?: string
  localidad?: string
  provincia?: string
  telefono1?: string
  telefono2?: string
  email?: string
  vendedorId?: string
  activo: boolean
  fechaCreacion: string
}

export type CategoriaProducto = 'calamares' | 'langostinos' | 'bivalvos' | 'pescados' | 'pulpos' | 'otros'

export type UnidadProducto = 'kg' | 'unidad'

export interface Producto {
  id: string
  nombre: string
  categoria: CategoriaProducto
  precioKg: number
  unidad: UnidadProducto
  activo: boolean
}

export interface ItemPedido {
  id: string
  productoId: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export type EstadoPedido = 'pendiente' | 'confirmado' | 'cancelado'

export interface Pedido {
  id: string
  clienteId: string
  vendedorId: string
  fecha: string
  estado: EstadoPedido
  items: ItemPedido[]
  observaciones?: string
  fechaCreacion: string
}

export interface ItemVenta {
  id: string
  productoId: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export type EstadoVenta = 'debe' | 'cobrado_parcial' | 'pagado'
export type FormaPago = 'efectivo' | 'transferencia' | 'cheque'
export type EstadoCobranza = 'pendiente' | 'cobrado' | 'vencido'

export interface Cobranza {
  id: string
  ventaId?: string
  clienteId: string
  fecha: string
  monto: number
  formaPago: FormaPago
  estado: EstadoCobranza
  observaciones?: string
  fechaCreacion: string
}

export interface Venta {
  id: string
  pedidoId?: string
  clienteId: string
  vendedorId: string
  fechaEntrega: string
  nroRemito?: string
  nroFactura?: string
  items: ItemVenta[]
  total: number
  estado: EstadoVenta
  cobranzas: Cobranza[]
  observaciones?: string
  fechaCreacion: string
}

export interface Proveedor {
  id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
  fechaCreacion: string
}

export interface CuotaProveedor {
  id: string
  fecha: string
  monto: number
  formaPago: FormaPago
  estado: 'pendiente' | 'pagado'
  fechaPago?: string
}

export interface CompromisoProveedor {
  id: string
  proveedorId: string
  concepto: string
  cuotas: CuotaProveedor[]
  observaciones?: string
  fechaCreacion: string
}

export type TipoMovimientoStock = 'entrada' | 'salida'
export type MotivoStock = 'compra' | 'venta' | 'ajuste' | 'merma'

export interface MovimientoStock {
  id: string
  productoId: string
  tipo: TipoMovimientoStock
  cantidad: number
  motivo: MotivoStock
  ventaId?: string
  fecha: string
  observaciones?: string
}

export type TipoGasto = 'mensual' | 'ocasional'

export interface GastoFijo {
  id: string
  nombre: string
  descripcion?: string
  monto: number
  tipo: TipoGasto
  diaPago?: number
  activo: boolean
  fechaCreacion: string
}

export interface InstanciaGasto {
  id: string
  gastoFijoId: string
  mes: number
  anio: number
  monto: number
  fechaVencimiento?: string
  pagado: boolean
  fechaPago?: string
  fechaCreacion: string
}

export interface AppData {
  usuarios: Usuario[]
  vendedores: Vendedor[]
  clientes: Cliente[]
  productos: Producto[]
  pedidos: Pedido[]
  ventas: Venta[]
  cobranzas: Cobranza[]
  proveedores: Proveedor[]
  compromisosProveedor: CompromisoProveedor[]
  movimientosStock: MovimientoStock[]
  gastosFijos: GastoFijo[]
  instanciasGasto: InstanciaGasto[]
}
