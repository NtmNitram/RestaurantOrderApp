# Arquitectura — RestaurantOrderApp

---

## Roles

**Roles actuales:**
- `Dueño` — acceso total (menú, resumen diario, pedidos, clientes)
- `Mesero` — pedidos y clientes (no ve menú ni resumen)

**Roles Fase 1:**
- `Cocina` — pantalla solo-lectura con pedidos `Pending`, polling 30s

**Roles Fase 2:**
- `Cajera` — ve pedidos `Delivered + PendienteCobro`, puede marcar `Cobrado`

**Roles futuros:**
- `ExternalSeller` — flujo de vendedor externo con control de vajilla
- `SuperAdmin` — gestión multi-restaurante

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Backend | .NET 10 — Clean Architecture |
| Base de datos | PostgreSQL (Npgsql + EF Core) |
| Auth | JWT (access token en memoria) + Refresh Token (cookie httpOnly) |
| Deploy | Frontend → Vercel / Backend → Railway |

---

## Capas del backend

```
Domain/         Entidades, interfaces, enums
Application/    DTOs, servicios, interfaces de servicio
Infrastructure/ AppDbContext, repositorios, migraciones, seeder
API/            Controllers, middleware, Program.cs
```

---

## Decisiones clave

- Multi-tenancy por `RestaurantId` en todas las entidades — EF Core global query filters
- Access token: en memoria (`tokenStore.ts`), no en `localStorage`
- Refresh token: cookie `httpOnly; SameSite=Strict`, rotación en cada uso, expira 7 días
- `isAuthenticated` basado en `role` (localStorage) para sobrevivir reloads
- CORS: `WithOrigins` + `AllowCredentials` — orígenes en `appsettings.json`
- Fechas: siempre `DateTime.UtcNow` — Npgsql rechaza hora local
- Control de vajilla: solo clientes `Externo` — Domicilio usa desechables, Mesa no aplica
