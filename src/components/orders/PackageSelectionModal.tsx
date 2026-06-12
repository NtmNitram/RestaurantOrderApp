import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check, ShoppingBag, Truck } from 'lucide-react'
import { addOrderDetail } from '../../api/orders'
import type { PackageDto, PackageGroupDto, SelectionRequest } from '../../types'

interface Props {
  pkg: PackageDto
  orderId: number
  onClose: () => void
  onSuccess: () => void
}

export default function PackageSelectionModal({ pkg, orderId, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()

  // groupId → array de optionIds seleccionados
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [isToGo, setIsToGo] = useState(false)
  const [notes, setNotes] = useState('')

  // ── Precio en tiempo real ─────────────────────────────────────────────────
  const totalPrice = useMemo(() => {
    const extras = pkg.groups.flatMap(g =>
      (selections[g.id] ?? []).map(optId => {
        const opt = g.options.find(o => o.id === optId)
        return opt?.extraPrice ?? 0
      })
    ).reduce((a, b) => a + b, 0)
    return pkg.price + extras + (isToGo ? pkg.toGoSurcharge : 0)
  }, [selections, isToGo, pkg])

  // ── Validación ────────────────────────────────────────────────────────────
  const isValid = useMemo(() =>
    pkg.groups
      .filter(g => g.minSelections > 0)
      .every(g => (selections[g.id]?.length ?? 0) >= g.minSelections),
    [selections, pkg.groups]
  )

  // ── Lógica de selección ───────────────────────────────────────────────────
  const toggleOption = (group: PackageGroupDto, optionId: string) => {
    const current = selections[group.id] ?? []
    const alreadySelected = current.includes(optionId)

    if (alreadySelected) {
      setSelections(prev => {
        const next = current.filter(id => id !== optionId)
        if (next.length === 0) {
          const { [group.id]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [group.id]: next }
      })
      return
    }

    // Selección única: reemplaza si maxSelections=1 y no allowExtra
    if (!group.allowExtra && group.maxSelections === 1) {
      setSelections(prev => ({ ...prev, [group.id]: [optionId] }))
      return
    }

    // Selección múltiple: bloquear si se alcanzó el límite sin allowExtra
    if (!group.allowExtra && current.length >= group.maxSelections) return

    setSelections(prev => ({ ...prev, [group.id]: [...current, optionId] }))
  }

  // ── Mutación ──────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => {
      const allSelections: SelectionRequest[] = pkg.groups.flatMap(g =>
        (selections[g.id] ?? []).map(optId => ({ groupId: g.id, optionId: optId }))
      )
      return addOrderDetail(orderId, {
        menuItemId: pkg.id,
        quantity: 1,
        isToGo,
        notes: notes.trim() || undefined,
        selections: allSelections,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      onSuccess()
    },
  })

  const sortedGroups = [...pkg.groups].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-base font-bold text-gray-800 truncate">{pkg.name}</h2>
            {pkg.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.description}</p>
            )}
            <p className="text-sm font-semibold text-orange-600 mt-1">
              Base ${pkg.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grupos y opciones */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {sortedGroups.map(group => {
            const selectedForGroup = selections[group.id] ?? []
            const isGroupSatisfied = selectedForGroup.length >= group.minSelections
            const availableOptions = group.options.filter(o => o.isAvailableToday)

            return (
              <div key={group.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {group.name}
                    {group.minSelections > 0 && (
                      <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        isGroupSatisfied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isGroupSatisfied ? '✓' : 'Requerido'}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {group.allowExtra
                      ? `Mín. ${group.minSelections}`
                      : group.maxSelections === 1
                        ? 'Elige 1'
                        : `Elige ${group.minSelections}–${group.maxSelections}`
                    }
                  </p>
                </div>

                {availableOptions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-1">
                    No hay opciones disponibles hoy para este grupo.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableOptions.map(opt => {
                      const isSelected = selectedForGroup.includes(opt.id)
                      const isExtra = group.allowExtra && selectedForGroup.indexOf(opt.id) >= group.maxSelections

                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleOption(group, opt.id)}
                          className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'bg-orange-50 border-orange-400 text-orange-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
                          }`}
                        >
                          <span className="text-sm font-medium leading-tight flex-1 pr-1">
                            {opt.name}
                          </span>
                          <span className="flex flex-col items-end flex-shrink-0 ml-1">
                            {opt.extraPrice > 0 && (
                              <span className={`text-[10px] font-semibold ${
                                isExtra ? 'text-orange-600' : isSelected ? 'text-orange-500' : 'text-gray-400'
                              }`}>
                                +${opt.extraPrice.toFixed(2)}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Nota del artículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Sin cilantro, extra picante..."
              maxLength={300}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Footer: toggle para llevar + precio + botón */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {pkg.toGoSurcharge > 0 && (
            <button
              onClick={() => setIsToGo(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors ${
                isToGo
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Truck className="w-4 h-4" />
                Para llevar
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-500">+${pkg.toGoSurcharge.toFixed(2)}</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${
                  isToGo ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    isToGo ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </span>
            </button>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-500">Total por unidad</span>
            <span className="text-xl font-bold text-gray-800">${totalPrice.toFixed(2)}</span>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {(mutation.error as Error)?.message ?? 'Error al agregar el paquete. Intenta de nuevo.'}
            </p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {mutation.isPending ? 'Agregando...' : 'Agregar al pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
