// Estos tipos reflejan exactamente lo que devuelve tu backend .NET

export interface Client {
  id: number
  nombre: string
  numeroLocal: string
  telefono: string | null
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
  localCliente: string
  fechaPedido: string
  estado: string // "Pendiente" | "Entregado" | "Cancelado"
  notas: string
  total: number
  articulos: OrderDetail[]
}

export interface DailySummaryCliente {
  clienteId: number
  nombreCliente: string
  numeroLocal: string
  totalACobrar: number
}

export interface DailySummary {
  fecha: string
  totalPedidos: number
  clientes: DailySummaryCliente[]
  totalGeneral: number
}

// Lo que se manda al crear un pedido
export interface CreateOrderDto {
  clienteId: number
  notas: string
  articulos: { articuloId: number; cantidad: number }[]
}
