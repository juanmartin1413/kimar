# Comisiones y pagos a vendedores

Luciano y Manolo tienen `Vendedor.ComisionPorKg = 500`. El seed y la migración inicial identifican sus usuarios por email; luego los cálculos usan el ID del vendedor. No hay dependencia del costo de adquisición. Los ítems guardan la unidad vigente al registrar la venta; los productos por unidad no generan comisión.

## Cálculo y registro

- La comisión habilitada acumulada es `kg × tarifa × min(1, cobros / totalVenta)`, redondeada por venta a centavos. El total y los cobros incluyen IVA. Solo se consideran cobranzas cobradas con fecha real de cobro.
- Cada liquidación registra la diferencia contra lo ya liquidado por venta, incluso si el período se superpone. Los filtros de entrega, cliente y operaciones seleccionan diferencias positivas; las negativas se incluyen siempre para impedir eludir recuperaciones.
- Una anulación comercial o reducción de cantidades puede reducir el derecho acumulado: la diferencia negativa se registra en la siguiente liquidación y el dinero ya entregado se compensa contra futuras comisiones. Un corte histórico por sí solo no revierte cobros posteriores al corte.
- Los anticipos están limitados a la comisión generada por ventas hasta hoy menos el dinero neto ya entregado. Se compensan por orden de registro (FIFO), con aplicaciones detalladas y saldo remanente. Una liquidación puede tener pago cero.
- La confirmación registra un pago efectivo, no ejecuta transferencias bancarias. La fecha no puede ser futura ni anterior al corte de la liquidación. Importes en ARS, fechas de negocio de Argentina y auditoría UTC.
- Las constancias conservan un snapshot de vendedor, tarifa, operaciones, productos, cobros y compensaciones. Los PDF se generan desde ese snapshot y usan el logo incorporado de las facturas; no son comprobantes fiscales.
- La contrapartida solo se admite sobre el último movimiento del vendedor. Revertir una liquidación revierte sus importes y aplicaciones, pero conserva el dinero entregado como saldo a cuenta. Para un anticipo, la acción es registrar la devolución efectiva de su saldo pendiente. No se borran ni modifican documentos confirmados.

## API y permisos

`/api/comisiones`: `vendedores`, `preview`, `saldos`, `historial` (30 por página), `{id}`, `{id}/pdf`, `liquidaciones`, `anticipos` y `{id}/contrapartida`.

Solo admin confirma pagos o consulta preliquidaciones. El vendedor accede exclusivamente a sus saldos, documentos y PDF mediante `Vendedor.UsuarioId`. Gestor, depósito y repartidor no acceden. La interfaz agrega “Mis liquidaciones” al menú del vendedor.

Cada confirmación recibe una `operacionId` UUID y devuelve el documento existente si se repite exactamente. Reutilizarla con otro contenido devuelve 409. Una preliquidación modificada también devuelve 409. El navegador conserva la operación pendiente en localStorage para reintentar con la misma clave si pierde la respuesta.

El servidor bloquea por vendedor y estabiliza Ventas, ItemsVenta, Cobranzas y Vendedores durante la transacción de confirmación. Las ediciones completas de ventas usan el mismo orden de bloqueo; se impide cambiar el vendedor de una venta con detalles de comisión. El bloqueo de tablas es conservador y puede serializar escrituras comerciales durante una confirmación.

## Migración y pruebas

La migración `ComisionesLiquidaciones` crea documentos, detalles y aplicaciones, copia la unidad del catálogo a los ítems existentes y habilita la tarifa de ambos vendedores. No importa pagos ni crea saldos iniciales. La API aplica migraciones al iniciar.

Las pruebas de integración requieren `KIMAR_TEST_DB` apuntando a un PostgreSQL temporal aislado. Crean y eliminan sus propias bases `kimar_fiscal_test_*`; nunca se debe usar una base de producción.

```powershell
$env:KIMAR_TEST_DB='Host=127.0.0.1;Port=55439;Username=postgres;Database=postgres'
dotnet test backend/KimarApi.Tests
```
