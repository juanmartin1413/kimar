# Facturación ARCA

Implementación inicial: facturas A y notas de crédito A totales, bienes nacionales en PES, precios netos e IVA 21%. No importa ni factura operaciones históricas. Las ventas sin emisión conservan su importe y remito.

## Configuración

La API lee estas variables (reiniciar el servicio tras cambiarlas):

```text
ARCA_ENVIRONMENT=homologation
FACTURACION_EMISOR_ACTIVO=dueno
Facturacion__ReintentoMinutos=15
Facturacion__Emisores__dueno__Cuit=<CUIT sin guiones>
Facturacion__Emisores__dueno__RazonSocial=<razón social>
Facturacion__Emisores__dueno__Domicilio=<domicilio fiscal>
Facturacion__Emisores__dueno__IngresosBrutos=<inscripción>
Facturacion__Emisores__dueno__InicioActividades=2020-01-01
Facturacion__Emisores__dueno__homologation__PuntoVenta=1
Facturacion__Emisores__dueno__homologation__CertificadoPath=/run/secrets/arca-test.crt
Facturacion__Emisores__dueno__homologation__ClavePrivadaPath=/run/secrets/arca-test.key
Facturacion__Emisores__dueno__production__PuntoVenta=<punto habilitado>
Facturacion__Emisores__dueno__production__CertificadoPath=/run/secrets/arca-prod.crt
Facturacion__Emisores__dueno__production__ClavePrivadaPath=/run/secrets/arca-prod.key
```

Certificado X.509 y clave privada RSA en PEM, con permisos restringidos al proceso. Nunca cargar secretos en el frontend o Git. Registrar la asociación al servicio `wsfe` y un punto de venta para Web Services. Los valores son propios de cada ambiente; homologación no habilita producción. Sin configuración, la pantalla informa qué falta y no inventa credenciales.

Alternativa para Railway: definir `Facturacion__Emisores__dueno__homologation__CertificadoPem` y `Facturacion__Emisores__dueno__homologation__ClavePrivadaPem` con el contenido completo de cada archivo, conservando encabezados y saltos de línea reales. Se leen directamente en memoria, sin crear archivos en el contenedor. Ambas variables deben estar completas; tienen prioridad sobre las rutas. No se mezclan un PEM y un archivo ni se toman credenciales de otro ambiente. Para producción se usan las mismas variables bajo `production`. Ver [secuencia de pruebas en Railway](FACTURACION-RAILWAY.md).

Para la SAS agregar otro perfil bajo `Facturacion__Emisores__sas__...` y cambiar `FACTURACION_EMISOR_ACTIVO=sas`. No reemplazar el CUIT ni punto de venta del perfil del dueño: las solicitudes existentes, NC y reemplazos conservan su emisor original. Mantener ese perfil y sus credenciales mientras se deban resolver operaciones anteriores. La integración supone emisores responsables inscriptos habilitados para comprobantes A ordinarios; otros regímenes requieren ampliar el alcance.

## Persistencia y despliegue

Aplicar la migración `AddFacturacionArca` mediante el mecanismo existente (la API migra al arrancar). Desplegar backend antes de web. Respaldar base y volumen de archivos antes del despliegue. No ejecutar migraciones de reversión si existen comprobantes emitidos.

Los PDF se guardan bajo `Storage:UploadsPath/fiscal/{ambiente}/{cuit}`. El volumen debe persistir entre despliegues y respaldarse junto con PostgreSQL. Las descargas requieren autenticación; los documentos fiscales no se cargan ni borran por el endpoint genérico de adjuntos.

Una venta de homologación también afecta stock y cuenta corriente en la base donde se registra. Para la fase de pruebas actual, el usuario autorizó usar el entorno y la base existentes de Railway con esos efectos. Al comenzar operación real, separar las pruebas de esa base. Usar un punto de venta dedicado a esta integración; los locks PostgreSQL coordinan instancias que comparten esta base, no otros programas emisores independientes.

## Operación

