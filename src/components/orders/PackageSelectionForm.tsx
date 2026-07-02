import { useState, useMemo } from 'react'
import { X, ShoppingBag, Truck, Plus, Minus } from 'lucide-react'
import type { PackageDto, PackageGroupDto, SelectionRequest } from '../../types'

interface Props {
  pkg: PackageDto
  onConfirm: (data: {
    menuItemId: number
    isToGo: boolean
    notes?: string
    selections: SelectionRequest[]
  }) => void
  onCancel: () => void
  confirmLabel?: string
  isSubmitting?: boolean
  error?: string | null
}

// groupId → { optionId: quantity }
type SelectionState = Record<string, Record<string, number>>

export default function PackageSelectionForm({
  pkg,
  onConfirm,
  onCancel,
  confirmLabel = 'Agregar al pedido',
  isSubmitting = false,
  error = null,
}: Props) {
  const [selections, setSelections] = useState<SelectionState>({})
  const [isToGo, setIsToGo] = useState(false)
  const [notes, setNotes] = useState('')

  // ── Helpers de cantidad ───────────────────────────────────────────────────

  const getQty = (groupId: string, optionId: string): number =>
    selections[groupId]?.[optionId] ?? 0

  const incrementOption = (group: PackageGroupDto, optionId: string) => {
    // Radio: maxSelections=1 && !allowExtra → reemplaza todo el grupo
    if (!group.allowExtra && group.maxSelections === 1) {
      setSelections(prev => ({ ...prev, [group.id]: { [optionId]: 1 } }))
      return
    }

    const groupOpts = selections[group.id] ?? {}
    const totalQty = Object.values(groupOpts).reduce((a, b) => a + b, 0)

    // Sin allowExtra: bloquear si se alcanzó el límite total
    if (!group.allowExtra && totalQty >= group.maxSelections) return

    setSelections(prev => ({
      ...prev,
      [group.id]: {
        ...groupOpts,
        [optionId]: (groupOpts[optionId] ?? 0) + 1,
      },
    }))
  }

  const decrementOption = (groupId: string, optionId: string) => {
    const groupOpts = selections[groupId] ?? {}
    const current = groupOpts[optionId] ?? 0
    if (current <= 0) return

    if (current === 1) {
      // Eliminar la entrada si llega a 0
      const { [optionId]: _, ...rest } = groupOpts
      if (Object.keys(rest).length === 0) {
        setSelections(prev => {
          const { [groupId]: __, ...outer } = prev
          return outer
        })
      } else {
        setSelections(prev => ({ ...prev, [groupId]: rest }))
      }
      return
    }

    setSelections(prev => ({
      ...prev,
      [groupId]: { ...groupOpts, [optionId]: current - 1 },
    }))
  }

  // ── Precio en tiempo real ─────────────────────────────────────────────────

  const { corridos, extrasTotal } = useMemo(() => {
    let corridos = 0
    let extrasTotal = 0
    for (const group of pkg.groups) {
      const groupOpts = selections[group.id] ?? {}
      for (const [optId, qty] of Object.entries(groupOpts)) {
        if (group.isCountingGroup) corridos += qty
        const opt = group.options.find(o => o.id === optId)
        extrasTotal += (opt?.extraPrice ?? 0) * qty
      }
    }
    return { corridos, extrasTotal }
  }, [selections, pkg.groups])

  const baseQty = Math.max(corridos, 1)
  const toGoAmount = isToGo ? pkg.toGoSurcharge * baseQty : 0
  const totalPrice = pkg.price * baseQty + extrasTotal + toGoAmount

  // ── Validación ────────────────────────────────────────────────────────────

  const isValid = useMemo(() =>
    pkg.groups
      .filter(g => g.minSelections > 0)
      .every(g => {
        const total = Object.values(selections[g.id] ?? {}).reduce((a, b) => a + b, 0)
        return total >= g.minSelections
      }),
    [selections, pkg.groups]
  )

  // ── Confirm ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    const allSelections: SelectionRequest[] = Object.entries(selections).flatMap(
      ([groupId, opts]) =>
        Object.entries(opts)
          .filter(([, qty]) => qty > 0)
          .map(([optionId, quantity]) => ({ groupId, optionId, quantity }))
    )
    onConfirm({
      menuItemId: pkg.id,
      isToGo,
      notes: notes.trim() || undefined,
      selections: allSelections,
    })
  }

  const sortedGroups = [...pkg.groups].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
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
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grupos y opciones */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {sortedGroups.map(group => {
            const groupOpts = selections[group.id] ?? {}
            const totalQty = Object.values(groupOpts).reduce((a, b) => a + b, 0)
            const isGroupSatisfied = totalQty >= group.minSelections
            const availableOptions = group.options.filter(o => o.isAvailableToday)
            const groupCorridos = group.isCountingGroup ? totalQty : null

            return (
              <div key={group.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 inline">
                      {group.name}
                    </h3>
                    {group.minSelections > 0 && (
                      <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        isGroupSatisfied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isGroupSatisfied ? '✓' : 'Requerido'}
                      </span>
                    )}
                    {groupCorridos !== null && (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                        Corridos: {groupCorridos}
                      </p>
                    )}
                  </div>
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
                  <div className="space-y-2">
                    {availableOptions.map(opt => {
                      const qty = getQty(group.id, opt.id)

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                            qty > 0
                              ? 'bg-orange-50 border-orange-400'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* Nombre y extra */}
                          <div className="flex-1 min-w-0 pr-2">
                            <span className={`text-sm font-medium leading-tight ${
                              qty > 0 ? 'text-orange-800' : 'text-gray-700'
                            }`}>
                              {opt.name}
                            </span>
                            {opt.extraPrice > 0 && (
                              <span className={`ml-1.5 text-[10px] font-semibold ${
                                qty > 0 ? 'text-orange-500' : 'text-gray-400'
                              }`}>
                                +${opt.extraPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {qty > 0 ? (
                              <>
                                <button
                                  onClick={() => decrementOption(group.id, opt.id)}
                                  className="w-10 h-10 flex items-center justify-center rounded-full border border-orange-300 bg-white text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center font-bold text-gray-800 text-sm">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => incrementOption(group, opt.id)}
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => incrementOption(group, opt.id)}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:border-orange-400 hover:text-orange-500 active:bg-orange-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
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
                <span className="text-xs text-gray-500">+${pkg.toGoSurcharge.toFixed(2)} × {baseQty}</span>
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
            <div>
              <span className="text-sm text-gray-500">Total estimado</span>
              {corridos > 0 && (
                <p className="text-[11px] text-amber-600">{corridos} corrido{corridos !== 1 ? 's' : ''}</p>
              )}
            </div>
            <span className="text-xl font-bold text-gray-800">${totalPrice.toFixed(2)}</span>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {isSubmitting ? 'Agregando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
