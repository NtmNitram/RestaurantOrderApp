# Contexto del Proyecto — RestaurantOrderApp

> Archivo de referencia para sesiones de desarrollo con Claude.
> No modificar manualmente.
> Última actualización: 2026-07-04

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

### Fase 1 — Primer cliente activo (El Arca de Adán) 🟡

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
| **Sentry** (captura de excepciones no manejadas) | ✅ |
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

- [x] **Claim `featureFlags` en JWT** — backend ya lo emite; fix en frontend: `parseFeatureFlags` ahora parsea el claim como string antes de leerlo como objeto. Link en Layout.tsx a `/menu-dia` también agregado condicionado a `featureFlags.packageOptions`.
- [ ] **Activar PackageOptions para El Arca de Adán**: `UPDATE "Restaurants" SET "FeatureFlags" = '{"packageOptions": true}' WHERE "Name" = 'El Arca de Adán'`
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

**Paquetes** `api/packages`
- Lectura (`GET /`, `GET /{id}`, `GET /options/availability`): cualquier rol autenticado
- Escritura (POST/PUT/DELETE, incluyendo grupos y opciones, y `PUT /options/availability`): **solo Administrador**
- `GET /` — todos los paquetes con grupos y opciones
- `GET /{id}` — paquete por ID
- `POST /` — crear paquete **(Administrador)**
- `PUT /{id}` — actualizar paquete **(Administrador)**
- `DELETE /{id}` — soft delete (falla si tiene pedidos activos) **(Administrador)**
- `POST /{id}/groups` — agregar grupo **(Administrador)**
- `PUT /groups/{groupId}` — actualizar grupo **(Administrador)**
- `DELETE /groups/{groupId}` — eliminar grupo (falla si tiene opciones activas) **(Administrador)**
- `POST /groups/{groupId}/options` — agregar opción **(Administrador)**
- `PUT /options/{optionId}` — actualizar opción **(Administrador)**
- `DELETE /options/{optionId}` — soft delete opción **(Administrador)**
- `GET /options/availability` — pantalla menú del día (opciones con IsDailyRotating=true)
- `PUT /options/availability` — actualizar IsAvailableToday en lote **(Administrador)**

**Órdenes** `api/orders`
- `GET /` — pedidos del día — roles: Administrador, Empleado, Cocina
- `GET /?date=YYYY-MM-DD` — pedidos de una fecha específica (ventana UTC-6)
- `POST /` — crear pedido `{ clienteId, notas?, articulos: [{articuloId, cantidad, notas?}] }`. Rechaza con `422` si algún artículo tiene `ItemKind = "Package"` — los paquetes solo se agregan vía `POST /{orderId}/details` (requiere `orderId` existente, ver flujo mesero).
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

### Swagger
- Disponible en la raíz del dominio (`RoutePrefix = ""`) — no en `/swagger`.
- JWT Bearer configurado en Swagger UI: botón "Authorize", pegar el access token (sin prefijo `Bearer`, lo agrega Swagger automáticamente).

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

> **Nota:** `Cors__AllowedOrigins__0` debe coincidir EXACTAMENTE con el dominio fijo del frontend (incluyendo `https://`, sin slash final). Verificar tras cualquier copy/paste — un typo aquí causa fallos de CORS difíciles de diagnosticar porque el navegador no siempre distingue claramente el error en Network, solo en Console.

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
- **Guardrail:** `POST /api/orders` rechaza con `422` cualquier artículo con `ItemKind = "Package"` — evita paquetes mal formados sin selecciones. Los paquetes solo se agregan después de creado el pedido vía `POST /{orderId}/details`.
- **Bug resuelto (Fase 1) — paquetes invisibles para Empleado:** `PackagesController` tenía `[Authorize(Roles = "Administrador")]` a nivel de clase, bloqueando también la lectura. Un Empleado no podía ver ni configurar corridos al tomar pedidos — el ítem se mostraba como à la carte normal y el submit fallaba con 422 en silencio. Fix: el atributo de rol se movió de la clase a cada método de escritura individualmente; los GET quedan abiertos a cualquier rol autenticado.
- **Aviso de error en NewOrderPage:** si `GET /api/packages` falla por cualquier razón, se muestra un aviso inline (no bloqueante) y el mesero puede seguir tomando pedidos à la carte con normalidad.
- **Bug resuelto — CORS en staging:** `Cors__AllowedOrigins__0` tenía un typo (`ttps://` en vez de `https://`), causando que todas las peticiones del frontend de staging fallaran con CORS error. Regla: siempre verificar el valor completo de las variables de entorno carácter por carácter, especialmente tras copiar/pegar.
- **Toggle mostrar/ocultar contraseña en LoginPage:** botón de ojo en el campo de contraseña para verificar que se está escribiendo correctamente, especialmente útil en sesiones largas sin login donde es fácil perder de vista qué se está tecleando.

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

