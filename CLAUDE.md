# Contexto del Proyecto — RestaurantOrderApp

> Archivo de referencia para sesiones de desarrollo con Claude.
> No modificar manualmente.

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
├── Domain/         Entidades + interfaces + enums
├── Application/    DTOs + servicios + interfaces
├── Infrastructure/ AppDbContext + repositorios + DbSeeder + Migrations
└── API/            Controllers + middleware + Program.cs
```

- Base de datos: **PostgreSQL** con migraciones EF Core (`dotnet ef database update`).
  Driver: `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1` en Infrastructure y API.
- Multi-tenancy: entidad `Restaurant` con `RestaurantId` en Client, MenuItem, Order, User.
  EF Core global query filters filtran por restaurante automáticamente.
  `ICurrentRestaurantService` lee el `restaurantId` del JWT (`CurrentRestaurantService`).
  Login usa `IgnoreQueryFilters()` porque el restaurantId aún no se conoce.
  `OrderService`, `MenuItemService`, `ClientService` y `TablewareService` inyectan `ICurrentRestaurantService` para asignar `RestaurantId` al crear. Todo servicio nuevo que cree entidades debe seguir este patrón.
- Autenticación: **JWT Bearer Token** (access token en memoria) + **Refresh Token** (cookie httpOnly, 7 días, rotación en cada uso).
- Roles actuales: `"Administrador"`, `"Empleado"`, `"Cocina"` (credenciales semilla: admin/admin123, empleado/empleado123, cocina/cocina123).
  El rol `"Cocina"` solo puede acceder a `GET /api/orders` — todos los demás endpoints requieren roles específicos.
  Roles Fase 2: + `"Cajera"` (solo ve pedidos Delivered+PendienteCobro, marca Cobrado).
- CORS: `WithOrigins(allowedOrigins)` + `AllowCredentials()`. Orígenes configurados en `appsettings.json` (`Cors:AllowedOrigins`).
- Fechas: usar siempre `DateTime.UtcNow` — PostgreSQL/Npgsql rechaza `DateTime.Now` (hora local).

### Configuración local

- `appsettings.json` → placeholders seguros, commiteado en git.
- `appsettings.Development.json` → password real y JWT key, **gitignoreado**, solo en máquina local.
- `.env` en raíz del frontend: `VITE_API_URL=http://localhost:5288/api`

---

## Fase 0 — Seguridad crítica (completada 2026-05-16)

| Item | Backend | Frontend |
|---|---|---|
| CORS restringido por origen (`WithOrigins` + `AllowCredentials`) | ✅ | — |
| Entidad `RefreshToken` + migración EF Core | ✅ | — |
| `JwtTokenService` — genera access token (15 min) + refresh token aleatorio | ✅ | — |
| `AuthService` — login, refresh con rotación, logout | ✅ | — |
| `AuthController` — cookie httpOnly con refresh token, `/refresh`, `/logout` | ✅ | — |
| `tokenStore` — puente en memoria entre interceptor Axios y AuthContext | — | ✅ |
| Access token solo en memoria (no localStorage) | — | ✅ |
| Interceptor Axios con retry automático en 401 vía `/Auth/refresh` | — | ✅ |
| `isAuthenticated` basado en `role` (localStorage) para sobrevivir reloads | — | ✅ |

---

## Módulo 1 — Estado actual (al 2026-05-31)

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
| Reactivar pedido Delivered → Pending al agregar artículos (cocina ve nuevos artículos) | — | ✅ |
| Buscador de platillos en modal "Agregar al pedido" | ✅ | — |
| Listado de pedidos del día con buscador | ✅ | ✅ |
| Marcar pedido Entregado / Cancelado | ✅ | ✅ |
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
| Roles renombrados: Administrador / Empleado | ✅ | ✅ |
| Pantalla de cocina — polling 15s, flash + beep al llegar pedidos | ✅ | ✅ |
| Login dedicado para rol Cocina en /cocina | ✅ | ✅ |
| Usuario cocina/cocina123 en seeder | — | ✅ |
| Login inputs: autoCapitalize, lowercase, placeholders correctos | ✅ | — |
| Restauración silenciosa de sesión al recargar (auto-refresh en AuthContext) | ✅ | — |
| `isInitializing` gate en ProtectedRoute y CocinaPage (evita race condition) | ✅ | — |
| Hora de creación por artículo en pantalla de cocina (CreatedAt) | ✅ | ✅ |
| Eliminar artículo de pedido PendienteCobro (botón X en OrdersPage) | ✅ | ✅ |
| Vajilla acumula QuantityDelivered si ya existe registro (re-entrega) | — | ✅ |

