import type { ReactNode } from 'react'

/** Generate month metadata for +/- 6 months around current date */
export function getAllMonths(): Array<{ month: number; year: number; key: string }> {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const months = []
  for (let i = -6; i <= 5; i++) {
    const total = m + i
    const month = ((total % 12) + 12) % 12
    const year = y + Math.floor(total / 12)
    months.push({ month, year, key: `${year}-${month}` })
  }
  return months
}

interface RenderMonthOptions {
  month: number
  year: number
  calSince: string
  calUntil: string
  setCalSince: (v: string) => void
  setCalUntil: (v: string) => void
  changePeriod: (p: string, since?: string, until?: string) => void
}

/** Render days for a calendar month grid */
export function renderMonth({
  month,
  year,
  calSince,
  calUntil,
  setCalSince,
  setCalUntil,
  changePeriod,
}: RenderMonthOptions): ReactNode[] {
  const days = new Date(year, month + 1, 0).getDate()
  const startDow = new Date(year, month, 1).getDay()
  const cells: ReactNode[] = []
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />)
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isSince = calSince === dateStr
    const isUntil = calUntil === dateStr
    const inRange = !!calSince && !!calUntil && dateStr >= calSince && dateStr <= calUntil
    const isToday = dateStr === new Date().toISOString().slice(0, 10)
    cells.push(
      <div
        key={d}
        className={`cal-day ${isSince || isUntil ? 'selected' : ''} ${inRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => {
          if (!calSince || (calSince && calUntil)) {
            setCalSince(dateStr)
            setCalUntil('')
          } else {
            setCalUntil(dateStr)
            changePeriod('custom', calSince, dateStr)
          }
        }}
      >
        {d}
      </div>,
    )
  }
  return cells
}
