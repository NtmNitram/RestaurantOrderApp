import { useState, useCallback } from 'react'

const STORAGE_KEY = 'cocina-delivered-lines'

type DeliveredLines = Record<string, string[]>

function readStorage(): DeliveredLines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DeliveredLines) : {}
  } catch {
    return {}
  }
}

function writeStorage(data: DeliveredLines): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore — quota exceeded o no disponible
  }
}

export function useDeliveredLines() {
  const [state, setState] = useState<DeliveredLines>(readStorage)

  const isDelivered = useCallback(
    (orderId: number, lineKey: string) =>
      state[String(orderId)]?.includes(lineKey) ?? false,
    [state]
  )

  const toggle = useCallback((orderId: number, lineKey: string) => {
    setState(prev => {
      const key = String(orderId)
      const current = prev[key] ?? []
      const next = current.includes(lineKey)
        ? current.filter(k => k !== lineKey)
        : [...current, lineKey]
      const updated = { ...prev, [key]: next }
      writeStorage(updated)
      return updated
    })
  }, [])

  // Elimina del localStorage los pedidos que ya no están en la lista de pendientes.
  const cleanupStaleOrders = useCallback((activeOrderIds: number[]) => {
    setState(prev => {
      const activeKeys = new Set(activeOrderIds.map(String))
      const hasStale = Object.keys(prev).some(k => !activeKeys.has(k))
      if (!hasStale) return prev
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([k]) => activeKeys.has(k))
      )
      writeStorage(filtered)
      return filtered
    })
  }, [])

  return { isDelivered, toggle, cleanupStaleOrders }
}