### Flujo operativo definido (2026-05-16)

El restaurante operaba con papeles: mesero escribe pedido a mano, lleva copia a cocina y cliente lleva recibo a caja.

**Flujo objetivo con la app:**
- Empleado (celular): toma pedido en app, marca Entregado
- Cocina (tableta fija): ve pedidos Pending en tiempo real
- Cajera (tableta en caja): ve pedidos Delivered+PendienteCobro, marca Cobrado

**Roles necesarios:** Empleado, Cocina, Cajera, Administrador

**Plan de adopción en dos fases:**
- Fase 1 (inmediata): pantalla de cocina con polling 30s — elimina papel de cocina. Empleado sigue marcando Cobrado como ahora.
- Fase 2 (después de 30 días en producción): cajera tiene su pantalla y marca Cobrado. Empleado ya no toca el cobro.

### Pendiente de implementar (actualizado)

- ✅ Control de vajilla (completo — 2026-05-21)
  - ✅ Paso 1: Entidad `OrderTableware` + migración EF Core
  - ✅ Paso 2: `IOrderTablewareRepository` + implementación + UnitOfWork
  - ✅ Paso 3: DTOs + `ITablewareService` + `TablewareService`
  - ✅ Paso 4: `TablewareController` + registro en `Program.cs`
  - ✅ Paso 5: Frontend — `VajillaPage` + modal en `OrdersPage` + navbar
- ✅ Pantalla de cocina `/cocina` — polling 15s, flash + beep, rol Cocina con login inline (2026-05-22)
- ✅ Rol "Cocina" — solo ve pantalla de cocina (2026-05-22)
- [ ] Rol "Cajera" — solo ve pedidos Delivered+PendienteCobro, marca Cobrado (Fase 2)
- [ ] Flujo de cierre de ronda / DeliveryRound (después de vajilla)

---

## Modelo de datos principal

### Client
```
Id, Name, Tipo ("Externo"|"Domicilio"|"Mesa"),
LocalNumber? (campo legacy, ya no se usa),
Referencia?, PhoneNumber?,
DireccionEntrega?, ReferenciaDomicilio?, IsActive,
RestaurantId
```
- `Externo` → `Referencia` opcional (negocio cercano, dentro o fuera de la plaza)
- `Domicilio` → `DireccionEntrega` + `Telefono` requeridos, `ReferenciaDomicilio` opcional
- `Mesa` → solo `Name` ("Mesa 1"..."Mesa 11"). Sin botón eliminar en la UI.
- Tipo `Plaza` fue eliminado y unificado con `Externo` (2026-05-15).

### MenuItem
```
Id, Name, Description?, Price, IsAvailable, RestaurantId
```

### Order
```
Id, ClientId, RestaurantId, OrderDate (UTC),
Status (Pending/Delivered/Cancelled),
PaymentStatus (PendienteCobro/Cobrado),
Notes?, Total
→ OrderDetails: MenuItemId, Quantity, UnitPrice, Subtotal, CreatedAt (UTC, DEFAULT now())
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
- `GET /pending` filtra donde `QuantityRecovered is null || QuantityRecovered < QuantityDelivered`.

### User
```
Id, Username, PasswordHash, Role, RestaurantId
```

### Restaurant
```
Id, Name, IsActive
```

---

## Flujo de estados del pedido

```
Toma de pedido → Status: Pending, PaymentStatus: PendienteCobro
     ↓ (se pueden agregar más artículos mientras PaymentStatus == PendienteCobro)
Entrega → Status: Delivered
     ↓ (si se agregan artículos desde Delivered → vuelve a Pending para que cocina lo vea)
