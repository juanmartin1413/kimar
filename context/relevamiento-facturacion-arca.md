# Relevamiento: facturación y notas de crédito con ARCA

Fecha: 11 de noviembre de 2026. Estado: propuesta para definir alcance; no implementada.

> Documento original del relevamiento. Las decisiones posteriores y la implementación se documentan en [backend/FACTURACION.md](../backend/FACTURACION.md): responsables inscriptos dueño/SAS configurables, FC A, NC A totales, IVA 21% sobre netos, históricos excluidos, continuidad operativa y reintentos cada 15 minutos sin límite por cantidad.

## 1. Recomendación

Incorporar un módulo de Facturación dentro del backend .NET existente, integrado con Ventas, y una pantalla de comprobantes para consulta, seguimiento y notas de crédito. Usar inicialmente integración directa con WSAA + WSFEv1, condicionada a confirmar el régimen fiscal de KIMAR. No hace falta separar un microservicio para este alcance.

La factura se solicita al confirmar la venta. Su vista previa se prepara antes, dentro de la misma pantalla de venta. La nota de crédito se inicia desde la factura original, tanto desde el detalle de venta como desde Facturación. Compras conserva el circuito de comprobantes recibidos de proveedores.

Una variable del backend selecciona homologación o producción, con perfiles completos e independientes. La autorización fiscal, el cobro y la entrega tendrán estados separados.

## 2. Situación encontrada en el repositorio

El contexto de `context/` describe todavía una etapa de prototipo. El código actual ya contiene Next.js 15.5.19, API .NET 8, EF Core y PostgreSQL; este relevamiento toma la implementación como referencia para los impactos.

| Área | Estado actual | Cambio necesario |
|---|---|---|
| Clientes | Nombre, dirección, CUIT opcional; sin preferencia ni condición fiscal | `RequiereFactura=false`, razón social, identificación fiscal y condición IVA; separar domicilio fiscal del de entrega |
| Alta de venta | Carga manual de `nroFactura`; importa datos de pedidos | Selector de emisión, borrador fiscal, preview y confirmación obligatoria |
| Confirmación | `VentasController.Create` guarda venta/cobranzas/pedido y luego registra stock | Una transacción local consistente y una solicitud fiscal persistida, recuperable e idempotente |
| Edición | Admin puede cambiar cliente, productos, cantidades, precios y plan; gestor puede cambiar número de factura | Proteger los campos facturados también desde la API; correcciones explícitas |
| Facturas | Un único texto `NroFactura`; no hay entidades fiscales ni integración | Comprobantes relacionados con venta, historial, autorizaciones y documentos |
| Productos | Precio y unidad; sin tratamiento de IVA | Definir precio final/neto y alícuotas según producto; cálculo decimal en backend |
| Adjuntos | Metadatos en PostgreSQL y archivos en volumen; UI de ventas muestra imágenes | PDF descargable, vínculo con comprobante y protección frente a eliminación/reemplazo |
| Remito | HTML generado en navegador con impresión; remito firmado como adjunto | Reutilizar identidad visual y experiencia de acceso; factura definitiva almacenada en servidor |
| Cuenta corriente | Saldo = total venta − cobranzas; algunos agregados descartan saldos negativos | Ajustes comerciales y saldos a favor, sin inventar cobranzas |
| Comisiones | Margen por producto prorrateado por lo cobrado | Acordar efecto de devoluciones, descuentos, IVA y ajustes de períodos anteriores |
| Reportes | Totales de venta y cobro, sin NC | Mostrar ventas, ajustes y netos de manera consistente |

Referencias principales:

