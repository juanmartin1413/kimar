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
  cuit?: string
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
  calidadId?: string // variante interna de stock (nunca se muestra al cliente)
  calidadNombre?: string
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

// Métodos de pago pactados con proveedores. Distinto de FormaPago (cobranzas a clientes):
// "echeq" es un instrumento propio de pagos a proveedores, no aplica del lado cliente.
export type MetodoPagoProveedor = 'transferencia' | 'echeq' | 'efectivo'

export interface CuotaProveedor {
  id: string
  fecha: string
  monto: number
  formaPago: MetodoPagoProveedor
  estado: 'pendiente' | 'pagado'
  fechaPago?: string
  montoPagado?: number // monto efectivamente pagado, puede diferir del pactado (monto)
  formaPagoReal?: MetodoPagoProveedor
}

export interface CompromisoProveedor {
  id: string
  proveedorId: string
  compraId?: string // presente si se generó automáticamente al registrar una Compra
  concepto: string
  cuotas: CuotaProveedor[]
  observaciones?: string
  fechaCreacion: string
}

// Un tramo de la forma de pago negociada: qué % del total, a cuántos días de la recepción, y con qué método
export interface TramoPago {
  id: string
  orden: number
  porcentaje: number
  diasPlazo: number
  metodoPago: MetodoPagoProveedor
}

// Condición de pago negociada con un proveedor. Historizable: fechaHasta null = vigente.
// Cambiar la condición crea una versión nueva y cierra la anterior, nunca se edita in-place.
export interface FormaPagoProveedor {
  id: string
  proveedorId: string
  fechaDesde: string
  fechaHasta?: string
  observaciones?: string
  fechaCreacion: string
  tramos: TramoPago[]
}

export interface ItemCompra {
  id: string
  productoId: string
  productoNombre: string
  calidadId?: string
  calidadNombre?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

// Ingreso formal de mercadería de un proveedor: impacta stock y genera el compromiso de pago
// automáticamente según la forma de pago vigente al momento de la compra.
export interface Compra {
  id: string
  proveedorId: string
  proveedorNombre: string
  usuarioId: string
  usuarioNombre: string
  formaPagoProveedorId: string
  fechaRecepcion: string
  nroRemito: string
  nroFactura?: string
  total: number
  estado: 'registrada' | 'anulada'
  observaciones?: string
  fechaCreacion: string
  items: ItemCompra[]
  compromiso?: CompromisoProveedor
}

export interface TramoPagoPayload {
  orden: number
  porcentaje: number
  diasPlazo: number
  metodoPago: MetodoPagoProveedor
}

export interface CreateFormaPagoPayload {
  fechaDesde: string
  observaciones?: string
  tramos: TramoPagoPayload[]
}

export interface ItemCompraPayload {
  productoId: string
  calidadId?: string
  cantidad: number
  precioUnitario: number
}

export interface CreateCompraPayload {
  proveedorId: string
  fechaRecepcion: string
  nroRemito: string
  nroFactura?: string
  observaciones?: string
  items: ItemCompraPayload[]
}

// Documento/foto genérico (remito, factura, u otro comprobante a futuro) asociado a una entidad
// por (entidadTipo, entidadId). El contenido vive en disco del lado del servidor.
export interface Adjunto {
  id: string
  entidadTipo: string
  entidadId: string
  tipo: 'remito' | 'factura' | 'otro'
  nombre: string
  contentType: string
  usuarioId: string
  fechaCreacion: string
}

// Stock management types
export interface ProductoProveedor {
  id: string
  productoId: string
  proveedorId: string
  codigo?: string // SKU del proveedor
  precioCompra: number
  activo: boolean
}

// Variante interna de calidad de un producto (ej. "Glaseado 20%"), usada solo para saber
// de qué lote de stock se descuenta. El cliente final nunca la ve.
export interface Calidad {
  id: string
  productoId: string
  nombre: string
  activo: boolean
}

export interface StockPorProducto {
  id: string
  productoId: string
  calidadId?: string
  calidadNombre?: string
  cantidad: number // en kg
  stockMinimo: number // en kg, para alertas
  fechaActualizacion: string
}

export interface StockRealRegistrado {
  id: string
  productoId: string
  calidadId?: string
  cantidad: number // cantidad física registrada
  fecha: string
  usuarioId: string // quién hizo el conteo
  observaciones?: string
}

export type TipoMovimientoStock = 'entrada' | 'salida'
export type MotivoStock = 'compra' | 'venta' | 'ajuste' | 'merma' | 'devolución'

export interface MovimientoStock {
  id: string
  productoId: string
  calidadId?: string
  calidadNombre?: string
  tipo: TipoMovimientoStock
  cantidad: number
  motivo: MotivoStock
  usuarioId: string // quién registró el movimiento (auditoría)
  ventaId?: string // para salidas por venta
  proveedorId?: string // para entradas de compra
  compraId?: string // presente si vino de una Compra formal (con remito/factura)
  fecha: string
  observaciones?: string
  fechaCreacion: string
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
  formasPagoProveedor: FormaPagoProveedor[] // historial completo de todos los proveedores
  compras: Compra[]
  productosProveedores: ProductoProveedor[] // relación 1:N producto -> proveedor
  calidades: Calidad[] // variantes internas de stock por producto
  movimientosStock: MovimientoStock[] // historial completo con auditoría
  stockPorProducto: StockPorProducto[] // stock actual + mínimo por producto
  stockRealRegistrado: StockRealRegistrado[] // registros de auditoría física
  gastosFijos: GastoFijo[]
  instanciasGasto: InstanciaGasto[]
}
