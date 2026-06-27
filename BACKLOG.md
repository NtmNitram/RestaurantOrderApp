# BACKLOG.md
> Actualizar en cada sesión. Mover ítems completados a DONE al final.
> Última actualización: 2026-06-25

---

## AHORA — Fase 1 (pendientes inmediatos)

### 🔴 Pendientes de definición con cliente

**[CLIENTE] Decisión IsToGo / ToGoSurcharge**
- Opciones: (A) activar el campo ya implementado en la UI actual, o (B) diferir a sistema de modificadores en Fase 2
- Impacto si se activa ahora: requiere definir UX de cuándo/cómo el mesero marca "para llevar" por artículo
- Recomendación técnica: diferir a Fase 2 donde se reemplazará por un sistema de modificadores general

### 🔴 Pendientes de código

**[FRONTEND] UX tab "Todos" en OrdersPage**
- Cambio de comportamiento pendiente de definir: ¿qué debe mostrar exactamente "Todos" vs "Pendientes"?
- Confirmar con cliente antes de implementar

**[BACKEND + FRONTEND] Warning al borrar MenuItem con PackageGroups activos**
- Actualmente el soft-delete de un MenuItem que tiene `PackageGroups` configurados no advierte
- Opciones: (A) bloquear el delete con `422` si tiene grupos activos, o (B) advertir en frontend y pedir confirmación explícita
- Recomendación: bloquear en backend con mensaje claro + mostrar error en frontend

---

## SIGUIENTE — Fase 1 (módulos pendientes)

**[BACKEND + FRONTEND] DeliveryRound**
- Entidad: `Id, RestaurantId, SellerUserId, StartedAt, ClosedAt?, Status (Open/Closed)`
- FK nullable `DeliveryRoundId` en `Order` (solo pedidos de clientes `Externo`)
- Pantalla del vendedor: lista de pedidos de la ronda activa
- Cobro + recuperación de vajilla en batch al cierre
- Cierre de ronda: validar que no queden pedidos sin cobrar

**[BACKEND] Reporte por vendedor**
- Ventas del día agrupadas por `SellerUserId`
- Vajilla entregada vs. recuperada por ronda

**[BACKEND] Reporte por platillo**
- Más vendidos del día / semana

**[FRONTEND] PWA**
- [ ] Probar instalación en tableta Android real

**[OPS] Onboarding El Arca de Adán**
- Documento de usuario: 1 página, flujos principales (mesero, cocina, admin)
- Capacitación presencial a dueño y empleados
- Canal de soporte WhatsApp Business configurado

---

## MÁS ADELANTE — Fase 2

- [ ] Sistema de modificadores (reemplaza `IsToGo`/`ToGoSurcharge`)
- [ ] Rol "Cajera"
- [ ] Tipos de cliente parametrizables por tenant
- [ ] Categorías de menú
- [ ] Impresión de comandas en cocina
- [ ] Manejo de inventario básico
- [ ] Portal de auto-registro + pago
- [ ] Provisioning automático de tenant
- [ ] Asistente IA al dueño (resumen semanal, Claude API)
- [ ] Evaluación Railway vs. Fly.io

---

## DONE ✅

### Fase 0 — Seguridad y estabilización
- [x] CORS restringido (`WithOrigins` + `AllowCredentials`)
- [x] Refresh Token Rotation (tabla `RefreshTokens`, rotación, detección de robo)
- [x] Access token en memoria (`tokenStore.ts`) — no localStorage
- [x] Interceptor Axios: retry en 401 vía `/Auth/refresh`
- [x] `UseForwardedHeaders()` — fix cookie cross-site en Railway
- [x] Cookie `SameSite=None; Secure` (cross-site Vercel→Railway)
- [x] Rate limiting login: 5 req/min por IP
- [x] Serilog + Health check `/health`
- [x] Sentry (excepciones no manejadas)
- [x] UptimeRobot (ping cada 5 min)
- [x] AuditLog + `AuditInterceptor`
- [x] Soft delete universal (`ISoftDeletable`)
- [x] Índices compuestos (`RestaurantId` primera columna)
- [x] Decimal precision `HasPrecision(10,2)`
- [x] Backup diario Backblaze B2 (GitHub Actions, retención 30 días)
- [x] Restauración de backup probada
- [x] Secrets en Railway — nunca en repo
- [x] Credenciales seed en variables de entorno (`Seed__*`)
- [x] Staging en Railway (environment separado, DB separada)
- [x] Frontend staging en Vercel (Custom Preview Branch `staging`)

