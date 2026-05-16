# PROMPTS.md
> Copia el template que necesitas, rellena los [ ] y úsalo como primer mensaje en el Project.
> Última actualización: 2026-05-15

---

## Cómo iniciar cualquier sesión

```
Actúa como [ROL]. El contexto del proyecto está en los archivos del Project.
Fase actual: [Fase 0 / Fase 1 / Fase 2].
Tarea: [descripción concreta].
Output esperado: [código / ADR / revisión / decisión].
```

**Roles disponibles:**
- `CTO y arquitecto senior` — decisiones estructurales, diseño de módulos, trade-offs
- `Backend Engineer .NET 10` — implementación de endpoints, entidades, migraciones, tests
- `Frontend Engineer React + TypeScript` — componentes, hooks, integración React Query
- `Code Reviewer` — revisión de código contra Clean Architecture, multi-tenancy, seguridad
- `Product/Business Advisor` — decisiones de qué construir, cómo cobrar, qué postergar

---

## Template 1 — Crear endpoint nuevo

```
Actúa como Backend Engineer .NET 10. El contexto del proyecto está en los archivos del Project.

Necesito implementar el siguiente endpoint:

**Nombre**: [ej: Cerrar ronda de entrega]
**Método HTTP y ruta**: [ej: POST /api/delivery-rounds/{id}/close]
**Entidad afectada**: [ej: DeliveryRound]
**Operación**: [ej: cambiar Status de Open a Closed, validar que no haya Orders pendientes de cobro]
**Validaciones requeridas**:
  - [ej: La ronda debe existir y pertenecer al tenant actual]
  - [ej: No puede cerrarse si hay Orders con PaymentStatus = PendienteCobro]
**Rol requerido**: [ej: ExternalSeller, Owner]
**Respuesta exitosa**: [ej: DeliveryRoundDto con ClosedAt poblado]
**Errores esperados**: [ej: 404 si no existe, 422 si hay pedidos pendientes]

Genera: Controller method + Command + Handler + DTO + Validator + Test unitario del handler.
Sigue las convenciones de CONVENTIONS.md.
```

---

## Template 2 — Crear migración EF Core

```
Actúa como Backend Engineer .NET 10. El contexto del proyecto está en los archivos del Project.

Necesito una migración EF Core para el siguiente cambio de schema:

**Cambio deseado**: [ej: Agregar tabla OrderTableware con campos Id, OrderId, RestaurantId, ItemType, QuantityDelivered, QuantityRecovered (nullable), DeliveredAt, RecoveredAt (nullable)]
**Datos existentes a preservar**: [ej: ninguno, es tabla nueva / ej: la columna X tiene datos que deben migrarse a Y]
**Índices requeridos**: [ej: (RestaurantId, OrderId), índice parcial WHERE RecoveredAt IS NULL]
**Constraints**: [ej: CHECK QuantityRecovered <= QuantityDelivered]
**¿Requiere expand-contract?**: [Sí/No — Sí si estás modificando una columna existente con datos]

Genera:
1. La entidad C# actualizada o nueva
2. La configuración IEntityTypeConfiguration
3. El comando dotnet ef para crear la migración
4. El script SQL que se generaría (para revisión antes de aplicar en producción)
5. Si aplica: plan expand-contract paso a paso
```

---

## Template 3 — Crear componente React

```
Actúa como Frontend Engineer React + TypeScript. El contexto del proyecto está en los archivos del Project.

Necesito el siguiente componente:

**Nombre**: [ej: DeliveryRoundClosePanel]
**Propósito**: [ej: Pantalla del vendedor para ver pedidos de la ronda activa y cerrarla]
**Props interface**:
  - [ej: roundId: string]
  - [ej: onClose: () => void]
**Datos que consume**: [ej: lista de Orders del round, con Client.Name y Total y PaymentStatus]
**Endpoint(s) que llama**: [ej: GET /api/delivery-rounds/{id}/orders, POST /api/delivery-rounds/{id}/close]
**Comportamiento**:
  - [ej: Muestra lista de pedidos agrupados por cobrado/pendiente]
  - [ej: Botón "Cerrar ronda" deshabilitado si hay pendientes]
  - [ej: Al cerrar, muestra resumen y llama onClose()]
**Manejo de estados**: loading, error, vacío
**Estilo**: TailwindCSS, diseño para tableta (touch-friendly, texto grande)

Genera: componente .tsx + hook useDeliveryRound.ts con React Query + tipos en types/deliveryRound.types.ts.
Sigue las convenciones de CONVENTIONS.md.
```

