# ARCHITECTURE.md
> Documento vivo. Actualizar después de cada decisión estructural.
> Última actualización: 2026-05-15

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Backend | .NET 10, Clean Architecture |
| ORM | Entity Framework Core + Npgsql 10.0.1 |
| Base de datos | PostgreSQL (Railway) |
| Auth | JWT Bearer Token (access) + httpOnly Cookie (refresh) |
| Cache frontend | React Query |
| Deploy frontend | Vercel (pendiente) |
| Deploy backend | Railway plan pagado |
| Logging | Serilog → Better Stack / Axiom |
| Monitoreo errores | Sentry |
| Uptime | UptimeRobot (ping /health cada 5 min) |

---

## Arquitectura de capas (Clean Architecture)

```
API/                        ← Controllers, Middleware, Program.cs
Application/                ← Commands, Queries, Handlers, DTOs, Interfaces
Domain/                     ← Entities, Enums, Domain Rules
Infrastructure/             ← DbContext, Repositories, Migrations, Services
```

**Regla de dependencias**: Domain no depende de nadie. Application depende solo de Domain. Infrastructure y API dependen de Application.

---

## Multi-tenancy

**Patrón**: Shared database, shared schema, discriminado por `RestaurantId`.

**Flujo**:
1. Login → JWT emitido con claim `restaurantId`
2. Cada request → `ICurrentRestaurantService` lee `restaurantId` del claim
3. EF Core global query filters filtran automáticamente por `RestaurantId` en todas las entidades

**Reglas críticas**:
- NUNCA usar `IgnoreQueryFilters()` fuera de: Login, Seeder, SuperAdmin context
- Todo uso de `IgnoreQueryFilters()` debe tener comentario explicando por qué
- Los tests de integración verifican aislamiento entre tenants en cada PR

**Índices**: todos los índices de tablas principales tienen `RestaurantId` como primera columna.

```
Orders:      (RestaurantId, Status, OrderDate)
Clients:     (RestaurantId, Tipo, IsActive)
MenuItems:   (RestaurantId, IsAvailable)
```

---

## Entidades principales

```
Restaurant       → raíz de tenant (Id, Name, IsActive, FeatureFlags JSONB)
User             → Id, Username, PasswordHash, Role, RestaurantId
Client           → Id, Name, Tipo, Referencia, PhoneNumber, DireccionEntrega,
                   ReferenciaDomicilio, IsActive, RestaurantId
MenuItem         → Id, Name, Description, Price decimal(10,2), IsAvailable, RestaurantId
Order            → Id, ClientId, RestaurantId, OrderDate UTC, Status, PaymentStatus,
                   Notes, Total, DeliveryRoundId (nullable)
OrderDetail      → OrderId, MenuItemId, Quantity, UnitPrice, Subtotal
OrderTableware   → Id, OrderId, RestaurantId, ItemType, QuantityDelivered,
                   QuantityRecovered (nullable), DeliveredAt, RecoveredAt (nullable)
DeliveryRound    → Id, RestaurantId, SellerUserId, StartedAt, ClosedAt (nullable), Status
RefreshToken     → Id, UserId, TokenHash, ExpiresAt, RevokedAt, ReplacedByTokenId, RestaurantId
AuditLog         → Id, UserId, RestaurantId, EntityType, EntityId, Action,
                   OldValue JSONB, NewValue JSONB, Timestamp, IpAddress
```

---

## Estados y flujos

**Order.Status**: `Pending → Delivered → (cualquiera) → Cancelled`
**Order.PaymentStatus**: `PendienteCobro → Cobrado` (solo cuando Status = Delivered)
**DeliveryRound.Status**: `Open → Closed`

**Regla de vajilla**: `OrderTableware` solo se crea cuando `Client.Tipo == Externo`.
Al marcar Cobrado, se requiere informar `QuantityRecovered` o marcar explícitamente como pérdida.

---

## Autenticación y autorización

- **Access token**: JWT, expira en 15 minutos, viaja en header `Authorization: Bearer`
- **Refresh token**: opaco, hash en DB, viaja en httpOnly cookie `SameSite=Strict; Secure`
- **Refresh Token Rotation**: cada uso genera nuevo token, invalida el anterior
- **Detección de robo**: si un token "ya reemplazado" se usa de nuevo → revocar toda la cadena

**Roles actuales**: `Owner`, `Waiter`, `ExternalSeller`, `SuperAdmin`
**Sistema de permisos**: `Role → Permissions` (many-to-many)
**SuperAdmin**: no tiene `RestaurantId`, usa `IAdminContext` separado con `DbContext` admin

---

## Seguridad

- CORS: `WithOrigins(config["Cors:AllowedOrigins"])` — nunca `AllowAnyOrigin`
- Rate limiting: nativo .NET (`Microsoft.AspNetCore.RateLimiting`) — login: 5 req/min, global: token bucket
- Soft delete: `IsDeleted` + global query filter — nada se borra duro en v1
- Auditoría: `SaveChangesInterceptor` → tabla `AuditLog`
- Secrets: solo variables de entorno en Railway, nunca en appsettings ni en repo

---

## Feature flags por tenant

`Restaurant.FeatureFlags` (JSONB). Activa/desactiva módulos por tenant sin fork de código.

```json
{
  "tablewareTracking": true,
  "deliveryRounds": true,
  "kitchenPrinting": false,
  "inventoryControl": false,
  "aiWeeklySummary": false
}
```

---

## Decisiones tomadas (resumen — ver /docs/decisions/ para detalle)

| ADR | Decisión |
|---|---|
| ADR-001 | Refresh token en httpOnly cookie, access token en memoria React |
| ADR-002 | PWA (no APK) para distribución en tabletas |
| ADR-003 | Soft delete universal en v1 |
| ADR-004 | `DeliveryRound` como entidad separada (no estado en Order) |
| ADR-005 | `OrderTableware` como entidad separada (no campos en OrderDetail) |

---

## Lo que NO hacer (decisiones negativas)

- No `AllowAnyOrigin` en producción
- No JWT en `localStorage`
- No borrado físico de registros en v1
- No `IgnoreQueryFilters()` sin comentario y test
- No construir offline-first en v1
- No IA en el producto antes de v2
- No clientes nuevos hasta que el primer cliente esté estable 30 días
