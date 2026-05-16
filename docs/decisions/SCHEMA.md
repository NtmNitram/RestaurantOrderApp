# SCHEMA.md
> Regenerar después de cada migración EF Core.
> Última actualización: 2026-05-15

---

## Diagrama de relaciones (texto)

```
Restaurant
  ├── Users (1:N)
  ├── Clients (1:N)
  ├── MenuItems (1:N)
  ├── Orders (1:N)
  │     ├── OrderDetails (1:N)
  │     ├── OrderTableware (1:N)  [solo Externo]
  │     └── DeliveryRound (N:1)  [solo Externo, nullable]
  └── DeliveryRounds (1:N)
        └── Orders (1:N)
```

---

## Tablas

### Restaurant
```sql
Id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
Name        VARCHAR(200) NOT NULL
IsActive    BOOLEAN NOT NULL DEFAULT true
FeatureFlags JSONB NOT NULL DEFAULT '{}'
```

### User
```sql
Id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
Username        VARCHAR(100) NOT NULL
PasswordHash    VARCHAR(255) NOT NULL
Role            VARCHAR(50) NOT NULL   -- Owner | Waiter | ExternalSeller | SuperAdmin
RestaurantId    UUID NOT NULL REFERENCES Restaurant(Id)

INDEX: (RestaurantId, Username)
```

### Client
```sql
Id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
Name                 VARCHAR(200) NOT NULL
Tipo                 VARCHAR(50) NOT NULL    -- Externo | Domicilio | Mesa
Referencia           VARCHAR(100)            -- número de mesa si Tipo=Mesa
PhoneNumber          VARCHAR(20)
DireccionEntrega     VARCHAR(500)
ReferenciaDomicilio  VARCHAR(300)
IsActive             BOOLEAN NOT NULL DEFAULT true
IsDeleted            BOOLEAN NOT NULL DEFAULT false
RestaurantId         UUID NOT NULL REFERENCES Restaurant(Id)

INDEX: (RestaurantId, Tipo, IsActive)
INDEX: (RestaurantId, IsDeleted)
```

### MenuItem
```sql
Id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
Name            VARCHAR(200) NOT NULL
Description     VARCHAR(500)
Price           DECIMAL(10,2) NOT NULL
IsAvailable     BOOLEAN NOT NULL DEFAULT true
IsDeleted       BOOLEAN NOT NULL DEFAULT false
RestaurantId    UUID NOT NULL REFERENCES Restaurant(Id)

INDEX: (RestaurantId, IsAvailable)
INDEX: (RestaurantId, IsDeleted)
```

### Order
```sql
Id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ClientId        UUID NOT NULL REFERENCES Client(Id)
RestaurantId    UUID NOT NULL REFERENCES Restaurant(Id)
OrderDate       TIMESTAMPTZ NOT NULL DEFAULT now()   -- siempre UTC
Status          VARCHAR(50) NOT NULL    -- Pending | Delivered | Cancelled
PaymentStatus   VARCHAR(50) NOT NULL    -- PendienteCobro | Cobrado
Notes           VARCHAR(1000)
Total           DECIMAL(10,2) NOT NULL DEFAULT 0
IsDeleted       BOOLEAN NOT NULL DEFAULT false
DeliveryRoundId UUID REFERENCES DeliveryRound(Id)   -- nullable

INDEX: (RestaurantId, Status, OrderDate DESC)
INDEX: (RestaurantId, PaymentStatus)
INDEX: (RestaurantId, ClientId)
INDEX: (RestaurantId, DeliveryRoundId)
```

### OrderDetail
```sql
Id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
OrderId     UUID NOT NULL REFERENCES Order(Id)
MenuItemId  UUID NOT NULL REFERENCES MenuItem(Id)
Quantity    INT NOT NULL
UnitPrice   DECIMAL(10,2) NOT NULL
Subtotal    DECIMAL(10,2) NOT NULL

INDEX: (OrderId)
```