- `backend/KimarApi/Controllers/VentasController.cs`: alta y edición de cabecera.
- `backend/KimarApi/Services/VentaService.cs`: edición completa, stock y estado de cobro.
- `backend/KimarApi/Models/Entities/Cliente.cs`, `Venta.cs`, `Producto.cs`: datos disponibles.
- `backend/KimarApi/Models/DTOs/ClienteDtos.cs`, `VentaDtos.cs`: contratos a ampliar.
- `backend/KimarApi/Data/KimarDbContext.cs`: relaciones, índices y precisión decimal global de dos posiciones.
- `web/src/app/interno/ventas/nueva/page.tsx`: `onClienteChange`, `onPedidoSelect`, `handleSubmit`, `doSave`. La advertencia actual depende del plan de cobro; no hay confirmación fiscal universal.
- `web/src/app/interno/ventas/[id]/page.tsx`, `ventas/page.tsx`: edición, listado y número de factura.
- `web/src/components/interno/ClienteForm.tsx`, `web/src/contexts/DataContext.tsx`, `web/src/lib/types.ts`: formulario, operaciones API y contratos web.
- `backend/KimarApi/Services/AdjuntoService.cs`, `Controllers/AdjuntosController.cs`, `web/src/components/interno/AdjuntosVenta.tsx`: almacenamiento y presentación.
- `backend/KimarApi/Models/TiposDocumentoVenta.cs`: ya reserva `factura`, pero el circuito de entregas habilita solamente `remito_firmado`.
- `web/src/lib/remitoPdf.ts`, `cuentaCorriente.ts`, `comisiones.ts`, `saludFinanciera.ts`: documentos y cálculos afectados.

No se encontraron pruebas automatizadas del proyecto en la búsqueda de archivos. El directorio mobile no contiene una implementación relevada. No se consultó la base de producción ni se usaron credenciales fiscales.

## 3. Flujo de clientes y ventas

### Preferencia y datos fiscales

Agregar «¿Requiere factura?» al cliente, con valor inicial `false`, también para los clientes existentes. Es una preferencia para inicializar nuevas operaciones; no modifica ventas anteriores ni determina por sí sola la obligación fiscal.

Guardar por separado nombre comercial y razón social, tipo/número de documento, condición IVA y domicilio fiscal. Para emitir, validar los campos exigibles según receptor y comprobante. No completar una condición fiscal desconocida con un valor supuesto. Evaluar consulta de padrón como mejora posterior; no confundir el catálogo de condiciones IVA con una consulta de la situación particular del cliente.

### Datos de la venta

Mostrar siempre «Emitir factura: Sí / No». Al elegir cliente o importar un pedido, inicializar desde su preferencia. Permitir cambiarlo para esa operación, sin modificar la ficha del cliente.

Si cambia el cliente después de preparar la factura, actualizar receptor y preferencia, e invalidar la revisión anterior. Los cambios manuales no deben desaparecer por una recarga de datos en segundo plano.

La decisión debe persistirse en la venta junto con usuario y fecha de confirmación. Si el cliente normalmente requiere factura y se elige No, remarcar esa diferencia en el resumen final; se puede registrar un motivo.

### Vista previa propuesta

Agregar una sección «Factura» después de los productos y antes del botón final. Cuando la emisión está activa, mostrar un resumen y «Revisar / editar factura», que abre un panel amplio o diálogo. Evitar intentar editar todo dentro del pequeño modal de confirmación.

Autocompletar receptor, productos, cantidades, unidades, precios, impuestos y condiciones conocidas. El borrador debe permitir editar descripciones fiscales por renglón y observaciones pertinentes, conservando el vínculo con el ítem vendido. Esas descripciones no cambian el catálogo, la calidad interna, el stock ni el remito. Deben describir fielmente la operación.

Mantener importes derivados de la venta y recalculados por el servidor. Cambiar cantidades o precios requiere modificar la operación y revisar otra vez; no permitir un total fiscal arbitrario separado del comercial. Los datos fiscales corregidos pueden aplicarse a esta factura; actualizar también la ficha del cliente debe ser una acción explícita.

Mostrar «Borrador — sin validez fiscal» y ambiente de prueba cuando corresponda. No anticipar un número definitivo ni un CAE. Si cambian cliente, ítems, importes o impuestos, el servidor invalida la versión revisada y exige nueva confirmación.

### Confirmación final obligatoria

Al presionar «Registrar venta», abrir siempre un modal, incluso cuando Emitir factura = No. Integrar allí la advertencia existente sobre plan de cobro incompleto.

Ejemplo de contenido:

> Cliente: razón social y CUIT/documento
> Total de la venta: importe
> **SE EMITIRÁ FACTURA** / **NO SE EMITIRÁ FACTURA DESDE EL SISTEMA EN ESTA OPERACIÓN**
> Tipo de comprobante y ambiente, cuando corresponda
> Acciones: Volver y corregir / Confirmar venta y emitir factura

