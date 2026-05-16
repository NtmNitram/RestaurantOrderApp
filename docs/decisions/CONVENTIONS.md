# CONVENTIONS.md
> Documento vivo. Toda decisión de estilo que tomes va aquí.
> Última actualización: 2026-05-15

---

## Backend (.NET 10 / C#)

### Estructura de carpetas

```
src/
  RestaurantOrderApp.Domain/
    Entities/           ← Order.cs, Client.cs, etc.
    Enums/              ← OrderStatus.cs, ClientType.cs, etc.
    Exceptions/         ← DomainException.cs, NotFoundException.cs
    Interfaces/         ← IRepository<T>, IUnitOfWork

  RestaurantOrderApp.Application/
    Orders/
      Commands/         ← CreateOrderCommand.cs, CreateOrderHandler.cs
      Queries/          ← GetOrderByIdQuery.cs, GetOrderByIdHandler.cs
      DTOs/             ← OrderDto.cs, CreateOrderRequest.cs
    Clients/
      ...
    Common/
      Behaviors/        ← ValidationBehavior.cs (MediatR pipeline)
      Interfaces/       ← ICurrentRestaurantService.cs

  RestaurantOrderApp.Infrastructure/
    Persistence/
      AppDbContext.cs
      Configurations/   ← OrderConfiguration.cs (IEntityTypeConfiguration)
      Migrations/
      Interceptors/     ← AuditInterceptor.cs
    Services/           ← CurrentRestaurantService.cs, TokenService.cs
    Repositories/       ← (si no usas DbContext directo)

  RestaurantOrderApp.API/
    Controllers/        ← OrdersController.cs
    Middleware/         ← ExceptionMiddleware.cs, TenantMiddleware.cs
    Extensions/         ← ServiceCollectionExtensions.cs
    Program.cs
```

### Naming

| Elemento | Patrón | Ejemplo |
|---|---|---|
| Entidad | PascalCase singular | `Order`, `MenuItem` |
| DTO de respuesta | `{Entidad}Dto` | `OrderDto` |
| DTO de request | `Create{Entidad}Request` | `CreateOrderRequest` |
| Command | `{Acción}{Entidad}Command` | `CancelOrderCommand` |
| Query | `Get{Entidad}By{Campo}Query` | `GetOrderByIdQuery` |
| Handler | mismo nombre + `Handler` | `CancelOrderCommandHandler` |
| Controller | plural | `OrdersController` |
| Endpoint route | kebab-case plural | `/api/orders`, `/api/menu-items` |
| Enum values | PascalCase | `OrderStatus.Pending` |
| Config class | `{Entidad}Configuration` | `OrderConfiguration` |

### Respuestas de API

Siempre usar envelope de respuesta consistente:

```csharp
// Éxito
{ "data": { ... }, "success": true }

// Error de validación (400)
{ "success": false, "errors": ["Campo X es requerido"] }

// Error de negocio (422)
{ "success": false, "message": "No se puede cancelar una orden ya cobrada" }

// Not found (404)
{ "success": false, "message": "Orden no encontrada" }
```

### Manejo de errores

- Excepciones de dominio → `DomainException : Exception` con mensaje de negocio
- Not found → `NotFoundException : Exception`
- Middleware global captura y mapea a HTTP response correcto
- **Nunca** devolver stack traces al cliente en producción
- Log siempre el error completo con Serilog antes de devolver respuesta limpia

### Multi-tenancy — reglas de código

```csharp
// ✅ CORRECTO — usar siempre el DbContext filtrado
var orders = await _context.Orders.Where(o => o.Status == OrderStatus.Pending).ToListAsync();

// ❌ INCORRECTO — IgnoreQueryFilters sin justificación documentada
var orders = await _context.Orders.IgnoreQueryFilters().Where(...).ToListAsync();

// ✅ CORRECTO — cuando es necesario, documenta
// MULTI-TENANCY: IgnoreQueryFilters requerido en login porque RestaurantId aún no se conoce
var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == username);
```

### Migraciones EF Core

```bash
# Crear migración
dotnet ef migrations add NombreDescriptivo --project Infrastructure --startup-project API

# Generar script para producción (NUNCA correr update directo en prod)
dotnet ef migrations script --idempotent --output migrations/script_NNN.sql

# Aplicar en staging primero, revisar script, luego aplicar en producción
```

**Regla expand-contract**: nunca borrar columna en una sola migración.
1. Migración: agregar columna nueva + código que escribe en ambas
2. Deploy + backfill
3. Migración: código usa solo columna nueva
4. Deploy
5. Migración: borrar columna vieja

### Soft delete

