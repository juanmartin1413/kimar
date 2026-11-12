# Pruebas de facturación en Railway

El entorno actual de Railway se usa para pruebas con autorización del usuario, incluyendo los efectos sobre stock, ventas y cuenta corriente. ARCA debe permanecer en homologación. No se realizó todavía una emisión completa contra ARCA.

## 1. Variables del servicio backend

En Variables, agregar estas claves sin eliminar DATABASE_URL, JWT_SECRET, CORS ni otras variables existentes:

```dotenv
ARCA_ENVIRONMENT=homologation
FACTURACION_EMISOR_ACTIVO=dueno
Facturacion__ReintentoMinutos=15
Facturacion__Emisores__dueno__Cuit=20358549684
Facturacion__Emisores__dueno__RazonSocial=MONCLUS MARCOS ALEJANDRO
Facturacion__Emisores__dueno__Domicilio=Bynnon 1733, Adrogué, Buenos Aires
Facturacion__Emisores__dueno__IngresosBrutos=20358549684
Facturacion__Emisores__dueno__InicioActividades=2020-07-01
Facturacion__Emisores__dueno__homologation__PuntoVenta=1
```

El punto 1 es el candidato de prueba: la consulta de última factura y NC devolvió 0, pero el listado de puntos devolvió 602 sin resultados. Su capacidad de emisión aún no está confirmada. El domicilio se tomó de la cabecera comercial proporcionada por el usuario.

Agregar individualmente dos variables multilínea SOLO en el backend:

| Variable | Valor |
| --- | --- |
| `Facturacion__Emisores__dueno__homologation__CertificadoPem` | Contenido completo de `D:\Personal\Kimar\arca-test.crt` |
| `Facturacion__Emisores__dueno__homologation__ClavePrivadaPem` | Contenido completo de `D:\Personal\Kimar\arca-test.key` |

Conservar las líneas BEGIN/END y los saltos de línea reales, sin comillas envolventes ni reemplazarlos por `\n` literal. No cargar el CSR. Sellar la variable de clave privada con la opción Seal; conservar el original local. No subir archivos de credenciales a Git ni poner variables fiscales en el frontend. No hacen falta CertificadoPath/ClavePrivadaPath cuando se usa este par PEM.

Railway documenta variables multilínea, variables selladas y la necesidad de desplegar los cambios de variables: https://docs.railway.com/variables.

## 2. Persistencia y despliegue

1. Conservar una copia recuperable de la base antes de la migración. No revertir migraciones con comprobantes existentes.
2. Comprobar que `Storage__UploadsPath` apunta al volumen persistente de adjuntos. Mantener el montaje actual si ya existe; no cambiar la ruta sin trasladar los archivos previos. Si todavía no hay volumen, provisionarlo y configurar la ruta correspondiente antes de probar descargas a través de un redespliegue.
3. Subir el código pendiente del módulo y estos cambios de soporte PEM. Revisar el diff y excluir credenciales y archivos ajenos al cambio.
4. Desplegar backend con las variables. La API aplica migraciones al arrancar. Esperar inicio correcto y respuesta de `/health`.
5. Desplegar frontend con `NEXT_PUBLIC_API_URL` apuntando al backend actual. Entrar con usuario admin para poder emitir NC. No cambiar CORS si se mantienen los dominios actuales.
6. Abrir Facturación y comprobar ambiente `homologation`, emisor y punto 1. La configuración visible verifica el perfil, no certifica la autenticación contra ARCA; eso se comprueba al procesar el comprobante.

## 3. Secuencia funcional

1. Preparar un cliente de prueba con CUIT válido, razón social, domicilio y condición de IVA compatible con factura A. No inventar un CUIT al azar. Activar Requiere factura y verificar que una nueva venta sugiera Emitir factura: Sí.
2. Crear una venta pequeña con stock disponible, por ejemplo neto $100: revisar IVA $21 y total $121. Editar una descripción en el preview y verificarla antes de confirmar.
3. Confirmar que el modal avise que se emitirá factura. Registrar una sola vez. El worker busca nuevas solicitudes cada 15 segundos; el tiempo total depende de ARCA. Refrescar Facturación para consultar el resultado.
4. Verificar estado autorizado, CAE, numeración y descarga del PDF. Debe identificar homologación / sin validez fiscal y conservar la descripción editada. Confirmar importes en venta y cuenta corriente.
5. Si queda pendiente, consultar error/historial. Las fallas transitorias reintentan cada 15 minutos sin límite. Si ARCA rechaza los datos o el punto, corregir la causa; no crear ventas duplicadas. No cambiar a producción para resolver un error de pruebas.
6. Desde la factura autorizada, emitir NC total con motivo «Prueba de homologación» y efecto «Anular la venta». Verificar autorización, PDF y asociación a factura original. Debe reducir la deuda; conserva cobros como saldo a favor y no devuelve stock automáticamente.
7. Crear otra venta con Emitir factura: No y confirmar que conserva el circuito de remito sin solicitud fiscal. Comprobar también que se puede cambiar la preferencia sugerida del cliente antes de registrar.
8. Redesplegar y comprobar que siguen disponibles los PDF ya emitidos. El caché WSAA actual es en memoria: los reinicios requieren autenticación y pueden provocar una espera si ARCA aún considera activo el ticket previo. Evitar reinicios repetidos durante la primera emisión.

## Validación local de la adaptación PEM

Las pruebas de `FiscalCredentialsTests` usan certificados temporales y un transporte HTTP simulado: verifican firma CMS, rechazo de claves incompatibles, pares incompletos, aislamiento por ambiente/emisor y compatibilidad con archivos. No emiten ni contactan ARCA. La validación previa de credenciales reales fue de solo lectura; el circuito completo en Railway queda pendiente.
