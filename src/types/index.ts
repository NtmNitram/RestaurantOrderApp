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
}

export interface OrderDetail {
  id: number
  articuloId: number
  nombreArticulo: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Order {
  id: number
  clienteId: number
  nombreCliente: string
  localCliente: string | null
  referenciaCliente: string | null
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
}

export interface UpdateMenuItemDto {
  nombre: string
  descripcion?: string
  precio: number
  disponible: boolean
}

// Lo que se manda al crear un pedido
export interface CreateOrderDto {
  clienteId: number
  notas: string
  articulos: { articuloId: number; cantidad: number }[]
}

export interface CreateClientDto {
  nombre: string
  tipo: 'Externo' | 'Domicilio' | 'Mesa'
  referencia?: string
  telefono?: string
  direccionEntrega?: string
  referenciaDomicilio?: string
}
