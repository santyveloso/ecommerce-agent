import { useState, useEffect, useRef, useCallback } from 'react'
import { API } from './constants'
import { getAllMonths } from './CalendarHelpers'
import type { DashboardData } from './types'

export function useDashboardMetrics() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [dateRange, setDateRange] = useState<{ since: string; until: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dashCache = useRef<DashboardData | null>(null)
  const metricsCache = useRef<Record<string, any>>({})

  // Fetch only /dashboard (cached — só atualiza no mount + refresh manual)
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dashboard`)
      if (res.ok) {
        dashCache.current = await res.json()
      }
    } catch (err) {
      console.error('Dashboard fetch error', err)
    }
  }, [])

  // Fetch /dashboard/metrics para um preset (cacheado por preset)
  const fetchMetrics = useCallback(async (preset: string, since?: string, until?: string) => {
    const cached = metricsCache.current[preset] as DashboardData | null
    if (cached && !since && !until) return cached

    try {
      const params = since && until
        ? `preset=${preset}&since=${since}&until=${until}`
        : `preset=${preset}`
      const res = await fetch(`${API}/dashboard/metrics?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (!since) metricsCache.current[preset] = data
        return data
      }
    } catch (err) {
      console.error('Metrics fetch error', err)
    }
    return null
  }, [])

  // Merge dashCache + metrics e atualiza o estado
  const mergeAndSet = useCallback((dash: DashboardData, metrics: any) => {
    if (metrics) {
      dash.roas = metrics.roas
      dash.spend = metrics.spend
      dash.orders = metrics.orders
      dash.revenue = metrics.revenue
    }
    setDashboardData({ ...dash })
    setDashboardLoading(false)
  }, [])

  // Load inicial: dashboard + metrics today
  useEffect(() => {
    (async () => {
      setDashboardLoading(true)
      await fetchDashboardData()
      const dash = dashCache.current
      if (dash) {
        const metrics = await fetchMetrics('today')
        mergeAndSet(dash, metrics)
      }
    })()
  }, [])

  // Click outside to close date picker
  const pickerRef = useRef<HTMLDivElement>(null)
  const calScrollRef = useRef<HTMLDivElement>(null)
  const [calSince, setCalSince] = useState('')
  const [calUntil, setCalUntil] = useState('')
  const allMonths = getAllMonths()

  useEffect(() => {
    if (!showDatePicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDatePicker])

  // Muda período (incluindo custom)
  const changePeriod = useCallback(async (p: string, since?: string, until?: string) => {
    setPeriod(p)
    setShowDatePicker(false)
    if (since && until) {
      setDateRange({ since, until })
    } else {
      setDateRange(null)
    }

    if (!dashCache.current) {
      await fetchDashboardData()
    }

    const metrics = await fetchMetrics(p, since, until)
    if (dashCache.current) {
      mergeAndSet(dashCache.current, metrics)
    }
  }, [fetchDashboardData, fetchMetrics, mergeAndSet])

  // Refresh manual
  const handleRefresh = useCallback(async () => {
    setDashboardLoading(true)
    await fetchDashboardData()
    const dash = dashCache.current
    if (dash) {
      const preset = dateRange?.since
        ? 'custom'
        : period === 'today' ? 'today' : period === 'week' ? 'last_7' : 'this_month'
      const metrics = dateRange?.since
        ? await fetchMetrics('custom', dateRange.since, dateRange.until)
        : await fetchMetrics(preset)
      mergeAndSet(dash, metrics)
    } else {
      setDashboardLoading(false)
    }
  }, [fetchDashboardData, fetchMetrics, mergeAndSet, period, dateRange])

  return {
    dashboardData, dashboardLoading,
    period, dateRange, showDatePicker,
    setShowDatePicker, setDateRange,
    changePeriod, handleRefresh,
    pickerRef, calScrollRef,
    calSince, setCalSince, calUntil, setCalUntil,
    allMonths,
  }
}