### OrderTableware
```sql
Id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
OrderId             UUID NOT NULL REFERENCES Order(Id)
RestaurantId        UUID NOT NULL REFERENCES Restaurant(Id)
ItemType            VARCHAR(100) NOT NULL   -- Plato | Vaso | Cubierto | etc.
QuantityDelivered   INT NOT NULL
QuantityRecovered   INT                     -- nullable hasta recuperación
DeliveredAt         TIMESTAMPTZ NOT NULL
RecoveredAt         TIMESTAMPTZ             -- nullable

CONSTRAINT chk_recovered CHECK (QuantityRecovered IS NULL OR QuantityRecovered <= QuantityDelivered)

INDEX: (RestaurantId, OrderId)
INDEX: (RestaurantId, RecoveredAt) WHERE RecoveredAt IS NULL   -- vajilla pendiente
```

### DeliveryRound
```sql
Id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
RestaurantId    UUID NOT NULL REFERENCES Restaurant(Id)
SellerUserId    UUID NOT NULL REFERENCES User(Id)
StartedAt       TIMESTAMPTZ NOT NULL DEFAULT now()
ClosedAt        TIMESTAMPTZ             -- nullable mientras está abierta
Status          VARCHAR(50) NOT NULL    -- Open | Closed

INDEX: (RestaurantId, Status)
INDEX: (RestaurantId, SellerUserId, Status)
```

### RefreshToken
```sql
Id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
UserId              UUID NOT NULL REFERENCES User(Id)
RestaurantId        UUID NOT NULL REFERENCES Restaurant(Id)
TokenHash           VARCHAR(255) NOT NULL UNIQUE
ExpiresAt           TIMESTAMPTZ NOT NULL
RevokedAt           TIMESTAMPTZ             -- nullable
ReplacedByTokenId   UUID REFERENCES RefreshToken(Id)   -- nullable
CreatedAt           TIMESTAMPTZ NOT NULL DEFAULT now()
CreatedByIp         VARCHAR(45)

INDEX: (TokenHash)
INDEX: (UserId, ExpiresAt)
```

### AuditLog
```sql
Id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
UserId          UUID                            -- nullable si es acción de sistema
RestaurantId    UUID                            -- nullable para SuperAdmin
EntityType      VARCHAR(100) NOT NULL           -- "Order" | "Client" | etc.
EntityId        UUID NOT NULL
Action          VARCHAR(100) NOT NULL           -- "StatusChanged" | "Created" | "Deleted" | etc.
OldValue        JSONB
NewValue        JSONB
Timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
IpAddress       VARCHAR(45)

INDEX: (RestaurantId, EntityType, Timestamp DESC)
INDEX: (EntityType, EntityId)
```

---

## Migraciones aplicadas

| # | Nombre | Fecha | Descripción |
|---|---|---|---|
| 001 | InitialCreate | — | Entidades base: Restaurant, User, Client, MenuItem, Order, OrderDetail |
| 002 | AddTableSeeder | — | Mesas 1-11 por seeder |
| *(pendientes)* | AddRefreshTokens | — | Fase 0 |
| *(pendientes)* | AddAuditLog | — | Fase 0 |
| *(pendientes)* | AddOrderTableware | — | Fase 1 |
| *(pendientes)* | AddDeliveryRound | — | Fase 1 |
| *(pendientes)* | AddSoftDelete | — | Fase 0 |
| *(pendientes)* | AddFeatureFlags | — | Fase 1 |
| *(pendientes)* | AddCompositeIndexes | — | Fase 0 |

---

## Notas de precisión

- Todos los campos `Price`, `UnitPrice`, `Subtotal`, `Total`: `DECIMAL(10,2)`, configurado explícitamente en EF con `HasPrecision(10, 2)`
- Todos los timestamps: `TIMESTAMPTZ` (con zona horaria). Siempre almacenar UTC, convertir a `America/Mexico_City` en el frontend
- UUIDs generados en la base de datos con `gen_random_uuid()`, no en la aplicación
- Soft delete: todos los modelos principales tienen `IsDeleted BOOLEAN DEFAULT false` + global query filter en EF

---

## Cómo regenerar este documento

```bash
# Exportar schema actual de PostgreSQL
pg_dump --schema-only --no-owner -d $DATABASE_URL > docs/schema_dump.sql

# Luego actualizar manualmente las secciones de este archivo
# que hayan cambiado, y registrar la migración en la tabla de arriba
```