```csharp
// En AppDbContext — global query filter
modelBuilder.Entity<Order>().HasQueryFilter(o => !o.IsDeleted && o.RestaurantId == _currentRestaurantId);

// En handlers — nunca Delete(), siempre:
entity.IsDeleted = true;
entity.DeletedAt = DateTime.UtcNow;
await _context.SaveChangesAsync();
```

---

## Frontend (React + TypeScript + TailwindCSS)

### Estructura de carpetas

```
src/
  api/                  ← funciones fetch por entidad (orders.api.ts)
  components/
    ui/                 ← componentes genéricos (Button, Input, Badge)
    orders/             ← componentes específicos de módulo
    clients/
    menu/
  hooks/                ← useOrders.ts, useClients.ts (React Query)
  pages/                ← OrdersPage.tsx, ClientsPage.tsx
  context/              ← AuthContext.tsx (access token en memoria)
  types/                ← order.types.ts, client.types.ts
  utils/                ← formatCurrency.ts, formatDate.ts
  constants/            ← routes.ts, queryKeys.ts
```

### Naming

| Elemento | Patrón | Ejemplo |
|---|---|---|
| Componente | PascalCase | `OrderCard.tsx` |
| Hook | camelCase con `use` | `useOrders.ts` |
| Tipo/Interface | PascalCase | `Order`, `CreateOrderRequest` |
| Función util | camelCase | `formatCurrency` |
| Constante | UPPER_SNAKE o camelCase objeto | `ROUTES.orders` |
| Query key | array de strings | `['orders', restaurantId, status]` |

### Manejo de fechas

```typescript
// ✅ CORRECTO — siempre convertir UTC a México en display
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const mexicoDate = toZonedTime(order.orderDate, 'America/Mexico_City');
const display = format(mexicoDate, 'dd/MM/yyyy HH:mm');

// ❌ INCORRECTO — no mostrar UTC directo
new Date(order.orderDate).toLocaleString()  // timezone inconsistente
```

### Manejo de moneda

```typescript
// ✅ CORRECTO — siempre formatear como peso mexicano
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
```

### Autenticación (tokens)

```typescript
// Access token: en memoria (variable de módulo o Context), NUNCA localStorage
let accessToken: string | null = null;

// Refresh token: httpOnly cookie — el navegador lo maneja, no lo lees desde JS

// Interceptor de Axios/fetch: si 401 → llamar /auth/refresh → reintentar
```

### React Query — convenciones

```typescript
// Query keys consistentes (en constants/queryKeys.ts)
export const QUERY_KEYS = {
  orders: (status?: string) => ['orders', status].filter(Boolean),
  orderById: (id: string) => ['orders', id],
  clients: (tipo?: string) => ['clients', tipo].filter(Boolean),
  menuItems: () => ['menu-items'],
};

// Siempre manejar loading + error en componentes que consumen queries
const { data, isLoading, isError } = useOrders();
if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
```

---

## Git

### Commits

```
feat: agregar módulo de control de vajilla
fix: corregir cálculo de total en órdenes con descuento
refactor: extraer TokenService a Infrastructure/Services
docs: actualizar SCHEMA.md con tabla OrderTableware
chore: agregar índices compuestos por RestaurantId
test: agregar tests de aislamiento multi-tenant
```

### Ramas

```
main          ← producción
staging       ← pruebas pre-producción (Railway staging)
feat/nombre   ← features en desarrollo
fix/nombre    ← bugfixes
```

**Regla**: nada va directo a `main`. Todo pasa por `staging` al menos 1 hora antes.

### Deploy

- Push a `staging` → deploy automático en Railway staging
- Push a `main` → deploy automático en Railway producción
- Hora de deploy producción: preferir 4-6 AM CDMX
- Toda migración de schema: snap de backup manual antes de aplicar

---

## Tests

### Backend

```
tests/
  RestaurantOrderApp.UnitTests/
    Domain/             ← reglas de negocio en entidades
    Application/        ← handlers con mocks
  RestaurantOrderApp.IntegrationTests/
    MultiTenancy/       ← OBLIGATORIO: tests de aislamiento entre tenants
    Orders/
    Auth/
```

**Regla crítica**: cada módulo nuevo requiere al menos un test de integración que verifique que tenant A no puede acceder a datos de tenant B.

### Nomenclatura de tests

```csharp
// Patrón: MetodoOAccion_Escenario_ResultadoEsperado
[Fact]
public async Task CancelOrder_WhenOrderIsAlreadyCobrado_ShouldThrowDomainException()

[Fact]
public async Task GetOrders_WhenCalledByTenantA_ShouldNotReturnTenantBOrders()
```