---

## Template 4 — Code Review

```
Actúa como Code Reviewer senior. El contexto del proyecto está en los archivos del Project.

Revisa el siguiente código y dame una lista priorizada de issues:

**Contexto**: [ej: Implementé el módulo de control de vajilla, incluyendo entidad, handler y endpoint]
**Preocupaciones específicas**: [ej: No estoy seguro del manejo de la validación de QuantityRecovered, y quiero verificar que el multi-tenancy esté correcto]

[PEGA EL CÓDIGO AQUÍ]

Formato de revisión:
🔴 CRÍTICO — [issue que puede causar pérdida de datos, bug de seguridad, o multi-tenancy leak]
🟡 MAYOR — [issue que afecta correctitud o mantenibilidad]
🟢 MENOR — [mejora de estilo o legibilidad]
💡 NIT — [sugerencia opcional]

Para cada issue: describe el problema, explica por qué es un problema, y propone la corrección.
```

---

## Template 5 — Investigar y resolver un bug

```
Actúa como Backend Engineer .NET 10 senior. El contexto del proyecto está en los archivos del Project.

Tengo el siguiente bug:

**Comportamiento esperado**: [ej: Al marcar una orden como Cobrada, el total debe actualizarse]
**Comportamiento observado**: [ej: El total queda en 0 aunque haya OrderDetails]
**Frecuencia**: [ej: Siempre / Intermitente / Solo con ciertos tenants]
**Logs relevantes**: 
[PEGA LOGS AQUÍ]

**Código sospechoso**:
[PEGA EL CÓDIGO AQUÍ]

Analiza la causa raíz, propone la solución mínima y explica por qué ese fue el problema.
Si hay riesgo de datos corruptos existentes, indica cómo detectarlos y corregirlos.
```

---

## Template 6 — Diseñar nuevo módulo (sesión de Arquitecto)

```
Actúa como CTO y arquitecto senior. El contexto del proyecto está en los archivos del Project.

Un cliente nuevo solicita el siguiente módulo o funcionalidad:

**Solicitud del cliente**: [ej: Una cafetería quiere módulo de caja registradora con cierre de turno]
**Tipo de negocio del cliente**: [ej: Cafetería, 2 cajeros, 50-100 transacciones/día]
**¿Es un módulo reutilizable o one-off?**: [tu hipótesis inicial]

Necesito un ADR que cubra:
1. ¿Vale la pena construirlo? ¿Qué del sistema actual puedo reutilizar?
2. ¿Qué entidades nuevas necesito? ¿Cómo afecta el schema?
3. ¿Qué endpoints nuevos necesito?
4. ¿Requiere cambios a la arquitectura existente o solo extensión?
5. ¿Qué feature flags activa?
6. Esfuerzo estimado (bajo/medio/alto) y riesgos principales.

Output: ADR en el formato estándar del proyecto.
```

---

## Template 7 — Decisión de negocio técnica

```
Actúa como Product/Business Advisor con experiencia en SaaS B2B para restaurantes en LATAM.
El contexto del proyecto está en los archivos del Project.

Tengo que tomar la siguiente decisión:

**Decisión**: [ej: ¿Debo aceptar a este segundo cliente que quiere modificadores de platillo antes de estabilizar al primer cliente?]
**Contexto**:
  - Estado actual del proyecto: [ej: Fase 0 al 70%, primer cliente activo hace 2 semanas]
  - Oferta del cliente potencial: [ej: Paga desde ya, pero exige la feature en 3 semanas]
  - Mi capacidad actual: [ej: 15 horas/semana, tengo deuda técnica pendiente]
**¿Qué me preocupa?**: [ej: Tomar el cliente y quemar la relación con el primero por falta de atención]

Dame un análisis honesto de los trade-offs y una recomendación con justificación.
```

---

## Notas de uso

- **Usa Opus** para Templates 1 (módulos críticos), 4 (PRs de seguridad/auth), 6, y 7.
- **Usa Sonnet** para Templates 1 (CRUD rutinario), 2, 3, 4 (revisiones menores), y 5.
- Si la sesión pasa de 40-50 mensajes, abre una nueva y resume el estado en 3-4 líneas.
- Después de cada sesión productiva: actualiza BACKLOG.md (mover completados a DONE) y SCHEMA.md si hubo migración.
