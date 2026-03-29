import { useQuery } from '@tanstack/react-query'
import { getClients } from '../api/clients'
import { useNavigate } from 'react-router-dom'

export default function ClientsPage() {
  const navigate = useNavigate()

  // useQuery es como un servicio que trae datos automáticamente.
  // 'clients' es la clave de caché — React Query no vuelve a pedir si ya tiene los datos frescos.
  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  if (isLoading) return <p className="text-gray-500">Cargando clientes...</p>
  if (isError) return <p className="text-red-500">Error al cargar clientes.</p>

  const activos = clients?.filter(c => c.activo) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Clientes activos</h1>

      {activos.length === 0 ? (
        <p className="text-gray-500">No hay clientes activos.</p>
      ) : (
        <div className="grid gap-3">
          {activos.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{client.nombre}</p>
                <p className="text-sm text-gray-500">Local {client.numeroLocal}</p>
              </div>
              <button
                onClick={() => navigate(`/nuevo-pedido/${client.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Nuevo pedido
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
