import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../api/menuItems'
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '../types'
import { Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface MenuItemModalProps {
  item?: MenuItem
  onClose: () => void
}

function MenuItemModal({ item, onClose }: MenuItemModalProps) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '')
  const [precio, setPrecio] = useState(item ? String(item.precio) : '')

  const createMutation = useMutation({
    mutationFn: (dto: CreateMenuItemDto) => createMenuItem(dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menuItems'] }); onClose() },
  })

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateMenuItemDto) => updateMenuItem(item!.id, dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menuItems'] }); onClose() },
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const isError = createMutation.isError || updateMutation.isError
  const precioNum = parseFloat(precio)
  const isValid = nombre.trim() && !isNaN(precioNum) && precioNum > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    if (item) {
      updateMutation.mutate({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, precio: precioNum, disponible: item.disponible })
    } else {
      createMutation.mutate({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, precio: precioNum })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">{item ? 'Editar platillo' : 'Nuevo platillo'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Caldo de res"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej. Con verduras y arroz"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Error al guardar el platillo. Intenta de nuevo.
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || isPending}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {isPending ? 'Guardando...' : item ? 'Guardar cambios' : 'Agregar platillo'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MenuPage() {
  const queryClient = useQueryClient()
  const [modalItem, setModalItem] = useState<MenuItem | null | undefined>(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data: items, isLoading, isError } = useQuery({ queryKey: ['menuItems'], queryFn: getMenuItems })

  const toggleMutation = useMutation({
    mutationFn: (item: MenuItem) =>
      updateMenuItem(item.id, { nombre: item.nombre, descripcion: item.descripcion ?? undefined, precio: item.precio, disponible: !item.disponible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menuItems'] }); setConfirmDeleteId(null) },
  })

  if (isLoading) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando menú...</div>
  if (isError) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error al cargar el menú.</div>

  const disponibles = items?.filter(m => m.disponible) ?? []
  const noDisponibles = items?.filter(m => !m.disponible) ?? []

  return (
    <div>
      {modalItem !== undefined && (
        <MenuItemModal item={modalItem ?? undefined} onClose={() => setModalItem(undefined)} />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menú</h1>
          <p className="text-sm text-gray-500 mt-0.5">{disponibles.length} disponibles · {noDisponibles.length} no disponibles</p>
        </div>
        <button
          onClick={() => setModalItem(null)}
          className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="grid gap-3">
        {[...disponibles, ...noDisponibles].map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 transition-opacity ${!item.disponible ? 'opacity-50 border-gray-200' : 'border-gray-200'}`}
          >
            {confirmDeleteId === item.id ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 font-medium">
                  ¿Eliminar <span className="text-red-600">{item.nombre}</span>?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 truncate">{item.nombre}</p>
                    {!item.disponible && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        No disponible
                      </span>
                    )}
                  </div>
                  {item.descripcion && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.descripcion}</p>}
                  <p className="text-sm font-bold text-orange-600 mt-1">${item.precio.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate(item)}
                    disabled={toggleMutation.isPending}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    title={item.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                  >
                    {item.disponible
                      ? <ToggleRight className="w-5 h-5 text-orange-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => setModalItem(item)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 border border-gray-200 hover:border-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