Cobro al cierre → PaymentStatus: Cobrado
```

- `Status`: Pending → Delivered o Cancelled; Delivered → Cancelled.
- `PaymentStatus`: PendienteCobro → Cobrado. No aplica a Cancelados.
- "Pendientes" en la app = `estadoCobro !== 'Cobrado' && estado !== 'Cancelado'`.

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
| `/resumen` | DailySummaryPage | Solo Administrador |

---

## Endpoints del backend

**Clientes** `api/clients`
- `GET /` — todos los clientes
- `GET /{id}` — por ID
- `POST /` — crear `{ nombre, tipo, referencia?, telefono?, direccionEntrega?, referenciaDomicilio? }`
- `PUT /{id}` — actualizar
- `DELETE /{id}` — eliminar

**Menú** `api/menuitems`
- `GET /` — todos los platillos (autenticado)
- `GET /available` — solo disponibles
- `GET /{id}` — por ID
- `POST /` — crear `{ nombre, descripcion?, precio }` **(solo Administrador)**
- `PUT /{id}` — actualizar `{ nombre, descripcion?, precio, disponible }` **(solo Administrador)**
- `DELETE /{id}` — eliminar **(solo Administrador)**

**Órdenes** `api/orders`
- `GET /` — pedidos del día — roles: Administrador, Empleado, Cocina
- `POST /` — crear pedido `{ clienteId, notas?, articulos: [{articuloId, cantidad}] }`
- `POST /{id}/items` — agregar artículos (válido mientras `PaymentStatus == PendienteCobro`, incluye Entregados)
- `DELETE /{orderId}/items/{itemId}` — eliminar artículo (válido mientras `PaymentStatus == PendienteCobro`, mínimo 1 artículo) **(Administrador/Empleado)**
- `PATCH /{id}/status` — cambiar estado entrega `{ estado: 0|1|2 }`
- `PATCH /{id}/payment-status` — cambiar estado cobro `{ estadoCobro: 0|1 }`
- `GET /summary/daily` — resumen diario **(solo Administrador)**

**Vajilla** `api/tableware`
- `GET /pending` — vajilla pendiente de recuperar (autenticado)
- `GET /order/{orderId}` — vajilla registrada para un pedido específico
- `POST /` — registrar vajilla entregada `{ orderId, itemType, quantityDelivered }` (solo clientes Externo)
- `PATCH /order/{orderId}/recover` — registrar recuperación `{ quantityRecovered }` (acumulativa) **(solo Administrador)**

**Auth** `api/auth`
- `POST /login` — `{ username, password }` → `{ token, role, username, restaurantId }` + cookie httpOnly `refreshToken`
- `POST /refresh` — usa cookie `refreshToken` → `{ token, role, username, restaurantId }` + nueva cookie (rotación)
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
| Frontend | Vercel | ✅ Desplegado — `vercel.json` con rewrites para React Router |
| Backend | Railway | ✅ Desplegado — Dockerfile en raíz, variables de entorno configuradas |
| Base de datos | Railway PostgreSQL | ✅ Provisionada — `MigrateAsync` + seeder corren al arrancar |

### Variables de entorno en Railway (backend)
| Variable | Descripción |
|---|---|
| `ConnectionStrings__DefaultConnection` | Connection string Npgsql de PostgreSQL en Railway |
| `Jwt__Key` | Clave secreta para firmar JWT |
| `Jwt__Issuer` | Issuer del JWT (`RestaurantOrderAPI`) |
| `Jwt__Audience` | Audience del JWT (`RestaurantOrderApp`) |
| `Cors__AllowedOrigins__0` | URL del frontend en Vercel |

### Arranque en Railway
1. Docker build con `Dockerfile` en raíz
2. `await db.Database.MigrateAsync()` — aplica migraciones pendientes
3. `await DbSeeder.SeedAsync(db)` — crea restaurante, usuarios y menú si no existen

### Seguridad del repo (auditado 2026-05-23)
- `appsettings.Development.json` — gitignoreado (`appsettings.*.json`)
- `.env` del frontend — gitignoreado y removido del tracking
- `appsettings.json` base — solo placeholders, commiteado sin secretos
- `node_modules/` y `FrontendRestaurant/` removidos de la raíz del backend

---

## Decisiones técnicas relevantes

- `TotalACobrar` en resumen solo suma pedidos con `PaymentStatus = PendienteCobro`.
- `POST /orders/{id}/items` acumula cantidad si el artículo ya existe en el pedido. La validación usa `PaymentStatus != PendienteCobro` (no `Status != Pending`) — permite agregar artículos a pedidos ya Entregados mientras no se hayan cobrado. Si el pedido estaba `Delivered`, vuelve a `Pending` para que cocina lo vea con los artículos nuevos.
- Las mesas no tienen botón eliminar en la UI — son fixtures permanentes.
- El seeder usa `IgnoreQueryFilters()` para no fallar durante el arranque (antes del login).
- Buscadores de clientes, pedidos y platillos filtran en memoria (sin llamadas extra al backend).
- Los precios son `decimal` con `HasPrecision(10,2)` → `numeric(10,2)` en PostgreSQL. Aplica a `MenuItem.Price`, `OrderDetail.UnitPrice`, `OrderDetail.Subtotal`, `Order.Total`.
- Rutas `/menu` y `/resumen` protegidas con `<ProtectedRoute role="Administrador">` en frontend Y `[Authorize(Roles = "Administrador")]` en backend.
- Confirmación de eliminar es inline en la tarjeta (sin modal) — optimizado para móvil.
- Multi-tenancy: `Restaurant` es la raíz de todo. `OrderService` y `MenuItemService` inyectan `ICurrentRestaurantService` para asignar `RestaurantId`.
- `appsettings.Development.json` gitignoreado — nunca commitear passwords al repo.
- Control de vajilla solo aplica a clientes tipo `Externo` — Domicilio usa desechables, Mesa no necesita recuperación.
- Access token JWT vive solo en memoria (`tokenStore.ts`) — elimina vector XSS de localStorage.
- `tokenStore` es un módulo puente (get/set/register) que evita el import circular entre `client.ts` y `AuthContext.tsx`.
- `isAuthenticated` se basa en `role` (localStorage) y no en el token, para que el estado de sesión sobreviva reloads mientras el interceptor renueva el token silenciosamente.
- Refresh token: cookie `httpOnly; SameSite=Strict; Secure` (en HTTPS). Expira en 7 días. Se rota en cada uso — un token solo es válido una vez.
- `OrderResponseDto` incluye `TipoCliente` para que el frontend distinga pedidos Externo sin consulta adicional.
- **Bug corregido 2026-05-17:** `ClientService` no inyectaba `ICurrentRestaurantService` → `RestaurantId` llegaba vacío → FK violation 500. Fix: inyectar igual que `OrderService` y `MenuItemService`. **Regla:** todo servicio que crea entidades con `RestaurantId` DEBE inyectar `ICurrentRestaurantService`. Verificado al 2026-05-21: `OrderService`, `MenuItemService`, `ClientService` y `TablewareService` lo inyectan correctamente.
- Al marcar Entregado en `OrdersPage`: si `tipoCliente === 'Externo'` se abre un modal de vajilla; para Mesa/Domicilio se entrega directamente.
- La recuperación de vajilla es acumulativa — se puede llamar varias veces hasta agotar `QuantityDelivered`.
- Roles renombrados 2026-05-21: `"Dueño"` → `"Administrador"`, `"Mesero"` → `"Empleado"`. El seeder detecta roles legacy al arrancar y los migra automáticamente — no requiere tocar la BD manualmente.
- Navbar muestra solo el rol en naranja (no el username) — evita exponer nombres de usuario técnicos como "dueno".
- **Bug corregido 2026-05-22:** `GetDailySummaryAsync` usaba `startDate.Date` que produce `DateTime` con `Kind = Unspecified`. Npgsql rechaza comparar ese tipo contra columnas `timestamp with time zone` → excepción 500 en `GET /summary/daily`. Fix: `DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc)`. Regla general: toda fecha que entre al repositorio como parámetro de query debe tener `Kind = Utc` explícito.
- **Pantalla de cocina (2026-05-22):** `GET /api/orders` requiere autenticación (`[Authorize]`). La tableta de cocina usa el rol `"Cocina"` (usuario: cocina/cocina123). `useCocinaOrders` usa `getOrders` (interceptor JWT) con `select` para filtrar Pendientes. El beep usa Web Audio API; Chrome requiere clic antes de `AudioContext` → botón "Activar sonido". Sesión dura 7 días (refresh token) — la tableta no necesita re-login frecuente.
- Pantalla de cocina usa rol dedicado `"Cocina"` (cocina/cocina123) — nunca `[AllowAnonymous]` ni passthrough de `RestaurantId`. La tableta hace login una vez; el refresh token dura 7 días.
- `CocinaPage` tiene dos estados: `CocinaLogin` (si `role !== 'Cocina'`) y `CocinaScreen` (si `role === 'Cocina'`). Intento de acceso con otro rol hace logout automático.
- **Seeder (2026-05-25):** el `foreach` de usuarios siempre sincroniza `PasswordHash` y `Role` en el `else` branch — garantiza que las credenciales en BD coincidan con el código en cada arranque. Útil para resetear passwords en producción sin tocar la BD manualmente.
- **Login inputs (2026-05-25):** `LoginPage` y `CocinaLogin` usan `autoCapitalize="none"`, `autoCorrect="off"` y `onChange` que convierte el username a lowercase. Evita que móviles autocapitalicen y causen errores de autenticación.
- **Deploy (2026-05-25):** Backend en Railway con Dockerfile, Frontend en Vercel con `vercel.json`. El seeder crea/sincroniza los 3 usuarios en cada arranque. SHA-256 de `"admin123"` = `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`.
- **Auto-refresh en mount (2026-05-29):** `AuthContext` llama a `apiRefresh()` al montar si `localStorage.role` existe pero `tokenStore` no tiene token. Esto restaura la sesión silenciosamente tras un reload sin esperar a que el interceptor falle en 401. Si el refresh falla (cookie expirada), limpia `localStorage` y fuerza logout. El `refresh()` es un export dedicado en `auth.ts` que usa `api.post` (con interceptor JWT) — no llama al endpoint directamente.
- **isInitializing en AuthContext (2026-05-29):** resuelve race condition al recargar: sin este gate, `ProtectedRoute` y `CocinaPage` renderizan hijos antes de que el refresh silencioso complete, los hijos hacen API calls sin token, el interceptor dispara un segundo refresh concurrente que consume el token rotado y fuerza logout. `isInitializing` arranca en `true` si hay `role` en localStorage y pasa a `false` en el `.finally()` del refresh. `ProtectedRoute` y `CocinaPage` renderizan `null` mientras sea `true`.
- **CreatedAt en OrderDetail (2026-05-30):** campo `TIMESTAMPTZ NOT NULL DEFAULT now()` en `OrderDetail`, migración `AddOrderDetailCreatedAt`. Se expone en `OrderDetailResponseDto` y en el tipo `OrderDetail` del frontend. `OrderCard` en cocina muestra `formatTime(item.createdAt)` por artículo (no `order.fechaPedido`) — cada artículo muestra la hora en que se agregó al pedido, no la hora del pedido.
- **DELETE /orders/{orderId}/items/{itemId} (2026-05-30):** elimina un `OrderDetail` específico y recalcula `Total`. Validaciones: `PaymentStatus == PendienteCobro`, artículo pertenece al pedido, queda al menos 1 artículo. Roles: Administrador y Empleado. En `OrdersPage`, botón X por artículo visible cuando `estadoCobro !== 'Cobrado' && estado !== 'Cancelado' && articulos.length > 1`.
- **Vajilla acumula al re-entregar (2026-05-29):** `TablewareService.RegisterAsync` detecta registro existente y hace `QuantityDelivered += dto.QuantityDelivered` + `UpdateAsync` en lugar de lanzar excepción. Cubre el flujo: Externo entregado con vajilla → artículos nuevos regresan a Pending → segunda entrega abre modal de vajilla de nuevo.
- **Soft delete universal (2026-06-01):** `Client`, `MenuItem` y `Order` implementan `ISoftDeletable` (`IsDeleted bool`, `DeletedAt DateTime?`). Los query filters EF Core fusionan `RestaurantId` + `!IsDeleted` en una sola llamada a `HasQueryFilter` (EF Core no admite dos). `ClientService.DeleteAsync` y `MenuItemService.DeleteAsync` hacen soft delete (marcan `IsDeleted = true`, no llaman a `_context.Remove`). `Order` tiene los campos pero no hay endpoint de delete de orden — solo `Cancelled` via status.
- **AuditLog + AuditInterceptor (2026-06-01):** `AuditLog` (tabla `uuid` PK generado en app) captura Created/Modified/SoftDeleted/Deleted para todas las entidades salvo `AuditLog` misma. `AuditInterceptor : SaveChangesInterceptor` es Scoped; se registra con el factory overload de `AddDbContext` (`sp.GetRequiredService<AuditInterceptor>()`). Agrega entradas al contexto en `SavingChangesAsync` antes de llamar a `base` — se guardan en la misma transacción. Login fallido se audita manualmente en `AuthController` vía `IAuditService.LogAsync` (no pasa por `SaveChanges` normal). `AuditService` está en `Infrastructure/Services/`.
- **ICurrentUserService (2026-06-01):** interfaz en `Application/Common/Interfaces/`; implementación `CurrentUserService` en `API/Services/` (junto a `CurrentRestaurantService`) — Infrastructure no tiene `Microsoft.NET.Sdk.Web` y no puede usar `IHttpContextAccessor` sin un FrameworkReference extra. Lee `ClaimTypes.NameIdentifier` para `UserId` y `ClaimTypes.Name` para `Username`.
- **JWT claims (2026-06-01):** `JwtTokenService.GenerateToken` ahora emite `ClaimTypes.NameIdentifier = userId`. `ITokenService.GenerateToken` tiene firma `(username, role, restaurantId, userId)`. `AuthService.BuildAuthResult` pasa `user.Id`.
- **Índices compuestos (2026-06-01):** migración `Phase0_SoftDelete_AuditLog_Precision_Indexes`. Orders: (RestaurantId,OrderDate), (RestaurantId,Status,IsDeleted), (RestaurantId,PaymentStatus,IsDeleted), (RestaurantId,ClientId). Clients: (RestaurantId,IsDeleted,IsActive), (RestaurantId,Tipo). MenuItems: (RestaurantId,IsDeleted,IsAvailable). AuditLogs: (RestaurantId,OccurredAt), (EntityName,EntityId).
- **Serilog + Health check (2026-06-01):** `Serilog.AspNetCore` 10.0.0 + `Serilog.Sinks.Seq` 9.1.0 + `AspNetCore.HealthChecks.NpgSql` 9.0.0. Bootstrap logger captura errores de arranque; configuración completa desde appsettings vía `ReadFrom.Configuration`. Desarrollo: consola en texto (`outputTemplate`). Producción: `CompactJsonFormatter` JSON + sink Seq. `appsettings.Development.json` sobrescribe solo el array `WriteTo` (arrays en config.json se reemplazan, no se fusionan). Peticiones a `/health` se loguean a `Debug` para no contaminar Seq. `GET /health` → 200/503 JSON `{status, checks[]}`, sin autenticación, endpoint mapped con `.AllowAnonymous()`. **Nota BetterStack:** `Serilog.Sinks.BetterStack` no existe en NuGet — alternativa más simple es Railway Drain → BetterStack (captura stdout JSON sin código adicional). Variables Railway: `Serilog__WriteTo__1__Args__serverUrl` y `Serilog__WriteTo__1__Args__apiKey`.
- **Bug corregido 2026-06-01 — refresh token 401 en producción (cross-site cookie):** Tres causas encadenadas: (1) `SameSite=Strict` bloqueaba la cookie en requests Vercel→Railway (`vercel.app` ≠ `railway.app`). Fix: `Request.IsHttps ? SameSite=None : SameSite=Lax` en `SetRefreshCookie`/`DeleteRefreshCookie`. (2) Railway termina TLS en el proxy y reenvía HTTP al contenedor — `Request.IsHttps = false` dentro del contenedor → cookie con `Secure=false` → `SameSite=None` requiere `Secure=true`. Fix: `UseForwardedHeaders` con `KnownIPNetworks.Clear()` + `KnownProxies.Clear()` como PRIMER middleware del pipeline. (3) `RefreshTokenRepository.GetByTokenAsync` no usaba `IgnoreQueryFilters()` — el `Include(rt => rt.User)` aplicaba el filtro global de User (`u.RestaurantId == 0` sin JWT activo) vía INNER JOIN, haciendo que `FirstOrDefaultAsync` devolviera null. Fix: agregar `IgnoreQueryFilters()` igual que `UserRepository.GetByUsernameAsync`. (4) El navegador URL-codifica `=`, `+`, `/` en el Cookie header pero `Request.Cookies` no URL-decodifica. Fix: `Uri.UnescapeDataString(raw)` en `AuthController.Refresh` antes del lookup en BD. **Regla:** toda consulta que corre sin JWT activo (login, refresh, seeder) DEBE usar `IgnoreQueryFilters()`.
- **trim() en username del login (2026-06-01):** `LoginPage` y `CocinaLogin` aplican `.trim()` en el `onChange` del input. `AuthService.LoginAsync` hace `request.Username.Trim()` antes del lookup en BD. Doble protección: frontend nunca acumula espacios, backend también limpia.
- **Notes por artículo en OrderDetail (2026-06-02):** `OrderDetail.Notes VARCHAR(300)` nullable. `CreateOrderDetailDto.Notas = null` (default — sin breaking change en callers existentes). `OrderDetailResponseDto` expone `Notas`. `OrderService` persiste nota al crear y al agregar artículos nuevos; artículos acumulados conservan su nota original. Migración: `AddOrderDetailNotes` (solo `AddColumn`, expand-contract). Frontend: input de nota en `AddItemsModal` cuando cantidad > 0, se limpia al bajar a cero; nota en gris itálico en tarjeta de `OrdersPage`; nota en **amarillo** en `OrderCard` de cocina (info crítica para preparación). El campo `Notes` en `Order` sigue siendo la nota general del pedido — diferente al nuevo campo de nota por artículo.
- **Filtro de fechas en OrdersPage (2026-06-02):** Selector Desde/Hasta con mismo estilo visual que `DailySummaryPage`. Default = hoy (calculado en timezone `America/Mexico_City`). Filtro en memoria sobre `fechaPedido`: convierte UTC → fecha local MX con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' })` para comparar. Persiste al cambiar entre tabs Pendientes/Todos. Botón "Hoy" aparece solo cuando el rango difiere del día actual.
- **Bug corregido 2026-06-03 — cocina mostraba pedidos de días anteriores:** `GET /api/orders` devolvía todos los pedidos sin filtro de fecha. Tres síntomas: (1) `CocinaPage` mostraba Pending históricos. (2) Badge del navbar contaba pendientes de todos los días. (3) Un pedido sin artículos se renderizaba vacío. Fixes: **Backend** — `IOrderRepository/IOrderService.GetAllAsync(DateTime? date = null)`: si se envía `?date=YYYY-MM-DD`, filtra al día indicado con ventana UTC-6 fija (`date.Date.AddHours(6)` → `+24h`), mismo offset que `GetDailySummaryAsync`. Sin `?date` el comportamiento es idéntico al anterior (OrdersPage sin cambio). **Frontend** — `useCocinaOrders` envía `?date=<hoy MX>` en cada poll de 15s y filtra `articulos.length > 0` para omitir pedidos vacíos. **Layout badge** filtra en memoria por fecha MX al computar `pendingCount`. `getOrders(date?: string)` acepta el parámetro opcional. Sin migración.
- **Bug corregido 2026-05-31 — totalCobrado en resumen diario:** `GetDailySummaryAsync` en `OrderRepository` tenía dos problemas: (1) **Timezone**: rango UTC iniciaba a medianoche UTC = 6pm hora local Mexico City; pedidos del turno tarde/noche quedaban fuera del rango. Fix: desplazar 6h → `start = startDate.Date.AddHours(6)` (UTC-6 fijo desde que Mexico City eliminó DST en 2023). (2) **Carry-over Cobrado**: condición 2 solo incluía `PendienteCobro`; al marcar un pedido de un día anterior como `Cobrado` (común en domicilios que pagan después), dejaba de ser `PendienteCobro` y ya no estaba en rango de fechas → desaparecía del resumen sin sumar en `totalCobrado`. Fix: condición 2 ahora incluye **todos los pedidos no cancelados de los últimos 7 días anteriores al rango** sin filtrar por `PaymentStatus`. Ventana de 7 días cubre domicilios que pagan con días de retraso.