---

## Sesión 2026-06-20 — Guardrail de pedidos y Swagger

### Guardrail — paquetes en creación de pedido
`POST /api/orders` ahora rechaza con `422` si algún artículo enviado tiene `ItemKind = "Package"`.
Los paquetes requieren selecciones (`OrderDetailSelection`) y solo pueden agregarse a un pedido
ya existente vía `POST /{orderId}/details` — ver [Endpoints del backend](#endpoints-del-backend)
y [Módulo PackageOptions](#módulo-packageoptions-completado-2026-06-12).

### Swagger UI
- Configurado JWT Bearer en Swagger: botón "Authorize" acepta el access token directamente.
- `RoutePrefix = ""` — Swagger UI vive en la raíz del dominio del backend, no en `/swagger`.

---

## Módulo PackageOptions — actualización 2026-06-23

**Flujo mesero (actualizado):** los paquetes ahora se pueden configurar en DOS puntos:
1. **NewOrderPage** (`/nuevo-pedido/:clientId`) — al crear el pedido desde cero. Cada
   paquete configurado es una entrada independiente en estado local
   (`configuredPackages`), separada del carrito à la carte (`Record<number, number>`).
   N corridos = N entradas (no se usa `quantity` > 1 para paquetes).
2. **OrdersPage → Agregar artículos** — flujo legado, para agregar un paquete a un
   pedido ya existente (`PackageSelectionModal`, requiere `orderId`).

Ambos comparten el mismo componente de selección de grupos/opciones:
`src/components/orders/PackageSelectionForm.tsx` — UI pura (selección,
validación Min/Max, filtro `isAvailableToday`, toggle "Para llevar", nota),
sin conocimiento de API ni de `orderId`. Recibe `onConfirm`/`onCancel` y los
props opcionales `isSubmitting`/`error` para que el llamador refleje el estado
de su propia mutación.
- `PackageSelectionModal.tsx` envuelve el form con la mutación `addOrderDetail`
  (flujo legado, requiere `orderId` existente).
- `NewOrderPage.tsx` envuelve el form sin mutación — solo acumula la entrada en
  `configuredPackages` (estado local), hasta el submit del pedido completo.

**Total estimado vs. autoritativo:** en `NewOrderPage`, el total mostrado
(`totalEstimado = aLaCarteTotal + paquetesTotal`) es un cálculo de frontend
(suma de precios base + `extraPrice` de las opciones elegidas) y se etiqueta
explícitamente como "Total estimado" — nunca como "Total" a secas. El total
real lo calcula el backend (`SUM(OrderDetail.Subtotal)`) y viene en la
respuesta de `POST /api/orders`; el frontend no lo muestra como definitivo
porque tras crear el pedido navega directo a `/pedidos`.

**Payload unificado:** `POST /api/orders` ahora puede incluir, en el mismo
array `articulos`, ítems à la carte (`{articuloId, cantidad}`) y paquetes
(`{articuloId, cantidad: 1, isToGo, notas, selecciones}`) en una sola llamada
a `createOrder`. Mismo casing (camelCase) que el resto del payload — no hay
transformación de Axios, el backend de .NET hace bind case-insensitive.

`CreateOrderDetailDto` (en `types/index.ts`) ahora tiene `notas?`, `isToGo?`,
`selecciones?: SelectionRequest[]` opcionales — compatible con el payload
viejo de solo à la carte.

---

## Fix cocina — selecciones visibles y resaltado de pedido reciente (2026-06-24)

### Selecciones en pantalla de cocina
- OrderRepository.GetAllAsync y GetByIdWithDetailsAsync ahora incluyen
  .Include(o => o.OrderDetails).ThenInclude(d => d.Selections)
  .ThenInclude(s => s.PackageGroup) — necesario porque no hay lazy loading.
- OrderDetailResponseDto extendido con Selections opcional (get; init).
- MapToResponse mapea snapshots reales; à la carte queda null.
- Frontend (OrderCard/buildKitchenLabel) ya estaba listo — sin cambios.

### Resaltado de pedido más reciente por cliente en cocina
- CocinaPage calcula latestByClient (Set<number>) con reduce en un paso
  (acumula {order, count}); solo marca isLatest cuando count >= 2.
- OrderCard acepta isLatest?: boolean; intercambia set completo de clases
  bg/border (bg-yellow-900/10 border-yellow-500/60 vs bg-gray-800
  border-gray-700) para evitar conflicto de utilidades bg-* en Tailwind.

---

## Convenciones de desarrollo — guardrails de proceso (2026-07-03)

- **Gate de merge a `main`:** la CI (`.github/workflows/tests.yml` en el repo backend) debe estar verde antes de mergear cualquier rama a `main`. El workflow corre automáticamente en push/PR a `main`, `staging` y `feat/*`.
- **Excepción de naming en DB:** las tablas `PackageGroups` y `PackageOptions` están en singular en la migración original (inconsistencia con el resto que está en plural). Al escribir SQL manual en Railway usar el nombre tal como aparece — verificar con `\dt` antes de asumir.
- **Flags de grupo de paquete:** `isCountingGroup` y `allowExtra` están expuestos en `PackageGroupDto` (backend) y en el tipo `PackageGroupDto` del frontend. Toda validación de paquetes —tanto en `BuildPackageOrderDetailAsync` como en `PackageSelectionForm`— debe usar estos flags como fuente de verdad, no `minSelections` de forma cruda. `minSelections`/`maxSelections` solo aplican a grupos que no tienen ninguno de los dos flags (R5).
- **Validación espejo frontend/backend:** `PackageSelectionForm.isValid` implementa exactamente las mismas reglas R1-R5 que el backend. Si se modifican las reglas en uno, actualizar el otro en la misma sesión para mantener paridad.
- **Patrón BackgroundService con DB:** usar `IServiceScopeFactory.CreateScope()` para obtener `AppDbContext` dentro de un `BackgroundService` (singleton). El service worker no tiene request de tenant — usar `IgnoreQueryFilters()` y documentarlo con comentario explicando por qué.
- **Jobs de sistema vs. queries de tenant:** cualquier operación que deba afectar TODOS los tenants (reseteos automáticos, limpiezas programadas) DEBE usar `IgnoreQueryFilters()` porque el filtro global de `RestaurantId` bloquearía todos los registros sin un JWT activo.
- **`DisponibleHoy` en `CreatePackageOptionDto`:** campo opcional (`bool DisponibleHoy = false`) que permite crear una opción rotativa ya activa en el mismo paso. El constructor de `PackageOption` sigue derivando `IsAvailableToday = !isDailyRotating`; el service llama `SetAvailabilityToday(true)` después si ambos flags están activos.
- **Flex + truncate en Tailwind:** para que `truncate` funcione dentro de un flex anidado, TANTO el flex container inner COMO el elemento con `truncate` necesitan `min-w-0`. Sin `min-w-0`, `min-width: auto` (default de flex) impide el truncado. Patrón correcto: `<div class="flex ... min-w-0"><p class="truncate min-w-0">`.
- **Headers de caché para Service Worker en Vercel:** `sw.js` y `workbox-*.js` deben servirse con `Cache-Control: no-cache, no-store, must-revalidate` para que `autoUpdate` detecte nuevas versiones en cada deploy. Los assets en `/assets/*` pueden usar `immutable` (1 año) porque Vite los versiona por hash. Configurado en `vercel.json` + `cleanupOutdatedCaches: true` en `vite.config.ts`.
