# ROADMAP.md
> Actualizar el estado de cada ítem conforme avanzas: [ ] → [x]
> Última actualización: 2026-05-15

---

## FASE 0 — Estabilización
**Objetivo**: sistema listo para manos de un cliente real.
**Duración estimada**: 3-5 semanas a medio tiempo.
**Estado actual**: 🔴 En progreso

### Seguridad y autenticación
- [ ] Cerrar CORS: reemplazar `AllowAnyOrigin` por `WithOrigins(config["Cors:AllowedOrigins"])`
- [ ] Implementar refresh tokens con rotación (tabla `RefreshTokens`, endpoint `/auth/refresh`)
- [ ] Access token en memoria React (Context), no en localStorage
- [ ] Refresh token en httpOnly cookie (`SameSite=Strict; Secure`)
- [ ] Rate limiting nativo .NET: login (5 req/min), global (token bucket)
- [ ] Gestión de secrets en Railway: JWT signing key ≥512 bits, nunca en repo

### Observabilidad
- [ ] Serilog configurado con sink a Better Stack o Axiom
- [ ] Sentry para captura de excepciones no manejadas
- [ ] Health check endpoint `/health` con `AddNpgSql`
- [ ] UptimeRobot ping a `/health` cada 5 min con alerta a teléfono

### Base de datos
- [ ] Railway plan pagado (eliminar riesgo de sleep)
- [ ] Backup automático: GitHub Action diario → pg_dump → S3/R2, retención 30 días
- [ ] Restauración probada una vez (end-to-end, no solo backup)
- [ ] Migración: índices compuestos `(RestaurantId, ...)` en todas las tablas principales
- [ ] Migración: soft delete global (`IsDeleted`, `DeletedAt`) + query filter en EF
- [ ] Decimal precision: `HasPrecision(10, 2)` en todos los campos monetarios

### Auditoría
- [ ] Tabla `AuditLog` creada con migración EF Core
- [ ] `SaveChangesInterceptor` que registra: StatusChanged, Created, Cancelled, Cobrado, login fallido

### Tests
- [ ] Suite de tests de integración: al menos 5 casos de aislamiento multi-tenant
- [ ] Penetration test manual: IDOR, IDOR cross-tenant, mass assignment de RestaurantId, login brute force

### Infraestructura
- [ ] Entorno de staging en Railway separado (base de datos separada)
- [ ] Deploy automático a staging desde rama `staging`
- [ ] Deploy automático a producción desde rama `main`
- [ ] Variable `ASPNETCORE_ENVIRONMENT=Production` en Railway prod

### Documentación y legal
- [ ] Documentos vivos subidos al Claude Project: ARCHITECTURE.md, SCHEMA.md, CONVENTIONS.md, ROADMAP.md, BACKLOG.md
- [ ] `/docs/decisions/` con ADR-001 a ADR-005
- [ ] Alta en SAT (RESICO) lista para emitir factura
- [ ] Contrato de prestación de servicios redactado por abogado
- [ ] Aviso de privacidad LFPDPPP redactado

### Criterio de "Fase 0 completa" ✅
- Suite de tests pasa al 100% incluyendo aislamiento multi-tenant
- Health check verde 7 días seguidos en staging
- Restauración de backup probada exitosamente
- Penetration test manual ejecutado y hallazgos críticos corregidos
- Contrato y aviso de privacidad listos

---

## FASE 1 — Primer cliente activo (El Arca de Adán)
**Objetivo**: Arca de Adán operando en producción 30 días sin incidente grave.
**Duración estimada**: 4-8 semanas tras completar Fase 0.
**Estado actual**: ⏳ Pendiente

### Módulos nuevos
- [ ] Control de vajilla: entidad `OrderTableware`, validación `QuantityRecovered ≤ QuantityDelivered`
- [ ] Integración vajilla con flujo de cobro: al marcar Cobrado, forzar ingreso de recuperación
- [ ] `DeliveryRound`: entidad, estados Open/Closed, FK en Order
- [ ] Pantalla del vendedor: lista de pedidos de la ronda activa, cobro + recuperación de vajilla en batch
- [ ] Cierre de ronda: validación de pedidos sin cobrar, resumen final

### Reportes
- [ ] Reporte diario por cliente (ya implementado — verificar funciona en prod)
- [ ] Reporte diario por vendedor (ventas del día, vajilla entregada vs. recuperada)
- [ ] Reporte diario por platillo (más vendidos)

### PWA
- [ ] `manifest.json` configurado: nombre, ícono, splash, `display: standalone`
- [ ] Service Worker básico (caching de assets, no offline de datos — v2)
- [ ] Probado en tableta Android real con instalación como app

### Operaciones
- [ ] Endpoint `/admin/tenants` (SuperAdmin): provisioning de nuevo tenant en una transacción
- [ ] Monitoreo activo: alertas si API cae, si error rate > 1%, si DB > 80% capacidad
- [ ] Onboarding Arca de Adán: capacitación a dueño y vendedores, documento de usuario (1 página)
- [ ] Canal de soporte WhatsApp Business configurado, horarios pactados en contrato

### Criterio de "Fase 1 completa" ✅
- Arca de Adán en producción 30 días seguidos sin incidente grave (downtime >30 min, pérdida de datos, error de cobro)
- Los 3 flujos (Externo, Mesa, Domicilio) usados diariamente
- Dueño consulta reportes sin asistencia
- Cobro mensual recibido y facturado (CFDI emitido)
- Backup verificado con restauración real de datos de producción

---

## FASE 2 — Escala a múltiples restaurantes
**Objetivo**: modelo de renta de tabletas operando con 5+ tenants.
**Duración estimada**: 6-12 meses tras Fase 1.
**Estado actual**: ⏳ Pendiente

### Parametrización por tenant
- [ ] `Restaurant.FeatureFlags` JSONB implementado y en uso
- [ ] Tipos de cliente parametrizables (tabla `ClientTypes` por tenant)
- [ ] Categorías de menú parametrizables
- [ ] Modificadores de platillo (sin cilantro, extra queso)

### Operaciones automáticas
- [ ] Portal de auto-registro con pago (Stripe / Conekta / Mercado Pago)
- [ ] Provisioning automático de tenant al confirmar pago
- [ ] Status page público (`status.tudominio.com`)
- [ ] SLA formalizado en contrato estándar

### Módulos adicionales
- [ ] Manejo básico de inventario (descuento al crear OrderDetail)
- [ ] Impresión de comandas en cocina (WebUSB o microservicio)
- [ ] Cierre de caja diario

### IA en el producto (v2)
- [ ] Asistente al dueño: resumen semanal por Claude API (batch nocturno, Haiku/Sonnet)
- [ ] Hard cap de costo IA por tenant por día
- [ ] Cache de resultados: resumen no se regenera más de 1 vez/día por tenant

### Infraestructura
- [ ] Evaluación Railway vs. Fly.io (criterio: 5+ tenants o DB >1 GB)
- [ ] Particionamiento por `RestaurantId` en tablas Orders, OrderDetails si volumen lo justifica
- [ ] Réplica de lectura para reportes (separar reads pesados del write path)

### Criterio de "Fase 2 completa" ✅
- 5+ tenants activos pagando
- MRR cubriendo infraestructura + tiempo parcial del desarrollador
- Onboarding de nuevo tenant <1 hora de trabajo manual
- Zero downtime deploy demostrado (al menos 3 deploys en producción sin downtime)
- Freelance de nivel 1 puede dar soporte con la documentación existente

---

## Historial de cambios a este documento

| Fecha | Cambio |
|---|---|
| 2026-05-15 | Documento inicial creado |
