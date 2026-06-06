import { useState, useEffect, useRef, useCallback } from 'react'
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

/* ── Helpers ──────────────────────────────────── */

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', HRK: 'kn', RON: 'lei' }
  const sym = symbols[currency] || currency + ' '
  if (value >= 1000) return `${sym}${(value / 1000).toFixed(1)}k`
  return `${sym}${value.toFixed(0)}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}`
}

/* ── SVG Chart ────────────────────────────────── */

function AreaChart({
  data,
  width = 800,
  height = 280,
  currency,
  onHover,
}: {
  data: ChartPoint[]
  width?: number
  height?: number
  currency: string
  onHover?: (point: ChartPoint | null, x: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const padding = { top: 20, right: 20, bottom: 36, left: 56 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  if (!data.length) return null

  const maxVal = Math.max(...data.map(d => d.revenue), 1)
  const minVal = 0

  // Grid lines (5 horizontal)
  const gridLines = 5
  const gridStep = maxVal / gridLines

  // Map data to coordinates
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.revenue - minVal) / (maxVal - minVal || 1)) * chartH,
    ...d,
  }))

  // Build smooth path (catmull-rom to bezier)
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
  }, '')

  // Area path (close to bottom)
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`

  // X-axis labels (show every Nth based on density)
  const labelEvery = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 30 ? 5 : 10
  const xLabels = data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onHover) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    // Find closest point
    const relX = mouseX - padding.left
    const idx = Math.round((relX / chartW) * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    onHover(points[clamped], mouseX)
  }, [data, points, chartW, onHover, padding.left])

  const handleMouseLeave = useCallback(() => {
    onHover?.(null, 0)
  }, [onHover])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="revenue-chart-svg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-cyan)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--chart-cyan)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--chart-blue)" />
          <stop offset="50%" stopColor="var(--chart-cyan)" />
          <stop offset="100%" stopColor="var(--electric)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = padding.top + chartH - (i / gridLines) * chartH
        const val = i * gridStep
        return (
          <g key={`grid-${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="var(--surface-border)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 4"}
              opacity={i === 0 ? 0.8 : 0.4}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="chart-axis-label"
            >
              {formatCurrency(val, currency)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGradient)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx = data.indexOf(d)
        const x = padding.left + (idx / Math.max(data.length - 1, 1)) * chartW
        return (
          <text
            key={`xlabel-${i}`}
            x={x}
            y={height - 6}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {data.length <= 14 ? formatDate(d.date) : formatShortDate(d.date)}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Tooltip ──────────────────────────────────── */

function ChartTooltip({ point, x, containerWidth, currency }: {
  point: ChartPoint | null
  x: number
  containerWidth: number
  currency: string
}) {
  if (!point) return null
  // x já está em coordenadas renderizadas
  const tw = 140
  const clampedX = Math.max(tw / 2, Math.min(containerWidth - tw / 2, x))
  return (
    <div
      className="chart-tooltip"
      style={{ left: clampedX, top: 12 }}
    >
      <div className="tooltip-date">{formatDate(point.date)}</div>
      <div className="tooltip-value">{formatCurrency(point.revenue, currency)}</div>
      <div className="tooltip-dot" style={{ left: clampedX }} />
    </div>
  )
}

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
