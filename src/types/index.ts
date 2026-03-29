// Estos tipos reflejan exactamente lo que devuelve tu backend .NET

export type OrderStatus = 0 | 1 | 2 // 0=Pending, 1=Delivered, 2=Cancelled

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

// TODO: confirmar nombres exactos del backend con Swagger
export interface OrderDetail {
  id: number
  pedidoId: number
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
  fechaPedido: string
  estado: OrderStatus
  notas: string
  total: number
  detalles: OrderDetail[]
}

export interface DailySummaryItem {
  clienteId: number
  nombreCliente: string
  totalPedidos: number
  totalMonto: number
}

// Lo que se manda al crear un pedido
export interface CreateOrderDto {
  clienteId: number
  notas: string
  articulos: { articuloId: number; cantidad: number }[]
}
