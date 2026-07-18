# BACKLOG.md
> Actualizar en cada sesión. Mover ítems completados a DONE al final.
> Última actualización: 2026-07-17

---

## AHORA — Fase 1 (pendientes inmediatos)

### 🔴 Pendientes de definición con cliente

**[CLIENTE] Decisión IsToGo / ToGoSurcharge**
- Opciones: (A) activar el campo ya implementado en la UI actual, o (B) diferir a sistema de modificadores en Fase 2
- Impacto si se activa ahora: requiere definir UX de cuándo/cómo el mesero marca "para llevar" por artículo
- Recomendación técnica: diferir a Fase 2 donde se reemplazará por un sistema de modificadores general

### 🔴 Pendientes de código

**[FRONTEND] Tests automatizados — deuda técnica NewOrderPage / PackageSelectionForm**
- `src/**/*.test.*` → 0 resultados: no existe suite de tests en el proyecto
- Descubierto en sesión 2026-07-15 al reconocer el flujo de paquetes en NewOrderPage
- Candidatos de mayor riesgo: `handlePackageConfirm`, `handleSubmit` (payload à la carte + paquetes), validaciones R1–R5 espejadas en `PackageSelectionForm.isValid`
- Setup sugerido: Vitest + React Testing Library (ya en `package.json` si se instaló con Vite)

**[FRONTEND] UX tab "Todos" en OrdersPage**
- Cambio de comportamiento pendiente de definir: ¿qué debe mostrar exactamente "Todos" vs "Pendientes"?
- Confirmar con cliente antes de implementar

**[BACKEND + FRONTEND] Warning al borrar MenuItem con PackageGroups activos**
- Actualmente el soft-delete de un MenuItem que tiene `PackageGroups` configurados no advierte
- Opciones: (A) bloquear el delete con `422` si tiene grupos activos, o (B) advertir en frontend y pedir confirmación explícita
- Recomendación: bloquear en backend con mensaje claro + mostrar error en frontend

---

## SIGUIENTE — Fase 1 (módulos pendientes)

### Módulos nuevos

- [ ] Cocina: marcar tiempos de Comida Corrida (1er/2do/3er) con color conforme se entregan, sin bloquear el botón "X" de marcar pedido como listo. Diseño completo en Notas de sesión 2026-07-15.
- [ ] Sistema de tickets de venta (recibo al cliente) — digital primero, impresión
  térmica después. Diseño y decisiones pendientes en Notas de sesión 2026-07-15.
  NOTA: es el paso final antes de dar el proyecto por terminado (luego solo
  mantenimiento y escalabilidad).

### Módulos existentes (expansión)

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
- [x] Fix: GET /api/packages accesible a cualquier rol autenticado (antes solo Administrador, bloqueaba a Empleado tomar pedidos con paquetes)
- [x] Aviso inline en NewOrderPage si falla la carga de paquetes (no bloquea el resto del flujo de pedido)
- [x] Fix CORS staging: Cors__AllowedOrigins__0 tenía "ttps://" en vez de "https://" — typo corregido, staging funcional
- [x] [FRONTEND] Botón "Confirmar pedido" flotante/sticky en NewOrderPage + botón del formulario de paquete renombrado de "Agregar al carrito" a "Agregar al pedido" (Comida Corrida y Desayuno Completo). Rama: feat/pedido-confirmar-flotante. Sin cambio de lógica de envío — sigue siendo un solo POST al confirmar, soporta múltiples paquetes en el mismo pedido.
- [x] [FRONTEND] Cocina: marcar líneas entregadas por línea (visual, localStorage) — selecciones de paquete y ítems à la carte tocables individualmente, tachado reversible, persiste entre recargas y polls. Una sola tableta; versión multi-tableta (OrderGroupDelivery + backend) queda documentada como opción futura.

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

### 2026-07-15

- Implementado: botón "Confirmar pedido" flotante en NewOrderPage + renombrado de
  botón de paquete a "Agregar al pedido". No se tocó la lógica de envío ni el
  soporte de múltiples paquetes por pedido (verificado que es una feature
  deliberada, no un edge case).

