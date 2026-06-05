# Especificación de Módulos del Sistema Interno

## Visibilidad por Rol

| Módulo | Admin | Gestor | Vendedor |
|--------|-------|--------|----------|
| Dashboard | ✅ (completo) | ❌ | ❌ |
| Clientes | ✅ | ✅ | ✅ (solo lectura) |
| Cuenta Corriente | ✅ | ✅ | ❌ |
| Pedidos | ✅ | ✅ | ✅ (solo los suyos) |
| Ventas | ✅ | ✅ | ❌ |
| Cobranzas | ✅ | ✅ | ❌ |
| Productos & Precios | ✅ | ✅ | ✅ (solo lectura) |
| Stock | ✅ | ✅ | ❌ |
| Proveedores | ✅ | ✅ | ❌ |
| Gastos Fijos | ✅ | ✅ | ❌ |
| Vendedores | ✅ | ✅ | ❌ |
| Reportes | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

## Módulo 1: Dashboard
**Acceso**: Solo Admin

Secciones:
- **KPIs principales**: Deuda total por cobrar, Cobros del día, Cobranzas vencidas
- **Resumen por vendedor**: Total adeudado por cada cartera (Marcos / Lucho / Lucas)
- **Alertas**: Ventas vencidas sin cobrar, Stock bajo (futuro)
- **Últimas ventas registradas**

## Módulo 2: Clientes
**Acceso**: Admin (completo), Gestor (completo), Vendedor (solo lectura)

Funcionalidades:
- Listado con búsqueda por nombre
- Filtro por vendedor asignado
- Alta de nuevo cliente (nombre, dirección, teléfonos, email, vendedor)
- Edición y baja lógica (activo/inactivo)
- Ficha de cliente: datos + historial de ventas/deuda

Campos de dirección (Argentina):
- Calle, Altura, Localidad, Provincia (default: Buenos Aires)

Teléfonos:
- Almacenados como texto libre para flexibilidad
- Placeholder sugiere formato: 011 15-XXXX-XXXX

## Módulo 3: Cuenta Corriente
**Acceso**: Admin, Gestor

Vistas:
1. **Vista consolidada**: Todos los clientes con su saldo, agrupados por vendedor
   - Color rojo: DEBE (saldo pendiente)
   - Color verde: al día (sin deuda)
   - Color naranja: PAGADO PERO NO ENTREGADO FÍSICAMENTE
   - Total por vendedor y total general
2. **Vista por cliente**: Detalle de todas las ventas de un cliente
   - Columnas: Fecha, Pedido/Productos, N° Remito, N° Factura, Total, Vence, Estado, Observaciones

## Módulo 4: Pedidos
**Acceso**: Admin, Gestor, Vendedor

Flujo:
1. Seleccionar cliente
2. Agregar ítems: producto, cantidad (kg), precio (pre-completado desde lista, editable)
3. Agregar observaciones
4. Guardar como Pedido (estado: "pendiente")

Admin/Gestor pueden convertir un Pedido en Venta.

## Módulo 5: Ventas
**Acceso**: Admin, Gestor

Acciones:
- Ver listado de ventas (con filtros: cliente, vendedor, estado, fecha)
- Convertir Pedido en Venta (ajustar precios/cantidades, ingresar N° Remito y Factura)
- Registrar plan de cobro al crear la Venta (1 o más Cobranzas)
- Ver detalle de venta con estado de cobranzas

## Módulo 6: Cobranzas
**Acceso**: Admin, Gestor

Funcionalidades:
- Agenda: vista de cobranzas pendientes ordenadas por fecha de vencimiento
- Registrar cobro efectivo: fecha real, monto, forma de pago
- Asociar opcionalmente a una Venta
- Al cobrar: actualiza estado de la Venta (DEBE → COBRADO PARCIAL → PAGADO)
- Filtros: por fecha, por vendedor, por estado, por cliente

## Módulo 7: Productos & Precios
**Acceso**: Admin (completo), Gestor (completo), Vendedor (solo lectura)

Funcionalidades:
- Listado de productos con precio actual
- Edición rápida de precio (celda editable inline)
- Alta de nuevo producto con categoría
- Baja lógica (activo/inactivo)
- Categorías: Calamares, Langostinos, Bivalvos, Pescados, Pulpos, Otros

## Módulo 8: Stock
**Acceso**: Admin, Gestor

Funcionalidades:
- Inventario actual: producto, stock en kg, precio de lista
- Registrar entrada (compra a proveedor): producto, cantidad, proveedor, fecha
- Registrar salida manual (ajuste, merma)
- Las ventas confirmaras descuentan stock automáticamente (futuro)
- Alerta visual cuando stock < umbral configurable

## Módulo 9: Proveedores
**Acceso**: Admin, Gestor

Funcionalidades:
- ABM de proveedores (nombre, CUIT, teléfono, email, contacto)
- Registro de deudas a proveedores (concepto, monto, vencimiento)
- Estado de cada deuda: DEBE / PAGADO
- Total adeudado a proveedores

## Módulo 10: Gastos Fijos
**Acceso**: Admin, Gestor

Funcionalidades:
- Registro mensual de gastos fijos por categoría
- Categorías: Alquiler, Servicios, Sueldos, Transporte, Otros
- Marcar como pagado/pendiente
- Resumen mensual: total de gastos del mes

## Módulo 11: Vendedores
**Acceso**: Admin, Gestor

Funcionalidades:
- ABM de vendedores
- Asignación de clientes a cada vendedor
- Vista de cartera: clientes asignados + deuda total de la cartera

## Módulo 12: Reportes
**Acceso**: Solo Admin

Reportes disponibles:
- Deuda total por cobrar (agrupada por vendedor)
- Clientes con deuda vencida (más de X días)
- Cobranzas del período (día / semana / mes)
- Ventas del período
- Total de gastos del mes

## Módulo 13: Configuración
**Acceso**: Solo Admin

Funcionalidades:
- Listado de usuarios del sistema
- Crear nuevo usuario (nombre, email, rol, contraseña)
- Cambiar contraseña de cualquier usuario
- Activar/desactivar usuarios
