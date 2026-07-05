import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDailyAvailability, updateDailyAvailability, getPackages, createPackageOption } from '../api/packages'
import type { DailyOptionDto } from '../types'
import { Save, RefreshCw, PlusCircle } from 'lucide-react'

interface GroupOption {
  packageId: number
  groupId: string
  label: string
  groupName: string
  isCountingGroup: boolean
}

export default function DailyMenuPage() {
  const queryClient = useQueryClient()

  // ── Toggle de disponibilidad ──────────��───────────────────────────────────
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})

  const { data: options, isLoading, isError } = useQuery({
    queryKey: ['daily-availability'],
    queryFn: getDailyAvailability,
  })

  const saveMutation = useMutation({
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

  // ── Formulario: agregar opción temporal ───────────────────────────────────
  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: getPackages,
  })

  const allGroups = useMemo<GroupOption[]>(() => {
    if (!packages) return []
    return packages.flatMap(pkg =>
      pkg.groups.map(g => ({
        packageId: pkg.id,
        groupId: g.id,
        label: `${pkg.name} › ${g.name}`,
        groupName: g.name,
        isCountingGroup: g.isCountingGroup,
      }))
    )
  }, [packages])

  const [selectedKey, setSelectedKey] = useState('')
  const [optionName, setOptionName] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Pre-seleccionar el grupo de conteo (isCountingGroup) si existe; si no, el primer grupo disponible.
  useEffect(() => {
    if (allGroups.length === 0 || selectedKey) return
    const countingGroup = allGroups.find(g => g.isCountingGroup === true)
    const initial = countingGroup ?? allGroups[0]
    setSelectedKey(`${initial.packageId}::${initial.groupId}`)
  }, [allGroups, selectedKey])

  const selectedGroup = useMemo<GroupOption | null>(() => {
    if (!selectedKey) return null
    const [pid, gid] = selectedKey.split('::')
    return allGroups.find(g => g.packageId === Number(pid) && g.groupId === gid) ?? null
  }, [selectedKey, allGroups])

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selectedGroup) throw new Error('Selecciona un grupo.')
      return createPackageOption(selectedGroup.packageId, selectedGroup.groupId, {
        nombre: optionName.trim(),
        precioExtra: 0,
        esRotacionDiaria: true,
        disponibleHoy: true,
      })
    },
    onSuccess: () => {
      setOptionName('')
      setAddError(null)
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)
      queryClient.invalidateQueries({ queryKey: ['daily-availability'] })
    },
    onError: (err: Error) => {
      setAddError(err.message || 'Error al agregar la opción. Intenta de nuevo.')
    },
  })

  // ── Helpers toggle ──────────────────���───────────────────────────���─────────
  const getEffective = (opt: DailyOptionDto): boolean =>
    opt.id in pendingChanges ? pendingChanges[opt.id] : opt.isAvailableToday

  const toggleOption = (optId: string, currentEffective: boolean) => {
    setPendingChanges(prev => ({ ...prev, [optId]: !currentEffective }))
  }

  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  // ── Agrupación para renderizado ─────────────���─────────────────��───────────
  const grouped = useMemo(() => {
    if (!options) return {} as Record<string, Record<string, DailyOptionDto[]>>
    return options.reduce((acc, opt) => {
      if (!acc[opt.packageName]) acc[opt.packageName] = {}
      if (!acc[opt.packageName][opt.groupName]) acc[opt.packageName][opt.groupName] = []
      acc[opt.packageName][opt.groupName].push(opt)
      return acc
    }, {} as Record<string, Record<string, DailyOptionDto[]>>)
  }, [options])

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
          onClick={() => saveMutation.mutate()}
          disabled={!hasPendingChanges || saveMutation.isPending}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
        >
          {saveMutation.isPending
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> Guardar cambios {hasPendingChanges ? `(${Object.keys(pendingChanges).length})` : ''}</>
          }
        </button>
      </div>

      {saveMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Error al guardar. Intenta de nuevo.
        </div>
      )}

      {saveMutation.isSuccess && !hasPendingChanges && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">
          Cambios guardados correctamente.
        </div>
      )}

      {/* Lista de opciones rotativas */}
      {packageNames.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sin opciones rotativas</p>
          <p className="text-sm mt-1">
            No hay opciones con rotación diaria configuradas. Activa "Rotación diaria"
            en los paquetes del menú.
          </p>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
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
      )}

      {/* Formulario: agregar opción temporal del día */}
      {allGroups.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <PlusCircle className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-gray-800">Agregar opción para hoy</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Se activa inmediatamente y se desactiva automáticamente a las 4 AM.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {allGroups.map(g => (
                <option key={`${g.packageId}::${g.groupId}`} value={`${g.packageId}::${g.groupId}`}>
                  {g.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={optionName}
              onChange={e => setOptionName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && optionName.trim() && selectedGroup && !addMutation.isPending)
                  addMutation.mutate()
              }}
              placeholder="Ej. Pollo en salsa roja"
              maxLength={100}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />

            <button
              onClick={() => addMutation.mutate()}
              disabled={!optionName.trim() || !selectedGroup || addMutation.isPending}
              className="flex items-center justify-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              {addMutation.isPending
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Agregando...</>
                : 'Agregar para hoy'
              }
            </button>
          </div>

          {addSuccess && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
              Opción agregada y activa para hoy.
            </p>
          )}

          {addError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              {addError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