- Cliente: preferencia de factura y datos fiscales. Venta: selector Sí/No, revisión de descripciones, receptor y total; confirmación obligatoria.
- Un borrador revisado queda vinculado al contenido de la venta y al emisor/ambiente. Cambios posteriores exigen una nueva revisión.
- La confirmación guarda venta, cobranzas, stock y solicitud en una transacción. El worker detecta nuevas solicitudes cada 15 segundos; errores transitorios se reintentan cada 15 minutos, configurables, sin límite de intentos.
- La venta continúa por preparación, entrega y cobranza durante una caída. Facturación muestra pendientes, último error, próximo intento y alerta tras una hora.
- Una emisión incierta se consulta antes de reenviarla; la serie no avanza hasta resolver su número. Datos rechazados o configuración inválida requieren intervención. Las fechas vencidas no se cambian silenciosamente.
- Admin/gestor revisan y reintentan. Solo admin emite NC y reemplazos. La NC total exige elegir entre anular venta (reduce deuda y conserva cobros como saldo a favor) y corrección fiscal (conserva deuda para refacturar).
- La NC no devuelve stock ni reintegra dinero automáticamente. Las devoluciones físicas se registran mediante el circuito de stock. Aplicación de créditos a otras ventas y reintegros monetarios no forman parte de esta entrega.
- Las comisiones se calculan sobre netos, prorrateando el cobro bruto; las ventas anuladas comercialmente se excluyen. El módulo existente es una calculadora, no un libro de liquidaciones históricas.
- Un error al crear el PDF reintenta solo el documento; nunca vuelve a emitir la factura.

## Interfaces

`/api/facturacion`: configuración pública sin secretos, preview, listado paginado (50), detalle, historial de intentos y PDF. Acciones por comprobante: `reintentar`, `corregir`, `nota-credito`, `reemplazar`.

El alta de venta agrega `emitirFactura`, `borradorFiscalId` y `operacionId` (UUID idempotente). Devuelve ID y estado fiscal inicial. La venta expone IVA, crédito aplicado y estado fiscal. El backend protege los datos comerciales de ventas con solicitud fiscal, incluso antes de la autorización.

## Validación

```powershell
# Exclusivamente servidor temporal aislado; las pruebas crean/eliminan sus propias bases kimar_fiscal_test_*.
$env:KIMAR_TEST_DB='Host=127.0.0.1;Port=55439;Username=postgres;Database=postgres'
dotnet test backend/KimarApi.Tests/KimarApi.Tests.csproj
```

Sin `KIMAR_TEST_DB`, las pruebas de integración se marcan inconclusas. Los tests usan PostgreSQL real y un doble de ARCA; no contactan servicios fiscales. Cubren migraciones, idempotencia, concurrencia de locks, respuesta perdida, reintentos sin límite, rechazo, borradores obsoletos, NC, reemplazo con emisor original y PDF/QR.

Se verificó compilación backend, build web y 10 pruebas. Falta validar punta a punta con certificados reales de homologación antes de habilitar producción; tampoco se realizó una emisión productiva. Los tickets WSAA se conservan en memoria y se renuevan antes del vencimiento: un reinicio exige autenticación nuevamente. Certificados, autorizaciones, tipos fiscales habilitados y diseño final del comprobante requieren validación con los datos reales del emisor.

### Conexión real de homologación verificada — 11/11/2026 (Argentina)

Se verificó la correspondencia del certificado PEM y su clave privada, y se autenticó contra WSAA usando el `ArcaClient` del módulo. La autorización al servicio `wsfe` permitió consultar WSFE: `FECompUltimoAutorizado` devolvió 0 para factura A (tipo 1) y NC A (tipo 3), ambas en punto de venta 1. `FEParamGetPtosVenta` devolvió código 602, «Sin Resultados»; por lo tanto, no se confirmó un punto de venta habilitado mediante ese listado.

La prueba fue de solo lectura, con configuración temporal, sin iniciar la API, modificar bases ni emitir comprobantes. No dejó configurado el perfil fiscal definitivo del emisor. Sigue pendiente la prueba de emisión y consulta de factura A y NC A en homologación. En WSASS, usar alias alfanuméricos sin guiones (por ejemplo, `kimartest`).

Fuentes: [WSAA](https://www.afip.gob.ar/ws/documentacion/wsaa.asp), [manual WSFEv1](https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-RG-4291.pdf), [QR](https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf). El manual pudo consultarse durante implementación; el relevamiento inicial había registrado timeouts.
