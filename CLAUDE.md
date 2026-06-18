# Contexto del Proyecto — RestaurantOrderApp

> Archivo de referencia para sesiones de desarrollo con Claude.
> No modificar manualmente.
> Última actualización: 2026-06-17

---

## Documentos de referencia del proyecto

Los siguientes archivos viven en `RestaurantOrderAPI/` (repo del backend) y son la fuente de verdad para arquitectura, schema y estado del proyecto:

| Archivo | Contenido |
|---|---|
| `ARCHITECTURE.md` | Stack, capas, multi-tenancy, auth, rutas, deploy, decisiones negativas |
| `SCHEMA.md` | Tablas, campos, índices, migraciones aplicadas |
| `BACKLOG.md` | Pendientes actuales, done, notas de sesión |
| `ROADMAP.md` | Estado por fase con checkboxes |
| `CONVENTIONS.md` | Naming, patrones de código, convenciones EF Core y React Query |
| `ADR-001-to-005.md` | Decisiones de arquitectura documentadas |
| `PROMPTS.md` | Templates para iniciar sesiones de Claude Code |

---

## Descripción del negocio

Restaurante de alta demanda ubicado **dentro de una plaza de mercado en CDMX**.
Dos flujos de venta:
1. **Ventas externas:** un vendedor sale a ofrecer productos a negocios del sector. Entrega durante el día y cobra al cierre.
2. **Mesas internas:** meseros toman pedidos en mesa desde celular/tableta. El cliente puede pedir más durante la atención.

También maneja **domicilios** para clientes frecuentes que llaman por teléfono.

**Nombre del restaurante:** El Arca de Adán

**Problema que resuelve la app:** eliminar error humano en toma de pedidos, entregas, cobro y recuperación de vajilla.

---

## Arquitectura general

| Capa | Tecnología | Ruta |
|---|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS | `C:\Users\Martin\Desktop\repos\RestaurantOrderApp` |
| Backend | .NET 10 (Clean Architecture) + **PostgreSQL** | `C:\Users\Martin\Desktop\repos\RestaurantOrderAPI` |

### Backend — capas

```
RestaurantOrderAPI/src/
├── Domain/         Entidades + interfaces + enums + servicios de dominio
├── Application/    DTOs + servicios + interfaces
├── Infrastructure/ AppDbContext + repositorios + DbSeeder + Migrations
└── API/            Controllers + middleware + Program.cs + Services (CurrentRestaurantService, CurrentUserService)
```

- Base de datos: **PostgreSQL** con migraciones EF Core (`dotnet ef database update`).
  Driver: `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1` en Infrastructure y API.
- Multi-tenancy: entidad `Restaurant` con `RestaurantId` en Client, MenuItem, Order, User.
  EF Core global query filters fusionan `RestaurantId + !IsDeleted` en **una sola** llamada a `HasQueryFilter`.
  `ICurrentRestaurantService` lee el `restaurantId` del JWT (`CurrentRestaurantService`).
  Login usa `IgnoreQueryFilters()` porque el restaurantId aún no se conoce.
  **Todo servicio que crea entidades con `RestaurantId` DEBE inyectar `ICurrentRestaurantService`** — omitirlo produce RestaurantId vacío y FK violation HTTP 500.
  Servicios verificados: `OrderService`, `MenuItemService`, `ClientService`, `TablewareService`, `PackageService`.
- Autenticación: **JWT Bearer Token** (access token en memoria, 15 min) + **Refresh Token** (cookie httpOnly, 7 días, rotación en cada uso).
- Claims en JWT: `sub` (userId), `name` (username), `role`, `restaurantId`, `featureFlags` (JSON del tenant).
- Roles actuales: `"Administrador"`, `"Empleado"`, `"Cocina"` (credenciales semilla: admin/admin123, empleado/empleado123, cocina/cocina123).
  El rol `"Cocina"` solo puede acceder a `GET /api/orders` y marcar Entregado — login dedicado en `/cocina`.
  Roles Fase 2: + `"Cajera"` (solo ve pedidos Delivered+PendienteCobro, marca Cobrado).
