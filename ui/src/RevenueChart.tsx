import { useState, useEffect, useRef, useCallback } from 'react'
import { formatCurrency } from './chart-helpers'
import AreaChart from './AreaChart'
import ChartTooltip from './ChartTooltip'
import './revenue-chart.css'

const API = 'http://localhost:7777'

interface ChartPoint {
  date: string
  revenue: number
}

interface ChartData {
  days: number
  start_date: string
  end_date: string
  currency: string
  total_revenue: number
  total_orders: number
  data: ChartPoint[]
}

const PERIOD_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

/* ── Main Component ───────────────────────────── */

export default function RevenueChart() {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(30)
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartPoint | null; x: number }>({ point: null, x: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async (days: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/dashboard/revenue-chart?days=${days}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setChartData(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const handleHover = useCallback((point: ChartPoint | null, x: number) => {
    setHoveredPoint({ point, x })
  }, [])

  return (
    <div className="revenue-chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title-wrap">
          <h3 className="chart-card-title">Revenue</h3>
          <p className="chart-card-subtitle">Vendas por dia — dados Shopify</p>
        </div>
        <div className="chart-card-controls">
          {chartData && (
            <div className="chart-summary">
              <span className="chart-summary-value">
                {formatCurrency(chartData.total_revenue, chartData.currency)}
              </span>
              <span className="chart-summary-label">total</span>
              <span className="chart-summary-sep">·</span>
              <span className="chart-summary-orders">{chartData.total_orders} orders</span>
            </div>
          )}
          <div className="chart-period-selector">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.days}
                className={`period-pill ${period === opt.days ? 'active' : ''}`}
                onClick={() => setPeriod(opt.days)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-body">
        {loading && (
          <div className="chart-loading">
            <div className="loader" />
            <span>A carregar vendas...</span>
          </div>
        )}

        {error && (
          <div className="chart-error">
            <span>⚠️ {error}</span>
            <button onClick={() => fetchData(period)}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && chartData && chartData.data.length > 0 && (
          <div className="chart-svg-wrap" ref={wrapRef}>
            <ChartTooltip
              point={hoveredPoint.point}
              x={hoveredPoint.x}
              containerWidth={wrapRef.current?.clientWidth || 600}
              currency={chartData.currency}
            />
            <AreaChart
              data={chartData.data}
              width={800}
              height={280}
              currency={chartData.currency}
              onHover={handleHover}
            />
          </div>
        )}

        {!loading && !error && chartData && chartData.data.length === 0 && (
          <div className="chart-empty">
            <span>Sem vendas neste período.</span>
          </div>
        )}
      </div>
    </div>
  )
}