### Fase 1 — Funcionalidades
- [x] Login + roles (Administrador, Empleado, Cocina)
- [x] Clientes: pestañas Mesas / Clientes, buscador
- [x] Mesas 1–11 (seeder)
- [x] Toma de pedido, buscador de platillos
- [x] Agregar artículos a pedido existente (à la carte)
- [x] Reactivar pedido Delivered → Pending al agregar artículos
- [x] Cancelar pedido
- [x] Cobro de pedido (PendienteCobro → Cobrado)
- [x] Pestaña "Pendientes" en OrdersPage
- [x] Badge navbar: pendientes de cobro + vajilla pendiente
- [x] Resumen diario por cliente (`/resumen`)
- [x] CRUD menú (solo Administrador)
- [x] Control de vajilla: registro, recuperación acumulativa, pendientes
- [x] Recuperación de vajilla restringida a Administrador
- [x] Pantalla cocina: polling 15s, flash+beep, marcar Entregado
- [x] Login dedicado Cocina en `/cocina`
- [x] Hora de creación por artículo en cocina (`CreatedAt`)
- [x] Kitchen highlight: orden más reciente (borde amarillo, 2+ órdenes misma mesa)
- [x] Kitchen highlight: ítems tardíos (agregados >N ms después del más antiguo)
- [x] Eliminar artículo de pedido (botón X, mínimo 1 artículo)
- [x] Nota por artículo (`Notes` en `OrderDetail`)
- [x] Filtro de fechas en OrdersPage (default hoy MX)
- [x] Polling automático OrdersPage para Empleado (10s)
- [x] Paquetes con opciones dinámicas: CRUD admin
- [x] Paquetes: flujo mesero inline en `NewOrderPage` (`PackageSelectionForm`)
- [x] Paquetes: `PackageSelectionModal` legacy para agregar a pedido existente
- [x] Paquetes: menú del día (`/menu-dia`, opciones rotativas)
- [x] Paquetes: cocina muestra opciones seleccionadas (feature flag)
- [x] `FeatureFlags` JSONB en `Restaurant` + claim en JWT + parseo en frontend
- [x] `BuildPackageOrderDetailAsync` centralizado (sin duplicación)
- [x] `Order.Total` unificado: `Sum(d => d.Subtotal)` en todos los flujos
- [x] Fix cocina: `Selections` visibles (`.ThenInclude` + campo en DTO)
- [x] `IsToGo` por artículo + `ToGoSurcharge` en MenuItem (implementado, pendiente decisión negocio)
- [x] Guardrail: `POST /api/orders` rechaza `ItemKind = "Package"` con `422`
- [x] Swagger UI con JWT Bearer en raíz del dominio
- [x] PackageOptions activado en producción (FeatureFlags confirmado en Railway)
- [x] PWA: manifest, Service Worker (Workbox), ícono El Arca de Adán, título actualizado

### Incidentes resueltos en producción
- [x] Bug 2026-05-22: `GetDailySummaryAsync` — `DateTime.Kind = Unspecified` → fix: `DateTime.SpecifyKind(..., Utc)`
- [x] Bug 2026-06-01: refresh token cross-site — `SameSite=Strict` + Railway proxy + URL encoding → fix: `SameSite=None` + `UseForwardedHeaders()` + `Uri.UnescapeDataString()`
- [x] Bug 2026-06-03: TS2769 en Vercel — `queryFn` con parámetros opcionales → fix: envolver en arrow `() => getOrders()`
- [x] Bug 2026-06-15: Dockerfile — `libgssapi_krb5.so.2` → fix: instalar `libgssapi-krb5-2` en runtime stage
- [x] Bug Fase 1: `VITE_API_URL` ausente en Vercel Production → errores 405 → fix: agregar variable al environment Production
- [x] Incidente Fase 1: "Almuerzo Corrido" soft-deleted accidentalmente → recuperado con UPDATE en Railway SQL Editor

---

## Notas de sesión

### 2026-05-15
- Plan técnico completo generado (7 secciones + roadmap 3 fases)
- Documentos vivos creados: ARCHITECTURE.md, SCHEMA.md, CONVENTIONS.md, ROADMAP.md, BACKLOG.md, ADR-001-to-005.md

### 2026-06-25
- Fase 0 cerrada como completa
- Documentos actualizados: CLAUDE.md, ROADMAP.md, BACKLOG.md
- Pendientes inmediatos identificados: activar PackageOptions (cliente), UX tab "Todos", warning delete MenuItem, decisión IsToGo
