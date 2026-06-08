import { formatCurrency, formatDate } from './chart-helpers'
import type { ChartPoint } from './AreaChart'

function ChartTooltip({ point, x, containerWidth, currency }: {
  point: ChartPoint | null
  x: number
  containerWidth: number
  currency: string
}) {
  if (!point) return null
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

export default ChartTooltip
