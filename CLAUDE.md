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
  `OrderService` y `MenuItemService` inyectan `ICurrentRestaurantService` para asignar `RestaurantId` al crear.
- Autenticación: **JWT Bearer Token** (access token en memoria) + **Refresh Token** (cookie httpOnly, 7 días, rotación en cada uso).
- Roles actuales: `"Administrador"`, `"Empleado"` (credenciales semilla: admin/admin123, empleado/empleado123).
  Roles Fase 1: + `"Cocina"` (solo ve pantalla de cocina).
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

## Módulo 1 — Estado actual (al 2026-05-21)

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
| Agregar artículos a pedido Pendiente existente | ✅ | ✅ |
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
| Badge del navbar refleja vajilla pendiente de recuperar | ✅ | — |

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
- [ ] Pantalla de cocina — polling 30s, solo pedidos Pending (Fase 1)
- [ ] Rol "Cocina" — solo ve pantalla de cocina
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
→ OrderDetails: MenuItemId, Quantity, UnitPrice, Subtotal
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
     ↓ (se pueden agregar más artículos mientras esté Pending)
Entrega → Status: Delivered
     ↓
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
- `GET /` — pedidos del día
- `POST /` — crear pedido `{ clienteId, notas?, articulos: [{articuloId, cantidad}] }`
- `POST /{id}/items` — agregar artículos a pedido Pendiente (acumula si ya existe)
- `PATCH /{id}/status` — cambiar estado entrega `{ estado: 0|1|2 }`
- `PATCH /{id}/payment-status` — cambiar estado cobro `{ estadoCobro: 0|1 }`
- `GET /summary/daily` — resumen diario **(solo Administrador)**

**Vajilla** `api/tableware`
- `GET /pending` — vajilla pendiente de recuperar (autenticado)
- `GET /order/{orderId}` — vajilla registrada para un pedido específico
- `POST /` — registrar vajilla entregada `{ orderId, itemType, quantityDelivered }` (solo clientes Externo)
- `PATCH /order/{orderId}/recover` — registrar recuperación `{ quantityRecovered }` (acumulativa)

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

## Deploy (pendiente)

| Capa | Plataforma | Estado |
|---|---|---|
| Frontend | Vercel | Pendiente — repo listo, falta configurar VITE_API_URL con URL de Railway |
| Backend | Railway | Pendiente — conectar repo RestaurantOrderAPI |

### Instrucciones Railway (backend)
1. railway.app → Sign in with GitHub
2. New Project → Deploy from GitHub repo → `RestaurantOrderAPI`
3. Settings → Networking → Generate Domain → copiar URL
4. Esa URL va como `VITE_API_URL` en Vercel

### PostgreSQL en Railway
1. railway.app → New Project → Add a Service → Database → PostgreSQL
2. Copiar connection string (formato Npgsql): `Host=...;Port=...;Database=...;Username=...;Password=...`
3. Pegarlo como variable de entorno `ConnectionStrings__DefaultConnection` en el servicio del backend

---

## Decisiones técnicas relevantes

- `TotalACobrar` en resumen solo suma pedidos con `PaymentStatus = PendienteCobro`.
- `POST /orders/{id}/items` acumula cantidad si el artículo ya existe en el pedido.
- Las mesas no tienen botón eliminar en la UI — son fixtures permanentes.
- El seeder usa `IgnoreQueryFilters()` para no fallar durante el arranque (antes del login).
- Buscadores de clientes, pedidos y platillos filtran en memoria (sin llamadas extra al backend).
- Los precios son `decimal` nativo en PostgreSQL (sin `HasColumnType`).
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
