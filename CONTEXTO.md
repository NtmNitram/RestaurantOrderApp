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
├── Infrastructure/ AppDbContext + repositorios + DbSeeder
└── API/            Controllers + middleware + Program.cs
```

- Base de datos: **PostgreSQL** con `EnsureCreated()` (sin migraciones EF).
  Driver: `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1` en Infrastructure y API.
- Multi-tenancy: entidad `Restaurant` con `RestaurantId` en Client, MenuItem, Order, User.
  EF Core global query filters filtran por restaurante automáticamente.
  `ICurrentRestaurantService` lee el `restaurantId` del JWT (`CurrentRestaurantService`).
  Login usa `IgnoreQueryFilters()` porque el restaurantId aún no se conoce.
- Autenticación: **JWT Bearer Token**. El token incluye claim `restaurantId`.
- Roles: `"Dueño"` y `"Mesero"` (credenciales semilla: dueno/dueno123, mesero/mesero123).
- CORS: `AllowAnyOrigin` configurado en Program.cs.

### Connection string (local)
`appsettings.json`:
```
Host=localhost;Port=5432;Database=restaurant_orders;Username=postgres;Password=TU_PASSWORD
```
**Pendiente del desarrollador:** instalar PostgreSQL 17 local y crear la base `restaurant_orders`.

---

## Módulo 1 — Estado actual (al 2026-05-07)

### Funcionalidades implementadas

| Feature | Frontend | Backend |
|---|---|---|
| Login + roles | ✅ | ✅ |
| Clientes: pestañas Mesas / Clientes | ✅ | — |
| Mesas 1–11 creadas automáticamente (seeder) | — | ✅ |
| Buscador de clientes por nombre, teléfono, dirección | ✅ | — |
| Crear cliente (Plaza, Externo, Domicilio) | ✅ | ✅ |
| Eliminar cliente (confirmación inline) | ✅ | ✅ |
| Tipo Domicilio con dirección + referencias + teléfono obligatorio | ✅ | ✅ |
| Toma de pedido por cliente o mesa | ✅ | ✅ |
| Agregar artículos a pedido Pendiente existente | ✅ | ✅ |
| Buscador de platillos en modal "Agregar al pedido" | ✅ | — |
| Listado de pedidos del día con buscador | ✅ | ✅ |
| Marcar pedido Entregado / Cancelado | ✅ | ✅ |
| Estado de cobro por pedido (Cobrar → Cobrado) | ✅ | ✅ |
| Pestaña "Pendientes" = sin cobrar (no cancelados) | ✅ | ✅ |
| Badge del navbar refleja pendientes de cobro | ✅ | — |
| Resumen diario con Por cobrar y Cobrado (global y por cliente) | ✅ | ✅ |

### Pendiente de implementar

- [ ] Control de vajilla — registrar platos/vasos entregados por pedido y lo que hay que recuperar al cierre
- [ ] Flujo de cierre de ronda — pantalla para el vendedor al momento de cobrar y recoger vajilla

---

## Modelo de datos principal

### Client
```
Id, Name, Tipo ("Plaza"|"Externo"|"Domicilio"|"Mesa"),
LocalNumber?, Referencia?, PhoneNumber?,
DireccionEntrega?, ReferenciaDomicilio?, IsActive
```
- `Plaza` → `LocalNumber` requerido
- `Externo` → `Referencia` requerida
- `Domicilio` → `DireccionEntrega` + `Telefono` requeridos, `ReferenciaDomicilio` opcional
- `Mesa` → solo `Name` ("Mesa 1"..."Mesa 11"), sin campos extra. Sin botón eliminar en la UI.

### MenuItem
```
Id, Name, Description, Price, IsAvailable
```

### Order
```
Id, ClientId, OrderDate,
Status (Pending/Delivered/Cancelled),
PaymentStatus (PendienteCobro/Cobrado),
Notes, Total
→ OrderDetails: MenuItemId, Quantity, UnitPrice, Subtotal
```

### User
```
Id, Username, PasswordHash, Role
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
| `/resumen` | DailySummaryPage | Solo Dueño |

---

## Endpoints del backend

**Clientes** `api/clients`
- `GET /` — todos los clientes
- `GET /{id}` — por ID
- `POST /` — crear `{ nombre, tipo, numeroLocal?, referencia?, telefono?, direccionEntrega?, referenciaDomicilio? }`
- `PUT /{id}` — actualizar
- `DELETE /{id}` — eliminar

**Menú** `api/menuitems`
- `GET /` — todos los platillos

**Órdenes** `api/orders`
- `GET /` — pedidos del día
- `POST /` — crear pedido `{ clienteId, notas?, articulos: [{articuloId, cantidad}] }`
- `POST /{id}/items` — agregar artículos a pedido Pendiente `{ articulos: [{articuloId, cantidad}] }` (acumula si ya existe)
- `PATCH /{id}/status` — cambiar estado entrega `{ estado: 0|1|2 }`
- `PATCH /{id}/payment-status` — cambiar estado cobro `{ estadoCobro: 0|1 }`
- `GET /summary/daily` — resumen diario (solo Dueño)

**Auth** `api/auth`
- `POST /login` — `{ username, password }` → `{ token, role, username }`

---

## Resumen diario — estructura de respuesta

```
DailySummaryDto {
  fecha, totalPedidos,
  totalGeneral,   ← todos (cobrado + por cobrar)
  totalCobrado,
  clientes: [
    ClientDailySummaryDto {
      ...,
      totalACobrar,   ← pendiente de cobro del cliente
      totalCobrado,   ← ya pagado por el cliente
      pedidos: [ OrderSummaryItemDto { ..., estadoCobro } ]
    }
  ]
}
```

---

## Configuración de entorno

`.env` en la raíz del frontend:
```
VITE_API_URL=http://localhost:5288/api   ← desarrollo local
```
En Vercel: `VITE_API_URL=https://tu-url-de-railway.up.railway.app/api`

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
4. Con PostgreSQL los datos persisten entre reinicios del contenedor

---

## Decisiones técnicas relevantes

- `TotalACobrar` en resumen solo suma pedidos con `PaymentStatus = PendienteCobro`.
- `POST /orders/{id}/items` acumula cantidad si el artículo ya existe en el pedido.
- Las mesas no tienen botón eliminar en la UI — son fixtures permanentes.
- El seeder verifica `if (!context.Clients.Any(c => c.Tipo == "Mesa"))` para no duplicar mesas al reiniciar.
- Buscadores de clientes y pedidos filtran en memoria (sin llamadas extra al backend).
- Los precios son `decimal` nativo en PostgreSQL (sin `HasColumnType`).
- La ruta `/resumen` está protegida con `<ProtectedRoute role="Dueño">` en frontend Y backend.
- Confirmación de eliminar cliente es inline en la tarjeta (sin modal) — optimizado para móvil.
- Multi-tenancy: `Restaurant` es la raíz de todo. En producción cada negocio tendrá su propio restaurante.
- El seeder usa `IgnoreQueryFilters()` en todos los checks para evitar errores durante el arranque (antes del login).