- Diseñado (pendiente de implementar) — Cocina: tracking de tiempos de Comida
  Corrida:

  - Contexto: la Comida Corrida se sirve en 3 tiempos (1er Tiempo, 2do Tiempo,
    3er Tiempo/plato fuerte), ya existen como PackageGroups separados con esos
    nombres. Cocina quiere marcar con color cada tiempo conforme se entrega, sin
    cambiar el flujo existente del botón "X" (que marca Order.Status = Delivered
    y quita el pedido de la vista).

  - Modelo propuesto: tabla nueva `OrderGroupDelivery` (Id, OrderId, RestaurantId,
    PackageGroupId, DeliveredAt, DeliveredByUserId nullable) con UNIQUE
    (OrderId, PackageGroupId) — mismo patrón que OrderTableware. Granularidad por
    pedido completo, no por corrido individual (un pedido con 3 corridos distintos
    comparte el mismo PackageGroupId de "1er Tiempo", un solo registro cubre los 3).

  - Nuevo campo `PackageGroup.RequiresStagedDelivery BOOLEAN DEFAULT false` — se
    activa vía SQL directo en Railway solo en los 3 grupos de Comida Corrida (igual
    que IsCountingGroup/AllowExtra hoy). Evita hardcodear nombres de grupo y evita
    que le aparezcan botones de "tiempo" a Desayuno Completo, que no los necesita.

  - Endpoints propuestos: POST /api/orders/{orderId}/tiempos/{packageGroupId}/entregar
    (marca, idempotente) y DELETE .../entregar (desmarca, por si cocina se equivoca).

  - Frontend: OrderCard.tsx (Cocina) necesita pills/botones dinámicos por groupName
    presente con RequiresStagedDelivery=true; useCocinaOrders debe incluir qué
    packageGroupId ya están entregados por pedido para persistir color entre polls
    (cada 15s) y recargas.

  - Sin decidir todavía: si el botón "X" debería validar que los 3 tiempos estén
    marcados antes de permitir completar el pedido (por ahora: no bloquea).

- Próximo paso: retomar este diseño la próxima sesión, empezando por reconocimiento
  de CocinaPage.tsx / OrderCard.tsx / useCocinaOrders antes de escribir la migración.

### 2026-07-15 — Diseño preliminar: Sistema de tickets de venta
Estado: SOLO PLANEADO, pendiente de conversación con el cliente antes de implementar.
Es el módulo final del proyecto (después: solo mantenimiento y escalabilidad).

Alcance confirmado con Martín:
- Es un TICKET DE VENTA / recibo interno para el cliente — NO es una factura/CFDI
  fiscal. El CFDI (RESICO/SAT) sigue siendo un tema aparte ya listado en Fase 0.
  Si el cliente en realidad pide facturar (CFDI timbrado), es otro proyecto entero
  (PAC, certificados) y se separa.
- Salida: digital primero (sin hardware); impresión térmica como fase siguiente,
  no bloquea lo digital.

Opciones de diseño evaluadas:
- Digital (recomendado empezar aquí): componente React que renderiza el ticket
  (formato 58/80mm) desde la Order existente, reusando formatCurrency/formatDate.
  Imprimir vía diálogo nativo del navegador y/o generar PDF. Cero backend nuevo si
  el ticket se arma con datos que la orden ya devuelve.
  - Alternativa: generar PDF en el backend (.NET) — útil si se quiere archivar o
    reenviar (ej. por WhatsApp) o garantizar ticket idéntico desde cualquier origen.
    Más trabajo; diferir hasta que se pida archivar/reenviar.
- Impresión física: miniprinter térmica ESC/POS. Rutas: WebUSB/Web Bluetooth desde
  la PWA (barato, frágil entre navegadores/Android), diálogo de impresión del
  navegador contra impresora del sistema (lo más simple si la tableta ya la
  reconoce), o micro-agente de impresión (más robusto, más infra). El roadmap ya
  anticipa "WebUSB o microservicio" para comandas de cocina (Fase 2) — misma
  decisión aplica; conviene resolverla UNA vez para tickets y comandas juntos.

Decisiones pendientes con el cliente (esto define el diseño final):
- Folio consecutivo: ¿número de ticket secuencial por restaurante (#0001, #0002)?
  Requiere campo/tabla nuevo y cuidado con concurrencia.
- Datos del encabezado: hoy Restaurant solo tiene Id, Name, FeatureFlags. Si quieren
  dirección, teléfono, leyenda "gracias por su compra", etc., hay que agregar campos
  a Restaurant.
- ¿El ticket se persiste como registro, o basta generarlo al vuelo desde la Order?
- ¿En qué momento del flujo se dispara? (¿al cobrar? ¿desde la tarjeta del pedido en
  la pestaña Pedidos?)

Próximo paso: Martín lleva estas 4 preguntas al cliente. Con las respuestas se hace
reconocimiento (qué devuelve hoy el DTO de Order, dónde encaja el botón de ticket) y
luego el plan de implementación.

### 2026-07-17
- Implementado: marcado visual de líneas entregadas en pantalla de Cocina (localStorage,
  una tableta). Hook `useDeliveredLines` con estructura `{orderId: lineKey[]}`.
  lineKey: `sel:{Guid}` para selecciones de paquete, `item:{int}` para à la carte.
  Cleanup automático al cargar: elimina entradas de pedidos que ya no están pendientes.
- Versión backend (tabla `OrderGroupDelivery`, endpoints, multi-tableta) documentada
  como opción futura si el cliente crece a varias pantallas de cocina — NO implementada.
- Comportamiento: la línea del nombre del paquete (ej. "Comida Corrida") NO es tocable;
  solo las selecciones anidadas (sopa, arroz, guisado) y los ítems à la carte son líneas
  marcables. Toque → tachar + atenuar + ícono check; toque de nuevo → desmarcar.
  El botón X de completar pedido sigue sin cambios.
