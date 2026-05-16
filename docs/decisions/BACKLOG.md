# BACKLOG.md
> Actualizar en cada sesión. Mover ítems completados a DONE al final.
> Última actualización: 2026-05-15

---

## AHORA — Fase 0 (crítico antes del primer cliente)

### 🔴 Semana 1 — Seguridad crítica

**[BACKEND] Cerrar CORS**
- Reemplazar `AllowAnyOrigin` por política con `WithOrigins` desde config
- Variable de entorno: `Cors__AllowedOrigins` en Railway
- Archivos afectados: `Program.cs`

**[BACKEND] Refresh Token Rotation**
- Migración EF Core: tabla `RefreshTokens`
- Servicio `TokenService`: generar, validar, rotar, revocar
- Endpoint: `POST /auth/refresh` (lee cookie, devuelve nuevo access token)
- Endpoint: `POST /auth/logout` (revoca refresh token)
- Detección de robo: si token reemplazado se usa → revocar cadena entera
- Archivos nuevos: `RefreshToken.cs` (entity), `RefreshTokenConfiguration.cs`, `TokenService.cs`, `AuthController.cs` (ampliar)

**[FRONTEND] Access token en memoria**
- Sacar JWT de localStorage (si está ahí actualmente)
- `AuthContext.tsx`: guardar access token en variable de módulo o estado de context
- Axios interceptor: adjuntar token desde context, no desde localStorage
- Axios interceptor: si 401 → llamar `/auth/refresh` → reintentar request original

**[BACKEND] Rate limiting**
- Configurar `Microsoft.AspNetCore.RateLimiting` (ya incluido en .NET 8+)
- Política "login": 5 req/min por IP
- Política "api": token bucket global
- Aplicar en `Program.cs` y decorar `AuthController`

### 🔴 Semana 1-2 — Observabilidad

**[BACKEND] Logging estructurado**
- NuGet: `Serilog.AspNetCore`, `Serilog.Sinks.BetterStack` (o Axiom)
- Configurar en `Program.cs` con `UseSerilog()`
- Log mínimo: cada request (método, path, status, tiempo), cada excepción, cada acción de auditoría

**[BACKEND] Health check**
- NuGet: `AspNetCore.HealthChecks.NpgSql`
- Endpoint `/health` con check de PostgreSQL
- UptimeRobot: ping cada 5 min, alerta a WhatsApp/email si falla

**[INFRA] Sentry**
- Cuenta Sentry gratis
- NuGet: `Sentry.AspNetCore`
- Captura excepciones no manejadas, alertas a email

### 🔴 Semana 2 — Base de datos y auditoría

**[INFRA] Railway plan pagado**
- Subir al plan Hobby ($5-10/mes): elimina sleep del contenedor

**[INFRA] Backup automático**
- GitHub Action: schedule diario 3 AM CDMX
- `pg_dump` → comprimido → upload a Cloudflare R2 (free tier generoso)
- Retención: 30 archivos (30 días)
- Tarea obligatoria: probar restauración una vez antes de Fase 1

**[BACKEND] AuditLog**
- Migración EF Core: tabla `AuditLog`
- `AuditInterceptor : SaveChangesInterceptor`
- Capturar: creación de Order, cambio de Status, Cobrado, cancelación, cambio de menú
- Capturar: login fallido (en AuthController directamente)

**[BACKEND] Soft delete**
- Migración: agregar `IsDeleted`, `DeletedAt` a Client, MenuItem, Order
- Actualizar query filters en EF para incluir `!IsDeleted`
- Reemplazar cualquier `Remove()` por setter `IsDeleted = true`

**[BACKEND] Índices compuestos**
- Migración: agregar índices según SCHEMA.md
- Verificar `EXPLAIN ANALYZE` en queries principales post-migración

**[BACKEND] Decimal precision**
- Revisar todas las entidades con campos de precio
- Agregar `HasPrecision(10, 2)` en `OnModelCreating` o `IEntityTypeConfiguration`

### 🟡 Semana 3-4 — Tests y staging

**[BACKEND] Tests de aislamiento multi-tenant**
- Proyecto `IntegrationTests`
- Setup: crear 2 restaurantes de prueba con datos distintos
- Al menos 5 tests: Orders, Clients, MenuItems, Users, AuditLog
- Cada test verifica que tenant A recibe solo sus datos

**[INFRA] Entorno de staging**
- Segunda instancia Railway (mismo proyecto, service separado)
- Base de datos separada
- Variables de entorno de staging separadas
- Deploy automático desde rama `staging`

**[TEST] Penetration test manual**
- IDOR: pedir Order con ID de otro tenant
- Cross-tenant: login con tenant A, pedir datos de tenant B en el path
- Mass assignment: enviar `RestaurantId` diferente en body de request
- Brute force: verificar que rate limiting de login funciona

---

## SIGUIENTE — Fase 1 (El Arca de Adán en producción)

- [ ] Módulo control de vajilla (OrderTableware)
- [ ] Módulo cierre de ronda (DeliveryRound)
- [ ] Pantalla del vendedor para cobro + recuperación en batch
- [ ] Reportes: por vendedor, por platillo
- [ ] PWA: manifest, service worker básico, prueba en tableta real
- [ ] Endpoint `/admin/tenants` para provisioning manual
- [ ] Onboarding Arca de Adán: capacitación + documento de usuario

---

## MÁS ADELANTE — Fase 2

- [ ] Feature flags por tenant (FeatureFlags JSONB)
- [ ] Tipos de cliente parametrizables
- [ ] Modificadores de platillo
- [ ] Categorías de menú
- [ ] Impresión de comandas
- [ ] Manejo de inventario básico
- [ ] Portal de auto-registro + pago
- [ ] Asistente IA al dueño (resumen semanal)
- [ ] Evaluación Railway vs. Fly.io

---

## DONE ✅

*(vacío — primer registro de backlog)*

---

## Notas de sesión

### 2026-05-15
- Plan técnico completo generado (7 secciones + roadmap 3 fases)
- Documentos vivos creados: ARCHITECTURE.md, SCHEMA.md, CONVENTIONS.md, ROADMAP.md, BACKLOG.md
- Próximo paso: empezar con CORS + Refresh Token (Semana 1 de Fase 0)
