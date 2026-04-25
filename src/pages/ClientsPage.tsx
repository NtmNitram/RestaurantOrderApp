import { useQuery } from '@tanstack/react-query'
import { getClients } from '../api/clients'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'

export default function ClientsPage() {
  const navigate = useNavigate()

  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando clientes...
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Error al cargar clientes. Verifica que el servidor esté activo.
    </div>
  )

  const activos = clients?.filter(c => c.activo) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes activos</h1>
        <p className="text-sm text-gray-500 mt-1">{activos.length} cliente(s) disponibles hoy</p>
      </div>

      {activos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay clientes activos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activos.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                  {client.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{client.nombre}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    Local {client.numeroLocal}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/nuevo-pedido/${client.id}`)}
                className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo pedido
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
