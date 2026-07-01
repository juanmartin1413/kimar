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
| `AllowedOrigins__0` | URL del frontend Next.js en Railway |

### 4. Primer deploy
Al arrancar, la API:
1. Ejecuta `db.Database.Migrate()` → aplica la migración inicial
2. Ejecuta `SeedData.InitializeAsync()` → carga datos iniciales (si la DB está vacía)

### 5. Verificar
- `GET https://tu-api.railway.app/health` → `{"status":"ok"}`
- `GET https://tu-api.railway.app/swagger` → Swagger UI
- `POST /auth/login` con `{"email":"marcos.monclus@kimarcompany.com.ar","password":"kimar123"}`

### Contraseñas iniciales
Todos los usuarios tienen contraseña `Lango2026*`. Cambiarlas después del primer login.

### CORS
Actualizar `AllowedOrigins__0` con la URL real del frontend una vez deployado.
