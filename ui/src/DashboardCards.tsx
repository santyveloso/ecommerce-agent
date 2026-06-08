/* ── Dashboard Metric Cards ──────────────────── */
import type { DashboardData } from './types'
import { Icons } from './Icons'

interface Props {
  data: DashboardData
  period: string
  loading: boolean
}

export default function DashboardCards({ data, period, loading }: Props) {
  return (
    <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      {data ? (
        <>
          <div className="cards four-cols">
            <div className="card accent-blue">
              <div className="card-icon" style={{ background: 'var(--chart-blue)' }}>{Icons.dollar}</div>
              <div className="card-value">{data.revenue != null ? `${data.revenue.toFixed(2)}€` : data.revenueToday}</div>
              <div className="card-label">{period === 'today' ? 'Receita de Hoje' : period === 'week' ? 'Receita (7 dias)' : 'Receita do Mês'}</div>
            </div>
            <div className="card accent-purple">
              <div className="card-icon" style={{ background: 'var(--chart-purple)' }}>{Icons.trending}</div>
              <div className="card-value">{data.roas != null ? `${data.roas}x` : '-'}</div>
              <div className="card-label">ROAS</div>
            </div>
            <div className="card accent-green">
              <div className="card-icon" style={{ background: 'var(--success)' }}>{Icons.cart}</div>
              <div className="card-value">{data.orders != null ? data.orders : data.ordersToday}</div>
              <div className="card-label">Compras{period === 'today' ? ' Hoje' : period === 'week' ? ' (7 dias)' : ' (Mês)'}</div>
            </div>
            <div className="card accent-cyan">
              <div className="card-icon" style={{ background: 'var(--chart-cyan)' }}>{Icons.dollar}</div>
              <div className="card-value">{data.spend != null ? `${data.spend.toFixed(2)}€` : '-'}</div>
              <div className="card-label">Gasto AdSpend</div>
            </div>
          </div>

          {data.pendingApprovals > 0 && (
            <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {Icons.alert}
                <span style={{ fontWeight: 600, fontSize: 14 }}>{data.pendingApprovals} aprovacoes pendentes</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sem dados disponiveis</div>
      )}
    </div>
  )
}