- CORS: `WithOrigins(allowedOrigins)` + `AllowCredentials()`. Orígenes configurados en `appsettings.json` (`Cors:AllowedOrigins`).
- Fechas: usar siempre `DateTime.UtcNow` — PostgreSQL/Npgsql rechaza `DateTime.Now` (hora local). Toda fecha que entre al repositorio como parámetro de query debe tener `Kind = Utc` explícito.

### Configuración local

- `appsettings.json` → placeholders seguros, commiteado en git.
- `appsettings.Development.json` → password real y JWT key, **gitignoreado**, solo en máquina local.
- `.env` en raíz del frontend: `VITE_API_URL=http://localhost:5288/api`

---

## Estado del proyecto — Fase actual

### Fase 0 — Seguridad crítica (🟡 casi completa)

| Item | Estado |
|---|---|
| CORS restringido (`WithOrigins` + `AllowCredentials`) | ✅ |
| Refresh Token Rotation (tabla `RefreshTokens`, rotación, detección de robo) | ✅ |
| Access token en memoria (`tokenStore.ts`) — no localStorage | ✅ |
| Interceptor Axios con retry en 401 vía `/Auth/refresh` | ✅ |
| Auto-refresh silencioso en mount de `AuthContext` | ✅ |
| `isInitializing` gate en `ProtectedRoute` y `CocinaPage` | ✅ |
| `UseForwardedHeaders()` como primer middleware (Railway proxy) | ✅ |
| Cookie `SameSite=None; Secure` en HTTPS cross-site (Vercel→Railway) | ✅ |
| Serilog + Health check `/health` | ✅ |
| AuditLog + `AuditInterceptor` | ✅ |
| Soft delete universal (`ISoftDeletable`) | ✅ |
| Índices compuestos (`RestaurantId` como primera columna) | ✅ |
| Decimal precision `HasPrecision(10,2)` | ✅ |
| Backup diario Backblaze B2 (GitHub Actions) | ✅ |
| Secrets en Railway — nunca en repo | ✅ |
| **Rate limiting** (login: 5 req/min por IP) | ✅ |
| **Sentry** (captura de excepciones no manejadas) | ❌ pendiente |
| **UptimeRobot** (ping a `/health` cada 5 min) | ❌ pendiente |
| Tests de integración multi-tenant (5+ casos) | ❌ pendiente |
| Entorno de staging en Railway separado | ❌ pendiente |
| Penetration test manual (IDOR, cross-tenant, brute force) | ❌ pendiente |
| Alta SAT (RESICO) + contrato + aviso de privacidad | ❌ pendiente (cliente) |

---

## Módulo 1 — Estado actual (al 2026-06-12)

### Funcionalidades implementadas

