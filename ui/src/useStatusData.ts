import { useState, useEffect, useCallback } from 'react'
import { API } from './constants'

/**
 * Hook que gere o estado da página de status.
 * Faz fetch automático quando a tab 'status' fica ativa.
 */
export function useStatusData(activeTab: string) {
  const [statusData, setStatusData] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const r = await fetch(`${API}/status`)
      setStatusData(await r.json())
    } catch {
      setStatusData({ overall: 'error', connected: 0, total: 5, services: [] })
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'status' && !statusData) {
      fetchStatus()
    }
  }, [activeTab, fetchStatus])

  return {
    statusData,
    statusLoading,
    fetchStatus,
  }
}
