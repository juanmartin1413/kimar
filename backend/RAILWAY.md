# Deploy KIMAR API en Railway

## Pasos

### 1. Crear servicio PostgreSQL en Railway
- En tu proyecto Railway → "Add Service" → "Database" → "PostgreSQL"
- Railway provee la variable `DATABASE_URL` automáticamente

### 2. Crear servicio para la API
- "Add Service" → "GitHub Repo"
- Seleccionar el repo, configurar **Root Directory**: `backend/KimarApi`
- Railway detecta el Dockerfile automáticamente

### 3. Variables de entorno del servicio `kimar-api`
Configurar en Railway → Service → Variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `${{kimar-db.DATABASE_URL}}` (referencia al servicio DB) |
| `JWT_SECRET` | Generar 64 chars aleatorios (Railway → Generate) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `AllowedOrigins__0` | `https://kimarcompany.com.ar` |
| `AllowedOrigins__1` | `https://www.kimarcompany.com.ar` |

### 4. Primer deploy
Al arrancar, la API:
1. Ejecuta `db.Database.Migrate()` → aplica la migración inicial
2. Ejecuta `SeedData.InitializeAsync()` → carga datos iniciales (si la DB está vacía)

La cartera inicial vigente es la planilla de 63 clientes del 26/11/2026, incluida
en `Data/Seed/clientes-2026-11-26.json`: Luciano 27, Marcos 24 y Manolo 12.
Incluye calle, altura y código postal separados. Los datos vacíos o `-` se
guardan como nulos; no se completan domicilios ni códigos postales por inferencia.

Para reiniciar el entorno de prueba con esta cartera, desplegar primero la versión
que contiene este seed y la migración `AddCodigoPostalCliente`, detener la API,
recrear la base de pruebas y reiniciar la API con `DATABASE_URL` apuntando a la
base nueva. El seed no reemplaza clientes en bases ya pobladas. La recreación
elimina los datos anteriores y vuelve a cargar también usuarios, productos y
proveedores iniciales.

### 5. Verificar
- `GET https://tu-api.railway.app/health` → `{"status":"ok"}`
- `GET https://tu-api.railway.app/swagger` → Swagger UI
- `POST /auth/login` con `{"email":"marcos.monclus@kimarcompany.com.ar","password":"kimar123"}`

### Contraseñas iniciales
Todos los usuarios tienen contraseña `Lango2026*`. Cambiarlas después del primer login.

### Volumen para adjuntos
Las fotos (comprobantes de compras y remitos firmados de entregas) se guardan en disco en `Storage:UploadsPath` (`wwwroot/uploads` → `/app/wwwroot/uploads` en el contenedor). El servicio de la API necesita un **Volume** de Railway montado en `/app/wwwroot/uploads`; sin él, los archivos se pierden en cada deploy.

### Usuarios operativos
Al arrancar, además del seed inicial, la API garantiza (idempotente) que existan `deposito@kimarcompany.com.ar` (Depósito) y `david@kimarcompany.com.ar` (David, Repartidor) con la contraseña inicial. Si la base ya tiene al repartidor con el email anterior (`repartidor1@kimarcompany.com.ar`), el seed lo renombra en lugar de crear uno nuevo.

### CORS
Configurar ambos dominios del frontend (`AllowedOrigins__0` y `AllowedOrigins__1`) en el servicio de la API. Los valores de entorno de Railway tienen prioridad sobre `appsettings.json`.