| Feature | Frontend | Backend |
|---|---|---|
| Login + roles | ✅ | ✅ |
| Clientes: pestañas Mesas / Clientes | ✅ | — |
| Mesas 1–11 creadas automáticamente (seeder) | — | ✅ |
| Buscador de clientes por nombre, teléfono, referencia | ✅ | — |
| Crear cliente Externo (referencia opcional) | ✅ | ✅ |
| Crear cliente Domicilio (dirección + teléfono obligatorios) | ✅ | ✅ |
| Eliminar cliente (confirmación inline) | ✅ | ✅ |
| Toma de pedido por cliente o mesa | ✅ | ✅ |
| Buscador de platillos en pantalla "Nuevo pedido" | ✅ | — |
| Agregar artículos a pedido (Pendiente o Entregado+PendienteCobro) | ✅ | ✅ |
| Reactivar pedido Delivered → Pending al agregar artículos | — | ✅ |
| Buscador de platillos en modal "Agregar al pedido" | ✅ | — |
| Listado de pedidos del día con buscador | ✅ | ✅ |
| Marcar pedido Cancelado | ✅ | ✅ |
| Estado de cobro por pedido (Cobrar → Cobrado) | ✅ | ✅ |
| Pestaña "Pendientes" = sin cobrar (no cancelados) | ✅ | ✅ |
| Badge del navbar refleja pendientes de cobro | ✅ | — |
| Resumen diario con Por cobrar y Cobrado (global y por cliente) | ✅ | ✅ |
| CRUD de menú completo (solo Administrador) | ✅ | ✅ |
| Control de vajilla: registrar al entregar (modal en OrdersPage) | ✅ | ✅ |
| Control de vajilla: lista de pendientes + recuperación inline | ✅ | ✅ |
| Recuperación de vajilla restringida a Administrador | ✅ | ✅ |
| Badge del navbar refleja vajilla pendiente de recuperar | ✅ | — |
| Navbar muestra solo el rol (no el username) | ✅ | — |
| Pantalla de cocina — polling 15s, flash + beep al llegar pedidos | ✅ | ✅ |
| Login dedicado para rol Cocina en /cocina | ✅ | ✅ |
| Hora de creación por artículo en pantalla de cocina (CreatedAt) | ✅ | ✅ |
| Eliminar artículo de pedido PendienteCobro (botón X en OrdersPage) | ✅ | ✅ |
| Nota por artículo (Notes en OrderDetail) | ✅ | ✅ |
| Filtro de fechas en OrdersPage (Desde/Hasta, default hoy MX) | ✅ | ✅ |
| Polling automático en OrdersPage para Empleado (10s) | ✅ | — |
| Rol Empleado restringido en ClientsPage (solo mesas) | ✅ | — |
| Cocina marca pedido como Entregado (confirmación inline) | ✅ | ✅ |
| Botón Entregar eliminado de OrdersPage (solo Cocina entrega) | ✅ | — |
| Vajilla acumula QuantityDelivered si ya existe registro (re-entrega) | — | ✅ |
| Paquetes con opciones dinámicas — CRUD admin | ✅ | ✅ |
| Paquetes — flujo mesero (PackageSelectionModal, AddItemsModal) | ✅ | ✅ |
| Paquetes — menú del día (/menu-dia, DailyMenuPage) | ✅ | ✅ |
| Paquetes — cocina muestra opciones seleccionadas (feature flag) | ✅ | ✅ |
| Campo IsToGo en OrderDetail (para llevar, por artículo) | ✅ | ✅ |
| ToGoSurcharge en MenuItem y formulario de menú | ✅ | ✅ |
| FeatureFlags JSONB en Restaurant | — | ✅ |
| featureFlags en AuthContext (parseado del JWT) | ✅ | — |

### Pendiente de implementar

- [ ] **Claim `featureFlags` en JWT** — backend debe leer `Restaurant.FeatureFlags` y emitirlo en el token al hacer login/refresh. Sin esto el flag siempre es `false` aunque la BD esté actualizada.
- [ ] **Activar PackageOptions para El Arca de Adán** (después del claim): `UPDATE "Restaurant" SET "FeatureFlags" = '{"packageOptions": true}' WHERE "Name" = 'El Arca de Adán'`
- [ ] **DeliveryRound** — entidad, estados Open/Closed, FK nullable en Order (solo Externo)
- [ ] Pantalla del vendedor: lista de pedidos de ronda activa, cobro + recuperación en batch
- [ ] Cierre de ronda con validación de pedidos sin cobrar
- [ ] Reporte diario por vendedor y por platillo
- [ ] PWA: manifest.json, ícono, splash, `display: standalone`
- [ ] Rol "Cajera" (Fase 2)

---

## Flujo de estados del pedido

```
Toma de pedido → Status: Pending, PaymentStatus: PendienteCobro
     ↓ (se pueden agregar más artículos mientras PaymentStatus == PendienteCobro)
Cocina marca Entregado → Status: Delivered
     ↓ (si se agregan artículos desde Delivered → vuelve a Pending para que cocina lo vea)
Cobro al cierre → PaymentStatus: Cobrado
```

- `Status`: Pending → Delivered (solo Cocina) o Cancelled; Delivered → Cancelled.
- `PaymentStatus`: PendienteCobro → Cobrado. No aplica a Cancelados.
- "Pendientes" en la app = `estadoCobro !== 'Cobrado' && estado !== 'Cancelado'`.
- `Order.Total` siempre se recalcula como `SUM(OrderDetail.Subtotal)` — nunca como incremento.

