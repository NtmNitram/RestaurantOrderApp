import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, createClient, deleteClient } from '../api/clients'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Navigation, X, UserPlus, Trash2, Phone, Home, UtensilsCrossed, Search } from 'lucide-react'

function NewClientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'Externo' | 'Domicilio'>('Externo')
  const [referencia, setReferencia] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [referenciaDomicilio, setReferenciaDomicilio] = useState('')

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClose()
    },
  })

  const isValid = nombre.trim() && (
    tipo === 'Externo' ? true :
    direccionEntrega.trim() && telefono.trim()
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    mutation.mutate({
      nombre: nombre.trim(),
      tipo,
      referencia: tipo === 'Externo' ? referencia.trim() || undefined : undefined,
      telefono: telefono.trim() || undefined,
      direccionEntrega: tipo === 'Domicilio' ? direccionEntrega.trim() : undefined,
      referenciaDomicilio: tipo === 'Domicilio' ? referenciaDomicilio.trim() || undefined : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
              Nombre del negocio / cliente <span className="text-red-500">*</span>
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
              {(['Externo', 'Domicilio'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    tipo === t
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-300 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'Externo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de ubicación <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ej. Local 12, frente a: la farmacia"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}

          {tipo === 'Domicilio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={direccionEntrega}
                  onChange={e => setDireccionEntrega(e.target.value)}
                  placeholder="Ej. Calle Morelos 45, Col. Centro"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={referenciaDomicilio}
                  onChange={e => setReferenciaDomicilio(e.target.value)}
                  placeholder="Ej. Depto 3B, puerta azul"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono{tipo === 'Domicilio' && <span className="text-red-500"> *</span>}
              {tipo !== 'Domicilio' && <span className="text-gray-400 font-normal"> (opcional)</span>}
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

function ClientSubtitle({ client }: { client: { tipo: string; referencia: string | null; direccionEntrega: string | null; telefono: string | null } }) {
  if (client.tipo === 'Externo') return (
    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
      {client.referencia && <><Navigation className="w-3 h-3" /> {client.referencia}</>}
    </p>
  )
  return (
    <div className="mt-0.5 space-y-0.5">
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Home className="w-3 h-3" /> {client.direccionEntrega}
      </p>
      {client.telefono && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {client.telefono}
        </p>
      )}
    </div>
  )
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'mesas' | 'clientes'>('mesas')
  const [busqueda, setBusqueda] = useState('')
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
  const mesas = activos.filter(c => c.tipo === 'Mesa').sort((a, b) => {
    const n1 = parseInt(a.nombre.replace('Mesa ', ''))
    const n2 = parseInt(b.nombre.replace('Mesa ', ''))
    return n1 - n2
  })
  const clientesNormales = activos.filter(c => c.tipo !== 'Mesa')
  const q = busqueda.trim().toLowerCase()
  const clientesFiltrados = q
    ? clientesNormales.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q) ||
        c.referencia?.toLowerCase().includes(q) ||
        c.direccionEntrega?.toLowerCase().includes(q)
      )
    : clientesNormales
  const visibles = tab === 'mesas' ? mesas : clientesFiltrados

  return (
    <div>
      {showModal && <NewClientModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        {tab === 'clientes' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo cliente
          </button>
        )}
      </div>

      {tab === 'clientes' && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono, dirección..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-1 bg-gray-200 p-1 rounded-lg mb-5">
        <button
          onClick={() => { setTab('mesas'); setBusqueda('') }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'mesas' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Mesas ({mesas.length})
        </button>
        <button
          onClick={() => setTab('clientes')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'clientes' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Clientes ({clientesNormales.length})
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{tab === 'mesas' ? 'No hay mesas configuradas' : 'No hay clientes activos'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibles.map(client => (
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      client.tipo === 'Mesa' ? 'bg-gray-100 text-gray-600' :
                      client.tipo === 'Domicilio' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {client.tipo === 'Mesa'
                        ? <UtensilsCrossed className="w-4 h-4" />
                        : client.nombre.charAt(0)
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{client.nombre}</p>
                        {client.tipo === 'Domicilio' && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                            Domicilio
                          </span>
                        )}
                      </div>
                      {client.tipo !== 'Mesa' && <ClientSubtitle client={client} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.tipo !== 'Mesa' && (
                      <button
                        onClick={() => setConfirmDeleteId(client.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
