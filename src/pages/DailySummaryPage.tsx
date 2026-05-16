import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailySummary } from '../api/orders'
import { TrendingUp, Navigation, Banknote, Clock, CalendarDays } from 'lucide-react'

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const today = toLocalDateString(new Date())

export default function DailySummaryPage() {
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const isToday = startDate === today && endDate === today
  const isSameDay = startDate === endDate

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['daily-summary', startDate, endDate],
    queryFn: () => getDailySummary({ startDate, endDate }),
  })

  const handleStartChange = (val: string) => {
    setStartDate(val)
    if (val > endDate) setEndDate(val)
  }

  const handleEndChange = (val: string) => {
    setEndDate(val)
    if (val < startDate) setStartDate(val)
  }

  const goToToday = () => {
    setStartDate(today)
    setEndDate(today)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Resumen</h1>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Desde</label>
            <input
              type="date"
              value={startDate}
              max={today}
              onChange={e => handleStartChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Hasta</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={e => handleEndChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {!isToday && (
            <button
              onClick={goToToday}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Hoy
            </button>
          )}
        </div>

        {summary && (
          <p className="text-sm text-gray-500 mt-2 capitalize">
            {isSameDay
              ? formatDate(startDate)
              : `${formatDate(startDate)} — ${formatDate(endDate)}`}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          Cargando resumen...
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error al cargar el resumen.
        </div>
      )}

      {!isLoading && !isError && (!summary || summary.clientes.length === 0) && (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Sin ventas en este período</p>
          <p className="text-sm mt-1">Ajusta el rango de fechas para ver más resultados</p>
        </div>
      )}

      {!isLoading && !isError && summary && summary.clientes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pedidos</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{summary.totalPedidos}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">${summary.totalGeneral.toFixed(2)}</p>
            </div>
            <div className="bg-orange-500 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-100 shrink-0" />
              <div>
                <p className="text-xs text-orange-100">Por cobrar</p>
                <p className="text-2xl font-bold text-white">${(summary.totalGeneral - summary.totalCobrado).toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-green-500 rounded-xl p-4 flex items-center gap-3">
              <Banknote className="w-6 h-6 text-green-100 shrink-0" />
              <div>
                <p className="text-xs text-green-100">Cobrado</p>
                <p className="text-2xl font-bold text-white">${summary.totalCobrado.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Por cliente
          </h2>

          <div className="grid gap-3">
            {summary.clientes.map(item => (
              <div
                key={item.clienteId}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                      {item.nombreCliente.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.nombreCliente}</p>
                      {item.referencia && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3" />{item.referencia}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.totalACobrar > 0 && (
                      <p className="text-sm font-semibold text-orange-600">${item.totalACobrar.toFixed(2)} por cobrar</p>
                    )}
                    {item.totalCobrado > 0 && (
                      <p className="text-sm font-semibold text-green-600">${item.totalCobrado.toFixed(2)} cobrado</p>
                    )}
                    {item.totalACobrar === 0 && item.totalCobrado === 0 && (
                      <p className="text-sm text-gray-400">$0.00</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