---

## Modelo de datos principal

### Client
```
Id, Name, Tipo ("Externo"|"Domicilio"|"Mesa"),
LocalNumber? (campo legacy, ya no se usa),
Referencia?, PhoneNumber?,
DireccionEntrega?, ReferenciaDomicilio?, IsActive,
IsDeleted, DeletedAt, RestaurantId
```

### MenuItem
```
Id, Name, Description?, Price decimal(10,2),
IsAvailable, IsDeleted, DeletedAt,
ItemKind ("ALaCarta"|"Package"), ToGoSurcharge decimal(10,2),
RestaurantId
```

### PackageGroup
```
Id (Guid, app-generated), MenuItemId, RestaurantId,
Name, SortOrder, MinSelections, MaxSelections, AllowExtra
```

### PackageOption
```
Id (Guid, app-generated), PackageGroupId, RestaurantId,
Name, ExtraPrice decimal(10,2),
IsDailyRotating, IsAvailableToday,
IsDeleted, DeletedAt
```

### Order
```
Id, ClientId, RestaurantId, OrderDate (UTC),
Status (Pending/Delivered/Cancelled),
PaymentStatus (PendienteCobro/Cobrado),
Notes?, Total decimal(10,2),
IsDeleted, DeletedAt,
DeliveryRoundId? (nullable — solo Externo)
→ OrderDetails
```

### OrderDetail
```
Id, OrderId, MenuItemId,
Quantity, UnitPrice decimal(10,2), Subtotal decimal(10,2),
Notes VARCHAR(300)?,
IsToGo bool (default false),
CreatedAt TIMESTAMPTZ (DEFAULT now())
→ OrderDetailSelections (solo paquetes)
```

### OrderDetailSelection
```
Id (Guid, app-generated), OrderDetailId, PackageOptionId,
OptionNameSnapshot VARCHAR(200),   ← congelado al crear pedido
ExtraPriceSnapshot decimal(10,2)   ← congelado al crear pedido
```

### OrderTableware
```
Id, OrderId, RestaurantId,
ItemType (default "Plato"),
QuantityDelivered, QuantityRecovered?,
DeliveredAt (UTC), RecoveredAt? (UTC)
→ Order (nav. property)
```
- Solo aplica a pedidos de clientes tipo `Externo`.
- Un pedido tiene máximo un registro de vajilla.
- La recuperación es acumulativa (`QuantityRecovered` se suma en cada llamada a `/recover`).
- `Pendiente` = `QuantityDelivered - (QuantityRecovered ?? 0)`.

### User
```
Id, Username, PasswordHash, Role, RestaurantId
```

### Restaurant
```
Id, Name, IsActive, FeatureFlags JSONB (default '{}')
```

---

## Rutas del frontend

| Ruta | Página | Rol requerido |
|---|---|---|
| `/login` | LoginPage | — |
| `/cocina` | CocinaPage | Rol Cocina (login propio) |
| `/clientes` | ClientsPage | Cualquiera autenticado |
| `/nuevo-pedido/:clientId` | NewOrderPage | Cualquiera autenticado |
| `/pedidos` | OrdersPage | Cualquiera autenticado |
| `/vajilla` | VajillaPage | Cualquiera autenticado |
| `/menu` | MenuPage | Solo Administrador |
| `/menu-dia` | DailyMenuPage | Solo Administrador |
| `/resumen` | DailySummaryPage | Solo Administrador |

---

## Endpoints del backend

**Clientes** `api/clients`
- `GET /` — todos los clientes
- `GET /{id}` — por ID
- `POST /` — crear `{ nombre, tipo, referencia?, telefono?, direccionEntrega?, referenciaDomicilio? }`
- `PUT /{id}` — actualizar
- `DELETE /{id}` — soft delete

**Menú** `api/menuitems`
- `GET /` — todos los platillos (autenticado)
- `GET /available` — solo disponibles
- `GET /{id}` — por ID
- `POST /` — crear `{ nombre, descripcion?, precio, itemKind?, toGoSurcharge? }` **(solo Administrador)**
- `PUT /{id}` — actualizar **(solo Administrador)**
- `DELETE /{id}` — soft delete **(solo Administrador)**

