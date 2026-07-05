// Estos tipos reflejan exactamente lo que devuelve tu backend .NET

export interface Client {
  id: number
  nombre: string
  tipo: 'Externo' | 'Domicilio' | 'Mesa'
  numeroLocal: string | null
  referencia: string | null
  telefono: string | null
  direccionEntrega: string | null
  referenciaDomicilio: string | null
  activo: boolean
}

export interface MenuItem {
  id: number
  nombre: string
  descripcion: string
  precio: number
  disponible: boolean
  toGoSurcharge?: number
  hasActivePackageGroups: boolean
}

export interface OrderDetail {
  id: number
  articuloId: number
  nombreArticulo: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  createdAt: string
  notas?: string | null
  isToGo?: boolean
  selections?: OrderDetailSelectionDto[]
}

export interface Order {
  id: number
  clienteId: number
  nombreCliente: string
  localCliente: string | null
  referenciaCliente: string | null
  tipoCliente: string // "Externo" | "Domicilio" | "Mesa"
  fechaPedido: string
  estado: string // "Pendiente" | "Entregado" | "Cancelado"
  estadoCobro: string // "Pendiente de cobro" | "Cobrado"
  notas: string
  total: number
  articulos: OrderDetail[]
}

export interface DailySummaryCliente {
  clienteId: number
  nombreCliente: string
  tipo: string
  referencia: string | null
  totalACobrar: number
  totalCobrado: number
}

export interface DailySummary {
  fechaInicio: string
  fechaFin: string
  totalPedidos: number
  clientes: DailySummaryCliente[]
  totalGeneral: number
  totalCobrado: number
}

export interface CreateMenuItemDto {
  nombre: string
  descripcion?: string
  precio: number
  toGoSurcharge?: number
}

export interface UpdateMenuItemDto {
  nombre: string
  descripcion?: string
  precio: number
  disponible: boolean
  toGoSurcharge?: number
}

// Lo que se manda al crear un pedido
export interface CreateOrderDetailDto {
  articuloId: number
  cantidad: number
  notas?: string
  isToGo?: boolean
  selecciones?: SelectionRequest[]
}

export interface CreateOrderDto {
  clienteId: number
  notas: string
  articulos: CreateOrderDetailDto[]
}

export interface Tableware {
  id: number
  orderId: number
  nombreCliente: string
  referencia: string | null
  itemType: string
  quantityDelivered: number
  quantityRecovered: number | null
  pendiente: number
  deliveredAt: string
  recoveredAt: string | null
}

export interface RegisterTablewareDto {
  orderId: number
  itemType: string
  quantityDelivered: number
}

export interface RecoverTablewareDto {
  quantityRecovered: number
}

export interface CreateClientDto {
  nombre: string
  tipo: 'Externo' | 'Domicilio' | 'Mesa'
  referencia?: string
  telefono?: string
  direccionEntrega?: string
  referenciaDomicilio?: string
}

// ── Paquetes con opciones ─────────────────────────────────────────────────────

export interface PackageOptionDto {
  id: string            // Guid
  name: string
  extraPrice: number
  isDailyRotating: boolean
  isAvailableToday: boolean
}

export interface PackageGroupDto {
  id: string            // Guid
  name: string
  minSelections: number
  maxSelections: number
  allowExtra: boolean
  isCountingGroup: boolean
  sortOrder: number
  options: PackageOptionDto[]
}

export interface PackageDto {
  id: number            // int — mismo que MenuItem.Id
  name: string
  description?: string
  price: number
  toGoSurcharge: number
  isAvailable: boolean
  groups: PackageGroupDto[]
}

export interface SelectionRequest {
  groupId: string
  optionId: string
  quantity: number
}

export interface AddOrderDetailRequest {
  menuItemId: number    // int
  quantity: number
  isToGo: boolean
  notes?: string
  selections: SelectionRequest[]
}

// Response de POST /api/orders/{orderId}/details
export interface OrderDetailSelectionDto {
  id: string
  packageGroupId: string
  groupName: string
  packageOptionId: string
  optionNameSnapshot: string
  extraPriceSnapshot: number
  quantity: number
}

export interface OrderDetailDto {
  id: number
  orderId: number
  menuItemId: number
  menuItemName: string
  quantity: number
  unitPrice: number
  subtotal: number
  isToGo: boolean
  notes?: string
  selections: OrderDetailSelectionDto[]
}

// ── Disponibilidad diaria ─────────────────────────────────────────────────────

export interface DailyOptionDto {
  id: string
  name: string
  extraPrice: number
  isAvailableToday: boolean
  groupName: string
  packageName: string
}

export interface DailyAvailabilityUpdateItem {
  optionId: string
  disponibleHoy: boolean
}

export interface CreatePackageOptionRequest {
  nombre: string
  precioExtra: number
  esRotacionDiaria: boolean
  disponibleHoy?: boolean
}
