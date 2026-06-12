import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDailyAvailability, updateDailyAvailability } from '../api/packages'
import type { DailyOptionDto } from '../types'
import { Save, RefreshCw } from 'lucide-react'

export default function DailyMenuPage() {
  const queryClient = useQueryClient()
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})

  const { data: options, isLoading, isError } = useQuery({
    queryKey: ['daily-availability'],
    queryFn: getDailyAvailability,
  })

  const mutation = useMutation({
    mutationFn: () =>
      updateDailyAvailability(
        Object.entries(pendingChanges).map(([optionId, disponibleHoy]) => ({
          optionId,
          disponibleHoy,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-availability'] })
      setPendingChanges({})
    },
  })

  // Agrupar: packageName → groupName → options[]
  const grouped = useMemo(() => {
    if (!options) return {} as Record<string, Record<string, DailyOptionDto[]>>
    return options.reduce((acc, opt) => {
      if (!acc[opt.packageName]) acc[opt.packageName] = {}
      if (!acc[opt.packageName][opt.groupName]) acc[opt.packageName][opt.groupName] = []
      acc[opt.packageName][opt.groupName].push(opt)
      return acc
    }, {} as Record<string, Record<string, DailyOptionDto[]>>)
  }, [options])

  const getEffective = (opt: DailyOptionDto): boolean =>
    opt.id in pendingChanges ? pendingChanges[opt.id] : opt.isAvailableToday

  const toggleOption = (optId: string, currentEffective: boolean) => {
    setPendingChanges(prev => ({ ...prev, [optId]: !currentEffective }))
  }

  const hasPendingChanges = Object.keys(pendingChanges).length > 0
  const packageNames = Object.keys(grouped)

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando menú del día...
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Error al cargar el menú del día.
    </div>
  )

  if (packageNames.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-lg font-medium">Sin opciones rotativas</p>
      <p className="text-sm mt-1">
        No hay opciones con rotación diaria configuradas. Activa "Rotación diaria"
        en los paquetes del menú.
      </p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menú del día</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Activa o desactiva las opciones disponibles hoy
          </p>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!hasPendingChanges || mutation.isPending}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
        >
          {mutation.isPending
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> Guardar cambios {hasPendingChanges ? `(${Object.keys(pendingChanges).length})` : ''}</>
          }
        </button>
      </div>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Error al guardar. Intenta de nuevo.
        </div>
      )}

      {mutation.isSuccess && !hasPendingChanges && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">
          Cambios guardados correctamente.
        </div>
      )}

      <div className="space-y-6">
        {packageNames.map(pkgName => (
          <div key={pkgName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-800">{pkgName}</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {Object.entries(grouped[pkgName]).map(([groupName, opts]) => (
                <div key={groupName} className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {groupName}
                  </p>
                  <div className="space-y-2">
                    {opts.map(opt => {
                      const effective = getEffective(opt)
                      const isDirty = opt.id in pendingChanges

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                            isDirty ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className={`text-sm font-medium ${effective ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                              {opt.name}
                            </p>
                            {opt.extraPrice > 0 && (
                              <p className="text-xs text-orange-500 mt-0.5">
                                +${opt.extraPrice.toFixed(2)}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => toggleOption(opt.id, effective)}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                              effective ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            title={effective ? 'Disponible hoy — click para desactivar' : 'No disponible — click para activar'}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              effective ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