**Paquetes** `api/packages` **(solo Administrador)**
- `GET /` — todos los paquetes con grupos y opciones
- `GET /{id}` — paquete por ID
- `POST /` — crear paquete
- `PUT /{id}` — actualizar paquete
- `DELETE /{id}` — soft delete (falla si tiene pedidos activos)
- `POST /{id}/groups` — agregar grupo
- `PUT /groups/{groupId}` — actualizar grupo
- `DELETE /groups/{groupId}` — eliminar grupo (falla si tiene opciones activas)
- `POST /groups/{groupId}/options` — agregar opción
- `PUT /options/{optionId}` — actualizar opción
- `DELETE /options/{optionId}` — soft delete opción
- `GET /options/availability` — pantalla menú del día (opciones con IsDailyRotating=true)
- `PUT /options/availability` — actualizar IsAvailableToday en lote

**Órdenes** `api/orders`
- `GET /` — pedidos del día — roles: Administrador, Empleado, Cocina
- `GET /?date=YYYY-MM-DD` — pedidos de una fecha específica (ventana UTC-6)
- `POST /` — crear pedido `{ clienteId, notas?, articulos: [{articuloId, cantidad, notas?}] }`
- `POST /{id}/items` — agregar artículos ALaCarta en lote (válido mientras PendienteCobro)
- `POST /{orderId}/details` — agregar artículo individual con selecciones de paquete `{ menuItemId, quantity, isToGo, notas?, selections: [{packageOptionId}] }`
- `DELETE /{orderId}/items/{itemId}` — eliminar artículo (mínimo 1 artículo, PendienteCobro) **(Administrador/Empleado)**
- `PATCH /{id}/status` — cambiar estado entrega `{ estado: 0|1|2 }`
- `PATCH /{id}/payment-status` — cambiar estado cobro `{ estadoCobro: 0|1 }`
- `GET /summary/daily` — resumen diario **(solo Administrador)**

**Vajilla** `api/tableware`
- `GET /pending` — vajilla pendiente de recuperar
- `GET /order/{orderId}` — vajilla de un pedido específico
- `POST /` — registrar vajilla entregada `{ orderId, itemType, quantityDelivered }`
- `PATCH /order/{orderId}/recover` — registrar recuperación `{ quantityRecovered }` **(solo Administrador)**

**Auth** `api/auth`
- `POST /login` — `{ username, password }` → `{ token, role, username, restaurantId }` + cookie httpOnly
- `POST /refresh` — usa cookie → `{ token, role, username, restaurantId }` + nueva cookie (rotación)
- `POST /logout` — revoca el refresh token y elimina la cookie

---

## Resumen diario — estructura de respuesta

```
DailySummaryDto {
  fecha, totalPedidos,
  totalGeneral,   ← todos (cobrado + por cobrar)
  totalCobrado,
  clientes: [
    ClientDailySummaryDto {
      clienteId, nombreCliente, tipo, referencia,
      totalACobrar,   ← pendiente de cobro del cliente
      totalCobrado,   ← ya pagado por el cliente
      pedidos: [ OrderSummaryItemDto { ..., estadoCobro } ]
    }
  ]
}
```

---

## Deploy

| Capa | Plataforma | Estado |
|---|---|---|
| Frontend | Vercel | ✅ — `vercel.json` con rewrites para React Router |
| Backend | Railway | ✅ — Dockerfile en raíz, variables de entorno configuradas |
| Base de datos | Railway PostgreSQL | ✅ — Hobby plan, `MigrateAsync` + seeder al arrancar |
| Backups | Backblaze B2 + GitHub Actions | ✅ — diario 9 AM UTC (3 AM CDMX), retención 30 días |

### Variables de entorno en Railway (backend)
| Variable | Descripción |
|---|---|
| `ConnectionStrings__DefaultConnection` | Connection string Npgsql de PostgreSQL en Railway |
| `Jwt__Key` | Clave secreta para firmar JWT |
| `Jwt__Issuer` | `RestaurantOrderAPI` |
| `Jwt__Audience` | `RestaurantOrderApp` |
| `Cors__AllowedOrigins__0` | URL del frontend en Vercel |

