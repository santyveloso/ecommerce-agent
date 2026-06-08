import { Icons } from './Icons'
import DashboardCards from './DashboardCards'
import { MONTH_NAMES } from './links-data'
import { renderMonth } from './CalendarHelpers'
import type { DashboardData } from './types'
import type { RefObject } from 'react'

interface DashboardContentProps {
  dashboardData: DashboardData | null
  dashboardLoading: boolean
  period: string
  dateRange: { since: string; until: string } | null
  showDatePicker: boolean
  onShowDatePicker: (show: boolean) => void
  onChangePeriod: (p: string, since?: string, until?: string) => Promise<void>
  onRefresh: () => Promise<void>
  pickerRef: RefObject<HTMLDivElement | null>
  calScrollRef: RefObject<HTMLDivElement | null>
  calSince: string
  calUntil: string
  onCalSinceChange: (val: string) => void
  onCalUntilChange: (val: string) => void
  allMonths: Array<{ key: string; month: number; year: number }>
}

export default function DashboardContent({
  dashboardData,
  dashboardLoading,
  period,
  dateRange,
  showDatePicker,
  onShowDatePicker,
  onChangePeriod,
  onRefresh,
  pickerRef,
  calScrollRef,
  calSince,
  calUntil,
  onCalSinceChange,
  onCalUntilChange,
  allMonths,
}: DashboardContentProps) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="topbar">
        <div>
          <h1 className="page-title">{dashboardData?.storeName || 'Dashboard'}</h1>
          <p className="greeting">Visao geral da sua loja <span className="greeting-highlight">em tempo real</span></p>
        </div>
        <div className="topbar-actions" style={{ position: 'relative' }}>
          <div className="period-selector">
            {['today', 'week', 'month'].map(p => (
              <button key={p} className={`period-btn ${period === p && !dateRange ? 'active' : ''}`} onClick={() => onChangePeriod(p)}>
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
            <button className={`period-btn ${dateRange ? 'active' : ''}`} onClick={() => { onShowDatePicker(!showDatePicker); onCalSinceChange(''); onCalUntilChange('') }}>
              {Icons.calendar}
            </button>
          </div>
          <button className="refresh-btn" onClick={onRefresh}>{Icons.refresh} Atualizar</button>

          {showDatePicker && (
            <div className="date-picker-dropdown" ref={pickerRef}>
              <div className="date-picker-presets">
                <button className="preset-btn" onClick={() => onChangePeriod('today')}>Hoje</button>
                <button className="preset-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1)
                  onChangePeriod('custom', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                }}>Ontem</button>
                <button className="preset-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 6)
                  onChangePeriod('last_7', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                }}>Últimos 7 dias</button>
                <button className="preset-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 13)
                  onChangePeriod('last_14', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                }}>Últimos 14 dias</button>
                <button className="preset-btn" onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 29)
                  onChangePeriod('last_30', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                }}>Últimos 30 dias</button>
                <button className="preset-btn" onClick={() => {
                  const d = new Date(); d.setDate(1)
                  onChangePeriod('this_month', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                }}>Este mês</button>
              </div>
              <div className="date-picker-custom">
              <div className="cal-scroll" ref={calScrollRef}>
                {allMonths.map(m => (
                  <div key={m.key} className="cal-month-block">
                    <div className="cal-month-label">{MONTH_NAMES[m.month]} {m.year}</div>
                    <div className="cal-grid-header">
                      {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
                    </div>
                    <div className="cal-grid">
                      {renderMonth({ month: m.month, year: m.year, calSince, calUntil, setCalSince: onCalSinceChange, setCalUntil: onCalUntilChange, changePeriod: onChangePeriod })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="cal-selection">
                {calSince && <span className="cal-badge">De: {calSince}</span>}
                {calUntil && <span className="cal-badge">Até: {calUntil}</span>}
                {!calSince && <span className="cal-muted">Clique num dia para começar</span>}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!dashboardData && dashboardLoading ? (
        <div className="loading-screen"><div className="loader" /></div>
      ) : (
        <DashboardCards
          data={dashboardData as any}
          period={period}
          loading={dashboardLoading}
        />
      )}
    </div>
  )
}
