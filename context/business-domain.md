# Dominio de Negocio

## Glosario

| Término | Definición |
|---------|-----------|
| **Pedido** | Acuerdo entre un vendedor y un cliente sobre productos, cantidades y precios. Aún no se ha entregado ni facturado. |
| **Venta** | Pedido confirmado y entregado. Tiene N° de Remito y N° de Factura asociados. Genera deuda en la Cuenta Corriente. |
| **Remito** | Documento que acompaña la entrega física de mercadería. Se genera en papel o via AFIP. En Fase 1 solo se registra el número. |
| **Factura** | Documento fiscal de la venta. Se genera via AFIP. En Fase 1 solo se registra el número. |
| **Cuenta Corriente** | Registro histórico de todas las ventas de un cliente y su estado de pago. |
| **Cobranza** | Registro de un pago recibido o pendiente. Asociada (opcionalmente) a una Venta. |
| **Vendedor** | Integrante del equipo de ventas de KIMAR que gestiona una cartera de clientes. |
| **Gestor** | Usuario con acceso operativo completo pero sin vista de estadísticas/reportes. |
| **Admin** | Usuario con acceso total al sistema, incluyendo reportes y configuración. |
| **IQF** | Individually Quick Frozen. Método de congelado individual de cada pieza de producto. |
| **DEBE** | Estado de una Venta donde el cliente aún no ha pagado el total. |
| **PAGADO PARCIAL** | Estado donde el cliente pagó parte de la deuda (una o más cobranzas acreditadas). |
| **PAGADO** | Estado donde todas las cobranzas de una venta han sido acreditadas. |
| **Cola Cajita** | Denominación interna para Cola de Langostino en caja individual (presentación). |

## Roles de Usuario

### Admin
- Acceso completo a todos los módulos
- Único rol que puede ver Reportes y Estadísticas
- Gestiona usuarios del sistema (crear, modificar, desactivar)
- Valida y convierte Pedidos en Ventas
- Puede ajustar precios y cantidades al confirmar una Venta

### Gestor
- Acceso completo a módulos operativos (Clientes, Cuenta Corriente, Pedidos, Ventas, Cobranzas, Productos, Stock, Proveedores, Gastos, Vendedores)
- NO puede ver Reportes ni Estadísticas
- NO puede gestionar usuarios
- Puede validar y convertir Pedidos en Ventas

### Vendedor
- Solo puede registrar Pedidos
- No ve módulos de gestión ni estadísticas
- Ve el estado de sus propios pedidos

## Flujos Principales

### Flujo de Venta
1. Vendedor registra un **Pedido**: selecciona cliente, agrega productos con cantidades y precios (default de lista, ajustable)
2. Admin o Gestor revisa el Pedido y lo convierte en **Venta**:
   - Puede ajustar precio y/o cantidad de cualquier ítem
   - Registra N° de Remito (generado externamente)
   - Registra N° de Factura (generado via AFIP externamente)
   - Define el **Plan de Cobro** (una o más Cobranzas):
     - Forma de pago: Efectivo / Transferencia / Cheque
     - Monto (parcial o total)
     - Fecha de cobro esperada
3. La Venta queda registrada en la **Cuenta Corriente** del cliente con estado `DEBE`
4. Cuando se acredita una Cobranza, el estado de la Venta se actualiza:
   - Todas pagadas → `PAGADO`
   - Solo algunas → `COBRADO PARCIAL`

### Flujo de Cobranza
1. Vendedor o Gestor registra el cobro efectivo
2. Indica: fecha, monto cobrado, forma de pago (efectivo/transferencia/cheque)
3. Asocia opcionalmente a una Venta existente
4. El estado de la Venta se actualiza automáticamente

## Vendedores Actuales
- **Marcos**: Atiende cartera 1 (Augusta, Daimus, La Segunda, Haro Sushi, El Viejo Cañón, Longobucco, Hormiga Negra x3, Sushi Kyu, Lili Resto, Pescería, Ercopez, Chirola Teresa, Gabriel Teresa, Kity)
- **Lucho**: Atiende cartera 2 (Sushi Club x3, Satoshi x2, Fabirc Castelar, Fabirc Leloir, Fabric Federico X9, Fabric Peñaloza, El Pibe Dorrego, Polo House, Cochinchina, Polo Catering, Fabric Polo, Olivos Gourmet, Cachito de Mar, The Fish Company, y más)
- **Lucas**: Atiende cartera 3 (Toscana, Moby Dick, Yunta, Sta. Bárbara x2, Barbacoa, Moncada, El Imparcial, El Globo, Claudio Ramos Mejía, Florencia China, Jacinto, Aurelia Río, Super Chino Wu, distribuidoras y pescaderías)

## Contexto Argentina
- Moneda: Pesos Argentinos (ARS). Los precios se expresan sin decimales (ej: $12.500)
- Los teléfonos son argentinos. Formato: código de área + número. Celulares: 011 15-XXXX-XXXX o +54 9 11 XXXX-XXXX
- Inflación alta: los precios de los productos se actualizan frecuentemente
- AFIP: organismo fiscal argentino que regula la facturación electrónica
