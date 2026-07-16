import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems } from '../api/menuItems'
import { getClients } from '../api/clients'
import { createOrder } from '../api/orders'
import { getPackages } from '../api/packages'
import PackageSelectionForm from '../components/orders/PackageSelectionForm'
import type { PackageDto, SelectionRequest } from '../types'
import { ArrowLeft, Plus, Minus, ShoppingBag, Search, Package, X, Truck } from 'lucide-react'

const safeNum = (n: number | undefined | null): number => (Number.isFinite(n) ? (n as number) : 0)

interface ConfiguredPackage {
  tempId: string          // crypto.randomUUID() — key de React y para poder borrar
  menuItemId: number
  nombre: string          // para mostrar en el carrito
  basePrice: number       // pkg.price, para el estimado
  isToGo: boolean
  notes?: string
  selections: SelectionRequest[]
  estimatedExtra: number  // suma de extraPrice de las opciones elegidas, para el estimado
}

export default function NewOrderPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [items, setItems] = useState<Record<number, number>>({})
  const [notas, setNotas] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [configuredPackages, setConfiguredPackages] = useState<ConfiguredPackage[]>([])
  const [packageForForm, setPackageForForm] = useState<PackageDto | null>(null)

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: menuItems, isLoading } = useQuery({ queryKey: ['menuItems'], queryFn: getMenuItems })
  const { data: packages, isError: isPackagesError } = useQuery({ queryKey: ['packages'], queryFn: getPackages })

  const packageMap = useMemo(() => {
    const m = new Map<number, PackageDto>()
    packages?.forEach(p => m.set(p.id, p))
    return m
  }, [packages])

  const client = clients?.find(c => c.id === Number(clientId))

  const describeSelections = (cfg: ConfiguredPackage): string => {
    const pkg = packageMap.get(cfg.menuItemId)
    if (!pkg) return ''
    const sortedGroups = [...pkg.groups].sort((a, b) => a.sortOrder - b.sortOrder)
    return sortedGroups
      .flatMap(g => cfg.selections
        .filter(sel => sel.groupId === g.id)
        .map(sel => g.options.find(o => o.id === sel.optionId)?.name)
      )
      .filter((name): name is string => Boolean(name))
      .join(', ')
  }

  const handlePackageConfirm = (data: {
    menuItemId: number
    isToGo: boolean
    notes?: string
    selections: SelectionRequest[]
  }) => {
    if (!packageForForm) return
    const estimatedExtra = data.selections.reduce((sum, sel) => {
      const group = packageForForm.groups.find(g => g.id === sel.groupId)
      const option = group?.options.find(o => o.id === sel.optionId)
      return sum + (option?.extraPrice ?? 0)
    }, 0)
    setConfiguredPackages(prev => [...prev, {
      tempId: crypto.randomUUID(),
      menuItemId: data.menuItemId,
      nombre: packageForForm.name,
      basePrice: packageForForm.price,
      isToGo: data.isToGo,
      notes: data.notes,
      selections: data.selections,
      estimatedExtra,
    }])
    setPackageForForm(null)
  }

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] })
      navigate('/pedidos')
    },
  })

  const changeQty = (articuloId: number, delta: number) => {
    setItems(prev => {
      const current = prev[articuloId] ?? 0
      const next = current + delta
      if (next <= 0) {
        const { [articuloId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [articuloId]: next }
    })
  }

  const handleSubmit = () => {
    const articulosALaCarte = Object.entries(items).map(([id, qty]) => ({
      articuloId: Number(id),
      cantidad: qty,
    }))
    const articulosPaquetes = configuredPackages.map(cfg => ({
      articuloId: cfg.menuItemId,
      cantidad: 1,
      isToGo: cfg.isToGo,
      notas: cfg.notes,
      selecciones: cfg.selections,
    }))
    const articulos = [...articulosALaCarte, ...articulosPaquetes]
    if (articulos.length === 0) return
    mutation.mutate({ clienteId: Number(clientId), notas, articulos })
  }

  const aLaCarteTotal = menuItems
    ? Object.entries(items).reduce((sum, [id, qty]) => {
        const item = menuItems.find(m => m.id === Number(id))
        return sum + safeNum(item?.precio) * qty
      }, 0)
    : 0

  const paquetesTotal = configuredPackages.reduce(
    (sum, cfg) => sum + safeNum(cfg.basePrice) + safeNum(cfg.estimatedExtra),
    0
  )

  const totalEstimado = aLaCarteTotal + paquetesTotal

  const cantidadItems = Object.values(items).reduce((a, b) => a + b, 0) + configuredPackages.length

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando menú...
    </div>
  )

  return (
    <div>
      {packageForForm && (
        <PackageSelectionForm
          pkg={packageForForm}
          onConfirm={handlePackageConfirm}
          onCancel={() => setPackageForForm(null)}
        />
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Nuevo pedido</h1>
        <p className="text-sm text-gray-500 mt-1">
          {client?.nombre}
          {client?.tipo === 'Externo' && client.referencia && ` · ${client.referencia}`}
          {client?.tipo === 'Domicilio' && ` · ${client.direccionEntrega}`}
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar platillo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {isPackagesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">
          No se pudieron cargar los paquetes (corridos). Los artículos individuales siguen disponibles. Intenta recargar la página.
        </div>
      )}

      <div className="grid gap-3 mb-4">
        {menuItems?.filter(m => m.disponible && m.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(item => {
          const pkg = packageMap.get(item.id)

          if (pkg) {
            return (
              <div
                key={item.id}
                className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-gray-800 truncate">{item.nombre}</p>
                    <span className="flex items-center gap-0.5 text-[10px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      <Package className="w-2.5 h-2.5" />
                      Paquete
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 font-medium mt-0.5">${item.precio.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setPackageForForm(pkg)}
                  className="flex-shrink-0 text-sm bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Configurar
                </button>
              </div>
            )
          }

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.nombre}</p>
                <p className="text-sm text-orange-600 font-medium mt-0.5">${item.precio.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeQty(item.id, -1)}
                  disabled={!items[item.id]}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-gray-800">{items[item.id] ?? 0}</span>
                <button
                  onClick={() => changeQty(item.id, 1)}
                  className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {configuredPackages.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">Paquetes agregados</p>
          {configuredPackages.map(cfg => {
            const detalle = describeSelections(cfg)
            const precioEstimado = safeNum(cfg.basePrice) + safeNum(cfg.estimatedExtra)
            return (
              <div
                key={cfg.tempId}
                className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{cfg.nombre}</p>
                  {detalle && <p className="text-xs text-gray-500 mt-0.5">{detalle}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {cfg.isToGo && (
                      <span className="flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        <Truck className="w-2.5 h-2.5" />
                        Para llevar
                      </span>
                    )}
                    <span className="text-sm text-orange-600 font-medium">${precioEstimado.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setConfiguredPackages(prev => prev.filter(p => p.tempId !== cfg.tempId))}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        placeholder="Notas del pedido (opcional)"
        className="w-full border border-gray-300 rounded-xl p-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
        rows={2}
      />

      {/* Espaciador para que el último ítem no quede tapado por la barra fija */}
      <div className="h-24" />

      {/* Barra flotante: total + confirmar pedido */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div
          className="max-w-4xl mx-auto px-4 pt-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
        >
          {mutation.isError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
              Error al crear el pedido. Intenta de nuevo.
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">{cantidadItems} artículo(s)</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Total estimado</p>
              <p className="text-xl font-bold text-gray-800">${totalEstimado.toFixed(2)}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={cantidadItems === 0 || mutation.isPending}
              className="flex-shrink-0 flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {mutation.isPending ? 'Enviando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