### Arranque en Railway
1. Docker build con `Dockerfile` en raíz
2. `await db.Database.MigrateAsync()` — aplica migraciones pendientes
3. `await DbSeeder.SeedAsync(db)` — crea/sincroniza restaurante, usuarios y menú si no existen
   - El seeder sincroniza `PasswordHash` y `Role` en cada arranque — útil para resetear passwords sin tocar la BD

### Backup automático
- Schedule: `cron '0 9 * * *'` (9 AM UTC = 3 AM CDMX)
- `pg_dump $PGURL --no-password | gzip` con `PGSSLMODE=require`
- Sube a Backblaze B2 vía AWS CLI S3-compatible
- Fallo → crea GitHub Issue automático
- Para probar: Actions → Daily Database Backup → Run workflow

---

## Módulo PackageOptions (completado 2026-06-12)

Paquetes con opciones dinámicas (comida corrida, desayunos).

**Activar para El Arca de Adán** (requiere primero implementar claim featureFlags en JWT):
```sql
UPDATE "Restaurant"
SET "FeatureFlags" = '{"packageOptions": true}'
WHERE "Name" = 'El Arca de Adán';
```

**Desactivar (rollback inmediato sin redeploy):**
```sql
UPDATE "Restaurant"
SET "FeatureFlags" = '{}'
WHERE "Name" = 'El Arca de Adán';
```

**Flujo mesero:** Los paquetes se agregan desde OrdersPage → Agregar artículos,
no desde NewOrderPage (requieren orderId existente).

**Menú del día:** Admin configura opciones rotativas en /menu-dia cada mañana.
Opciones fijas (IsDailyRotating=false) siempre disponibles sin configuración.

---

## Decisiones técnicas relevantes