Para No, el botón final debe decir «Confirmar venta sin emitir factura». Si se cambia a Sí desde esta instancia, volver a la revisión fiscal si falta información. Deshabilitar doble clic y respaldarlo con idempotencia del servidor.

El alcance de «No» debe acordarse: operación pendiente de facturación, facturación externa u otro supuesto válido. El selector controla la emisión desde KIMAR; no define una exención. Esto también determina si habrá una bandeja de operaciones pendientes de facturar.

## 4. Integración con ARCA

WSAA autentica mediante certificado digital; las credenciales y asociaciones se gestionan por separado para homologación y producción. Deben permanecer exclusivamente en backend. [Documentación oficial de WSAA](https://www.afip.gob.ar/ws/documentacion/wsaa.asp).

WSFEv1 permite emitir comprobantes sin enviar detalle de ítems. El detalle comercial se conserva en KIMAR y se representa en el PDF. Si el encuadre de la empresa exige informar detalle a ARCA, debe evaluarse WSMTXCA. Esta distinción permite el preview editable sin requerir automáticamente el servicio con detalle. [Catálogo oficial de facturación electrónica](https://www.afip.gov.ar/ws/documentacion/ws-factura-electronica.asp).

La implementación propuesta utiliza solicitud de CAE y conserva autorización, vencimiento, errores y observaciones devueltas. El PDF lo genera KIMAR a partir de los datos congelados y la respuesta fiscal; la operación de autorización no entrega un PDF. [Contrato oficial FECAESolicitar](https://servicios1.afip.gov.ar/wsfev1/service.asmx?op=FECAESolicitar).

La factura definitiva incorporará el QR según la especificación oficial, además de los datos y leyendas aplicables al régimen. El diseño debe contemplar también la discriminación informativa de impuestos cuando corresponda. [Especificación oficial del QR](https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf).

Para la condición IVA del receptor y tipos de comprobante, usar catálogos oficiales y validaciones; no una regla simplista basada solamente en si tiene CUIT. [Consulta oficial de condiciones IVA](https://servicios1.afip.gov.ar/wsfev1/service.asmx?op=FEParamGetCondicionIvaReceptor).

La página de homologación enlaza una versión 4.8 y la de documentación general una 4.7. Los PDF de esos manuales no pudieron recuperarse durante el relevamiento por timeout. Se verificaron las páginas y contratos públicos; antes de cerrar la especificación técnica deberá revisarse el manual vigente completo y sus validaciones. No se da por confirmada aquí una fecha de obligatoriedad del campo IVA receptor. El diseño propuesto lo requiere desde el inicio. [Manuales de homologación](https://www.afip.gob.ar/fe/ayuda/homologacion_externa.asp).

### Integración directa o intermediario

| Alternativa | Ventaja para KIMAR | Costo o dependencia |
|---|---|---|
| Directa desde .NET | Control de datos, estados, documentos y recuperación | Mantener SOAP, certificados y actualizaciones de ARCA |
| Proveedor externo | Puede simplificar autenticación, emisión y soporte | Contrato, costos, dependencia y revisión de exportación/idempotencia |

Recomiendo comenzar con un adaptador directo aislado detrás de una interfaz interna. No se seleccionó ni cotizó un proveedor. Si el soporte fiscal tercerizado es prioritario, se puede comparar esa alternativa antes de implementar el adaptador, conservando el mismo modelo de ventas y comprobantes.

## 5. Test y producción con una variable

Configuración propuesta, todavía inexistente:

```text
ARCA_ENVIRONMENT=homologation
# Para producción: ARCA_ENVIRONMENT=production
```

Ambos perfiles se preparan una vez con CUIT emisor, punto de venta, certificado, clave privada y referencias a secretos. La variable selecciona el perfil completo al arrancar; no solamente una URL. Si el valor es desconocido o falta configuración, bloquear emisión e informar el problema, sin elegir producción por defecto.

| Servicio | Homologación | Producción |
|---|---|---|
| WSAA | `https://wsaahomo.afip.gov.ar/ws/services/LoginCms` | `https://wsaa.afip.gov.ar/ws/services/LoginCms` |
| WSFEv1 | `https://wswhomo.afip.gov.ar/wsfev1/service.asmx` | `https://servicios1.afip.gov.ar/wsfev1/service.asmx` |

URLs verificadas en [WSAA](https://www.afip.gob.ar/ws/documentacion/wsaa.asp), [WSFEv1 homologación](https://wswhomo.afip.gov.ar/wsfev1/service.asmx) y [WSFEv1 producción](https://servicios1.afip.gov.ar/wsfev1/service.asmx).

Provisionar el punto de venta habilitado para el sistema de emisión correspondiente; no asumir que sirve el usado en Comprobantes en línea. [Consulta oficial sobre puntos de venta](https://servicioscf.afip.gob.ar/publico/abc/consultas_detalle.aspx?id=12012763).

Mantener separados tokens, correlativos, trabajos pendientes y documentos por ambiente y CUIT. Cada solicitud conserva el ambiente con el que nació: un cambio de variable no debe reenviar pendientes de prueba a producción ni cambiar el destino de una conciliación. Una NC solo puede asociarse con una factura del mismo ambiente y emisor.

Recomiendo además despliegues y bases de datos separados para pruebas reales del circuito de venta: emitir en homologación no impide por sí solo que una venta de prueba afecte stock y deuda de una base productiva. No se migran comprobantes de prueba a comprobantes reales cambiándoles una etiqueta. La web muestra el ambiente informado por la API; no contiene certificados ni un interruptor para cambiarlo.

## 6. Consistencia, fallos y duplicados

La autorización externa no participa de una transacción PostgreSQL. No es posible garantizar que un rollback local deshaga una factura autorizada por ARCA.

Flujo propuesto:

1. Validar venta y versión del borrador en el servidor; calcular importes y redondeos.
2. Guardar venta, pedido, cobranzas, stock y solicitud fiscal en una transacción local. La solicitud incluye los datos revisados y una clave de idempotencia.
3. Después del commit, procesar inmediatamente la solicitud mediante una cola persistida en PostgreSQL y un worker del backend. No hace falta incorporar un broker externo inicialmente.
4. Serializar la emisión por ambiente + CUIT + punto de venta + tipo. Consultar último autorizado y asignar el siguiente bajo coordinación entre instancias; no reutilizar el contador de remitos.
5. Persistir el intento y su número antes de llamar al servicio. Registrar el resultado y generar/almacenar el PDF cuando corresponda.
6. Si se pierde la respuesta o se reinicia la API, consultar el comprobante específico y comparar sus datos antes de repetir una solicitud. No saltar al número siguiente suponiendo que la anterior fracasó. [Consulta oficial FECompConsultar](https://servicios1.afip.gov.ar/wsfev1/service.asmx?op=FECompConsultar).

La consulta del último número por sí sola no resuelve una carrera entre dos emisores. Preferir un punto de venta dedicado a esta integración y bloquear o conciliar la serie ante resultados ambiguos. La clave idempotente debe abarcar también el registro de la venta, no solamente la llamada fiscal.

Estados separados:

- Emisión: borrador, pendiente, en proceso, autorizada, rechazada, resultado desconocido/en conciliación.
- Documento: pendiente de generación, disponible, error de generación.
- Ajuste de factura: sin acreditar, acreditada parcialmente, acreditada totalmente; derivado de NC autorizadas.
- Cobro y entrega: mantienen sus propios estados operativos.

Un HTTP 200 no basta para considerar autorizada una factura: se interpreta el resultado fiscal. Un PDF fallido se regenera con los datos persistidos sin volver a emitir. Un timeout permanece en conciliación; un rechazo confirmado permite corregir y reconfirmar una nueva versión.

Propuesta operativa a acordar: conservar la venta registrada y mostrar «Facturación pendiente» si ARCA está indisponible. Nunca transformar automáticamente Sí en No ni mostrar «facturada» sin autorización. Si KIMAR exige factura antes del despacho, agregar una regla que bloquee esa transición mientras se resuelve el incidente.

## 7. Notas de crédito y efectos comerciales

Crear «Emitir nota de crédito» sobre una factura autorizada. Precargar emisor, receptor, moneda, comprobante asociado y conceptos; pedir motivo, alcance y confirmación. Conservar factura y NC como documentos independientes con numeración y autorización propias.

La regla fiscal general vincula las NC con comprobantes previos del mismo emisor. Por eso este circuito pertenece a las ventas de KIMAR. Las NC de compras se reciben del proveedor y requieren otro circuito de registración. [Comprobantes y notas de crédito — ARCA](https://afip.ar/facturacion/comprobantes/tipos.asp).

Para el alcance inicial, recomiendo NC total para anulación y refacturación. Diseñar el modelo para varias NC y ajustes parciales; si descuentos o devoluciones parciales son habituales, incluirlas desde la primera entrega. Evitar acreditar más de lo disponible, considerando también solicitudes concurrentes pendientes.

Separar tres efectos:

| Motivo | Efecto comercial propuesto | Stock / dinero |
|---|---|---|
| Anulación de operación | Ajuste que reduce la deuda comercial | Reingreso solo si hay devolución física; reintegro o crédito si ya se cobró |
| Descuento o devolución parcial | Ajuste por importe y, si corresponde, por ítem | Stock según mercadería efectivamente recibida; no toda NC implica devolución |
| Corrección fiscal y refacturación | Conservar la operación comercial; relacionar factura, NC y reemplazo | Evitar una segunda venta, segunda deuda o segundo movimiento de stock |

No registrar una NC como cobranza ni borrar cobros anteriores. Para una venta de $100.000, con $60.000 cobrados y un ajuste comercial de $50.000, queda un saldo a favor de $10.000. Debe poder mantenerse como crédito o aplicarse a un reintegro explícito; no desaparecer de los agregados que hoy solo suman deudas positivas.

Proponer movimientos de ajuste comercial vinculados a la NC, con aplicación una sola vez, y tratamiento explícito del plan de cobro pendiente. El saldo se obtiene de venta + ajustes comerciales − cobros, considerando aplicaciones/reintegros. La factura de reemplazo no crea otro cargo por la misma venta. Los detalles contables y de imputación se cerrarán con el negocio.

Comisiones requiere una regla propia: una NC por corrección de texto no debería revertir margen comercial; una devolución o descuento sí puede hacerlo. Definir base neta/bruta de IVA, costo de mercadería devuelta y tratamiento de una comisión ya liquidada en otro período, conservando trazabilidad.

Propuesta de permisos: admin/gestor emiten FC según acceso actual a ventas; NC y excepciones inicialmente para admin o permiso específico. Depósito y reparto mantienen sus restricciones sobre información comercial.

## 8. Modelo, documentos e históricos

Entidades sugeridas:

- `PerfilFiscalEmisor`: CUIT, razón social, domicilio, condición fiscal, datos de impresión y configuración por ambiente; secretos referenciados, no expuestos en API.
- `ComprobanteFiscal`: venta, ambiente, emisor, clase/tipo, punto de venta, número, fechas, moneda, importes, impuestos, estado y autorización.
- `ItemComprobanteFiscal`: descripción fiscal, vínculo con ítem comercial, cantidad, unidad, precio, alícuota y totales congelados.
- `ComprobanteAsociado`: factura de origen de la NC y vínculo de reemplazo cuando corresponda.
- `SolicitudEmision` / `IntentoEmision`: idempotencia, versión, ambiente fijado, número solicitado, respuesta, errores, tiempos, usuario y recuperación.
- `AjusteComercial`: efecto sobre deuda e ítems, motivo y vínculo fiscal; devolución física y reintegro como acciones relacionadas pero separadas.
- `DocumentoFiscal`: archivo, comprobante, versión de plantilla y hash; puede reutilizar almacenamiento de adjuntos con restricciones de inmutabilidad.

Usar unicidad por ambiente, CUIT, punto de venta, tipo y número autorizado, además de clave de operación. Revisar precisión: hoy todos los `decimal` se fuerzan a dos decimales; cantidades, precios intermedios y cotización pueden requerir otra escala. El backend calcula y valida el total; el frontend presenta el mismo resultado.

Guardar una copia histórica de emisor, receptor, ítems, condiciones e impuestos al emitir. No regenerar facturas antiguas con nombres, domicilios o alícuotas actuales. Conservar solicitud/respuesta útiles para auditoría, protegiendo datos personales y excluyendo tokens, firmas de acceso y claves privadas de los logs.

Mostrar en detalle de venta y listado de Facturación: tipo, letra, número completo, fecha, importe, estado, comprobante asociado y descarga PDF. En el listado de ventas, mostrar la FC vigente y acceso al historial de FC/NC; una venta puede tener factura original, NC y reemplazo.

Adaptar los adjuntos para PDF y descarga binaria autenticada, sin cargar todos los documentos como imágenes Base64. Las rutas genéricas de carga/eliminación deben impedir suplantar, borrar o reemplazar un comprobante fiscal generado. Mantener el remito firmado y su efecto sobre entrega separados de FC/NC.

El volumen persistente actual puede reutilizarse inicialmente, con respaldo y restauración coordinados de base y archivos. La disponibilidad del archivo se registra aparte de la autorización fiscal.

Migración: conservar los números manuales actuales como referencias históricas/externas no verificadas. No inferir CAE ni marcar como autorizados, y no emitir automáticamente todas las ventas anteriores. Para acreditar facturas externas, prever una incorporación validada de sus datos; no asumir que WSFE puede recuperar cualquier comprobante emitido por otro canal.

## 9. Implementación y validación propuestas

1. Cerrar encuadre fiscal, significado de los precios, contingencia, alcance de NC y permisos.
2. Preparar certificados y homologación; crear modelo fiscal, migraciones, cálculos, transacción e idempotencia en backend.
3. Implementar adaptadores WSAA/WSFEv1, cola, conciliación, PDF y almacenamiento.
4. Integrar Clientes, nueva venta, preview, modal y consulta de comprobantes en web.
5. Completar NC, ajustes comerciales, saldos, comisiones y reportes antes de habilitar ese circuito.
6. Validar en homologación y luego preparar el perfil productivo y su punto de venta.

Casos de aceptación imprescindibles:

- Preferencia false por defecto; cliente Sí/No; venta directa e importada de pedido; cambio de cliente.
- Preview con descripciones modificadas y datos fiscales incompletos; cambios posteriores invalidan revisión.
- Confirmación explícita en ambos casos, conservando advertencias del plan de cobro.
- Emisión válida por cada tipo e impuesto del alcance; importes/redondeos y PDF/QR consistentes.
- Doble clic, reenvío HTTP y dos ventas concurrentes sin duplicar ventas ni comprobantes.
- Timeout antes/después de autorización, reinicio del worker y persistencia fallida tras respuesta; recuperación de la misma solicitud.
- Rechazo fiscal corregible; autorización con observaciones; error de PDF sin segunda emisión.
- NC total y, si se incluyen, parciales concurrentes; venta cobrada/parcial; saldo a favor y refacturación sin duplicar deuda.
- Factura emitida protegida frente a edición, carga de archivo falso o eliminación por endpoints genéricos.
- Cambio de ambiente con pendientes existentes sin cruzar credenciales, numeración, NC ni archivos.
- Histórico manual preservado y ninguna emisión retroactiva automática.

Este relevamiento no ejecutó pruebas de integración, no emitió comprobantes y no modificó código de aplicación. La validación con credenciales y el manual completo queda para la implementación.

## 10. Decisiones pendientes

1. ¿KIMAR factura con un solo CUIT? ¿Responsable inscripto, monotributo u otra condición? ¿Qué tipos emite y está obligada a regímenes especiales, FCE MiPyME o percepciones?
2. ¿Los precios actuales incluyen IVA? ¿Qué tratamiento/alícuotas corresponde a cada producto? ¿Se usarán solamente pesos y venta de bienes?
3. ¿Se factura hoy desde Comprobantes en línea u otro sistema? ¿Debe coexistir y se dispone de punto de venta para Web Services?
4. ¿Emitir factura = No significa emitir después, emitir afuera u otro caso? ¿Se requiere seguimiento posterior?
5. Ante indisponibilidad de ARCA, ¿se registra la venta pendiente de factura y se permite prepararla/entregarla?
6. ¿Primera versión con NC totales o también parciales? ¿Cómo se registrarán devoluciones, créditos y reintegros?
7. ¿Quién puede emitir NC y cómo ajustan las comisiones de períodos ya liquidados?

Supuestos de dimensionamiento, no decisiones confirmadas: un CUIT, ventas nacionales de bienes en ARS, factura por el total de cada venta y NC total inicial. No se estima un plazo cerrado hasta resolver los puntos fiscales y comerciales que cambian el alcance.
