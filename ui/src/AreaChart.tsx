import { useRef, useCallback } from 'react'
import { formatCurrency, formatDate, formatShortDate } from './chart-helpers'

export interface ChartPoint {
  date: string
  revenue: number
}

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

  const gridLines = 5
  const gridStep = maxVal / gridLines

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.revenue - minVal) / (maxVal - minVal || 1)) * chartH,
    ...d,
  }))

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
  }, '')

  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`

  const labelEvery = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 30 ? 5 : 10
  const xLabels = data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onHover) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
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

      <path d={areaPath} fill="url(#chartGradient)" />

      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

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

export default AreaChart