- `TotalACobrar` en resumen solo suma pedidos con `PaymentStatus = PendienteCobro`.
- `POST /orders/{id}/items` acumula cantidad si el artículo ya existe en el pedido. Validación usa `PaymentStatus != PendienteCobro` — permite agregar artículos a pedidos ya Entregados mientras no se hayan cobrado. Si el pedido estaba `Delivered`, vuelve a `Pending`.
- Las mesas no tienen botón eliminar en la UI — son fixtures permanentes.
- El seeder usa `IgnoreQueryFilters()` para no fallar durante el arranque.
- Buscadores de clientes, pedidos y platillos filtran en memoria (sin llamadas extra al backend).
- Precios: `decimal` con `HasPrecision(10,2)` → `numeric(10,2)` en PostgreSQL.
- Rutas `/menu`, `/menu-dia` y `/resumen` protegidas con `<ProtectedRoute role="Administrador">` en frontend Y `[Authorize(Roles = "Administrador")]` en backend.
- Confirmación de eliminar es inline en la tarjeta (sin modal) — optimizado para móvil.
- `Order.Total` siempre se recalcula como `SUM(OrderDetail.Subtotal)` — **nunca como incremento**.
- Control de vajilla solo aplica a clientes tipo `Externo`.
- Access token JWT vive solo en memoria (`tokenStore.ts`) — elimina vector XSS de localStorage.
- `tokenStore` es un módulo puente (get/set/register) que evita import circular entre `client.ts` y `AuthContext.tsx`.
- `isAuthenticated` se basa en `role` (localStorage) para que el estado de sesión sobreviva reloads mientras el interceptor renueva el token silenciosamente.
- Refresh token: cookie `httpOnly; SameSite=None; Secure` (cross-site Vercel→Railway). Expira en 7 días. Rota en cada uso.
- `OrderResponseDto` incluye `TipoCliente` para que el frontend distinga pedidos Externo sin consulta adicional.
- **Regla crítica:** todo servicio que crea entidades con `RestaurantId` DEBE inyectar `ICurrentRestaurantService`. Verificado: `OrderService`, `MenuItemService`, `ClientService`, `TablewareService`, `PackageService`.
- Al marcar Entregado en `OrdersPage`: si `tipoCliente === 'Externo'` se abre modal de vajilla; para Mesa/Domicilio se entrega directamente. **Nota:** el botón Entregar fue eliminado de OrdersPage — ahora solo Cocina puede marcar Entregado.
- La recuperación de vajilla es acumulativa — se puede llamar varias veces hasta agotar `QuantityDelivered`.
- Roles renombrados 2026-05-21: `"Dueño"` → `"Administrador"`, `"Mesero"` → `"Empleado"`. El seeder detecta roles legacy y los migra automáticamente.
- **Bug resuelto 2026-05-22:** `GetDailySummaryAsync` usaba `startDate.Date` con `Kind = Unspecified`. Fix: `DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc)`. Regla: toda fecha en queries debe tener `Kind = Utc` explícito.
- Pantalla de cocina usa rol dedicado `"Cocina"` — nunca `[AllowAnonymous]`. La tableta hace login una vez; el refresh token dura 7 días.
- **Bug resuelto 2026-06-01 — refresh token en producción:** (1) `SameSite=Strict` bloqueaba cookie cross-site → fix: `SameSite=None` en HTTPS. (2) Railway reenvía HTTP al contenedor → `Request.IsHttps = false` → fix: `UseForwardedHeaders()` como primer middleware. (3) `RefreshTokenRepository` necesitaba `IgnoreQueryFilters()` en include de User. (4) Browser URL-codifica la cookie → fix: `Uri.UnescapeDataString()` antes del lookup. **Regla:** toda consulta sin JWT activo DEBE usar `IgnoreQueryFilters()`.
- **Bug resuelto 2026-06-03 — TS2769 en Vercel:** nunca pasar función con parámetros opcionales como `queryFn` directo — siempre envolver en arrow `() => getOrders()`.
- **Bug resuelto 2026-05-31 — resumen diario:** timezone UTC-6 fijo (`startDate.Date.AddHours(6)`) + carry-over Cobrado de los últimos 7 días.
- `PackageGroup.Id`, `PackageOption.Id`, `OrderDetailSelection.Id`: Guid con `ValueGeneratedNever()` — generado en app, no en BD.
- `OrderDetailSelection`: snapshots inmutables — `OptionNameSnapshot` y `ExtraPriceSnapshot` se congelan al crear el pedido y no se actualizan si cambia la opción después.
- EF Core FK-fixup: `order.OrderDetails.Add(detail)` + `detail.Selections.Add(sel)` → EF asigna `OrderDetailId` automáticamente después del INSERT del parent.
- **Regla:** no dos llamadas a `HasQueryFilter` sobre la misma entidad en EF Core — fusionar en una sola lambda.
- Query filters deben vivir en `AppDbContext.OnModelCreating` (no en las config classes) — la lambda captura `this._currentRestaurant` del DbContext para re-evaluación per-request.

---

## Sesión 2026-06-15 — Correcciones adicionales

### Fix Dockerfile — libgssapi-krb5-2
El contenedor Docker en Railway crasheaba con `Cannot load library libgssapi_krb5.so.2`.
Fix: agregar en el stage de runtime del Dockerfile:
```
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
```

### Regla crítica — Migraciones EF Core
**Nunca escribir `Designer.cs` de migraciones a mano.** El snapshot del modelo debe
ser generado por EF Core con `dotnet ef migrations add`. Un snapshot incorrecto causa
`PendingModelChangesWarning` al arrancar → crash del backend en producción.

### Nombre real de tablas en PostgreSQL
EF Core pluraliza los nombres de tabla. La tabla es `"Restaurants"` (no `"Restaurant"`),
`"Orders"` (no `"Order"`), etc. Usar siempre el nombre plural con comillas dobles en
queries manuales de Railway SQL Editor.

### Procedimiento para migraciones manuales en Railway
Si `MigrateAsync` no puede correr (backend crashea), aplicar manualmente:
1. `ALTER TABLE` en SQL Editor de Railway
2. `INSERT INTO "__EFMigrationsHistory"` con el MigrationId y ProductVersion correctos
3. Si se reemplaza una migración, hacer `DELETE` del registro viejo antes del `INSERT` nuevo
