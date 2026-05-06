import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, createClient, deleteClient } from '../api/clients'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Navigation, X, UserPlus, Trash2 } from 'lucide-react'

function NewClientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'Plaza' | 'Externo'>('Plaza')
  const [numeroLocal, setNumeroLocal] = useState('')
  const [referencia, setReferencia] = useState('')
  const [telefono, setTelefono] = useState('')

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClose()
    },
  })

  const isValid = nombre.trim() &&
    (tipo === 'Plaza' ? numeroLocal.trim() : referencia.trim())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    mutation.mutate({
      nombre: nombre.trim(),
      tipo,
      numeroLocal: tipo === 'Plaza' ? numeroLocal.trim() : undefined,
      referencia: tipo === 'Externo' ? referencia.trim() : undefined,
      telefono: telefono.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Nuevo cliente</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Tacos El Güero"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de cliente <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('Plaza')}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  tipo === 'Plaza'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 text-gray-600 hover:border-orange-300'
                }`}
              >
                Dentro de la plaza
              </button>
              <button
                type="button"
                onClick={() => setTipo('Externo')}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  tipo === 'Externo'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 text-gray-600 hover:border-orange-300'
                }`}
              >
                Externo al sector
              </button>
            </div>
          </div>

          {tipo === 'Plaza' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de local <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroLocal}
                onChange={e => setNumeroLocal(e.target.value)}
                placeholder="Ej. A-12"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de ubicación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ej. Av. Ferrocarril 14, frente al metro"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Ej. 5512345678"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Error al guardar el cliente. Intenta de nuevo.
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setConfirmDeleteId(null)
    },
  })

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
      {showModal && <NewClientModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes activos</h1>
          <p className="text-sm text-gray-500 mt-1">{activos.length} cliente(s) disponibles hoy</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo cliente
        </button>
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
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {confirmDeleteId === client.id ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 font-medium">
                    ¿Eliminar a <span className="text-red-600">{client.nombre}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(client.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                      {client.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{client.nombre}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {client.tipo === 'Plaza' ? (
                          <><MapPin className="w-3 h-3" /> Local {client.numeroLocal}</>
                        ) : (
                          <><Navigation className="w-3 h-3" /> {client.referencia}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(client.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/nuevo-pedido/${client.id}`)}
                      className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo pedido
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
