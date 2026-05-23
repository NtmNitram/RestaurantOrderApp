import { useEffect, useRef, useState } from 'react'
import { UtensilsCrossed, Volume2, VolumeX } from 'lucide-react'
import { useCocinaOrders } from '../hooks/useCocinaOrders'
import OrderCard from '../components/cocina/OrderCard'

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.6)
}

export default function CocinaPage() {
  const { data: orders, isLoading } = useCocinaOrders()
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [flash, setFlash] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevIdsRef = useRef<Set<number> | null>(null)

  const handleEnableAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    setAudioEnabled(true)
  }

  useEffect(() => {
    if (!orders) return

    const currentIds = new Set(orders.map(o => o.id))

    if (prevIdsRef.current === null) {
      // First load — baseline, no alert
      prevIdsRef.current = currentIds
      return
    }

    const hasNew = orders.some(o => !prevIdsRef.current!.has(o.id))

    if (hasNew) {
      setFlash(true)
      setTimeout(() => setFlash(false), 800)

      if (audioEnabled && audioCtxRef.current) {
        playBeep(audioCtxRef.current)
        setTimeout(() => playBeep(audioCtxRef.current!), 350)
      }
    }

    prevIdsRef.current = currentIds
  }, [orders, audioEnabled])

  const count = orders?.length ?? 0

  return (
    <div
      className="min-h-screen bg-gray-950 text-white px-4 py-5 transition-colors duration-300"
      style={flash ? { backgroundColor: '#7c2d12' } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-bold tracking-tight">Cocina</h1>
          {!isLoading && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              count > 0 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              {count} pendiente{count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          onClick={audioEnabled ? () => setAudioEnabled(false) : handleEnableAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            audioEnabled
              ? 'bg-green-800 text-green-200 hover:bg-green-700'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {audioEnabled ? 'Sonido activo' : 'Activar sonido'}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-600 text-lg">
            Cargando pedidos...
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <UtensilsCrossed className="w-14 h-14 mb-4 text-gray-700" />
            <p className="text-xl font-medium">Sin pedidos pendientes</p>
            <p className="text-sm mt-1">Actualizando cada 15 segundos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders!.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
