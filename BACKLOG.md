# Backlog — RestaurantOrderApp

---

## EN CURSO

**[BACKEND] Control de vajilla — Pasos 1-2 completados**
- ✅ Entidad `OrderTableware` + migración EF Core
- ✅ `IOrderTablewareRepository` + implementación + UnitOfWork
- [ ] Paso 3: DTOs + `ITablewareService` + `TablewareService`
- [ ] Paso 4: `TablewareController` (endpoints REST)
- [ ] Paso 5: Frontend (UI en pedidos de clientes Externo)

---

## SIGUIENTE — Fase 1

**[BACKEND+FRONTEND] Pantalla de cocina**
- Nuevo rol: "Cocina"
- Endpoint: `GET /api/orders?status=Pending` (verificar si ya existe o adaptar)
- Frontend: pantalla solo-lectura, polling cada 30s con React Query `refetchInterval`
- Muestra: nombre cliente/mesa, artículos, hora del pedido
- Sin botones de acción — solo visualización
- Dispositivo: tableta fija en cocina

---

## FASE 2 (después de 30 días en producción)

**[BACKEND+FRONTEND] Pantalla de caja**
- Nuevo rol: "Cajera"
- Ve solo pedidos `Delivered + PendienteCobro`
- Puede marcar `Cobrado`
- Muestra quién atendió (mesero) y total a cobrar
- Dispositivo: tableta fija en caja

---

## PENDIENTE SIN FECHA

- [ ] Flujo de cierre de ronda / DeliveryRound (después de vajilla completa)
- [ ] Deploy: Frontend → Vercel, Backend → Railway
- [ ] Roles futuros: ExternalSeller, SuperAdmin
