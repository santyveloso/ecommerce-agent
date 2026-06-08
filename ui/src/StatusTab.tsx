import { Icons } from './Icons'

interface StatusTabProps {
  statusData: any
  statusLoading: boolean
  fetchStatus: () => void
}

export default function StatusTab({ statusData, statusLoading, fetchStatus }: StatusTabProps) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="topbar" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Status</h1>
          <p className="greeting">Estado das conexoes e servicos</p>
        </div>
        <div className="topbar-actions">
          <button className="refresh-btn" onClick={fetchStatus} disabled={statusLoading}>
            {Icons.refresh} {statusLoading ? 'A verificar...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {!statusData && (
        <div className="loading-screen" style={{ height: 200 }}><div className="loader" /></div>
      )}

      {statusLoading && statusData && (
        <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>A verificar conexoes...</div>
      )}

      {statusData && (
        <>
          {/* ── Overall Status Hero ── */}
          <div className="status-hero" style={{
            background: statusData.overall === 'all_ok' ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: '1px solid',
            borderColor: statusData.overall === 'all_ok' ? 'var(--success)' : 'var(--warning)',
          }}>
            <div className="status-hero-left">
              <div className="status-hero-ring" style={{
                background: statusData.overall === 'all_ok' ? 'var(--success)' : 'var(--warning)',
                boxShadow: statusData.overall === 'all_ok'
                  ? '0 0 20px rgba(34,197,94,0.4)'
                  : '0 0 20px rgba(234,179,8,0.4)',
              }}>
                <span className="status-hero-count">{statusData.connected}</span>
                <span className="status-hero-total">/ {statusData.total}</span>
              </div>
            </div>
            <div className="status-hero-right">
              <div className="status-hero-title">
                {statusData.overall === 'all_ok' ? 'All Systems Go' : 'Issues Detected'}
              </div>
              <div className="status-hero-sub">
                {statusData.overall === 'all_ok'
                  ? 'Todos os servicos estao operacionais'
                  : `${statusData.total - statusData.connected} servicos com problemas`}
              </div>
            </div>
          </div>

          {/* ── Service Cards Grid ── */}
          <div className="status-grid">
            {(() => {
              const SERVICE_ICONS: Record<string, any> = {
                'API': Icons.cpu,
                'Shopify': Icons.cart,
                'Meta Ads': Icons.trending,
                'Gateway (LLM)': Icons.zap,
                'Zoho Mail': Icons.mail,
              }
              const SERVICE_COLORS: Record<string, string> = {
                'API': 'var(--chart-blue)',
                'Shopify': 'var(--chart-green, #22c55e)',
                'Meta Ads': 'var(--chart-purple)',
                'Gateway (LLM)': 'var(--chart-cyan)',
                'Zoho Mail': 'var(--warning)',
              }
              return statusData.services.map((svc: any, i: number) => {
                const icon = SERVICE_ICONS[svc.name]
                const accent = SERVICE_COLORS[svc.name] || 'var(--accent)'
                const isOk = svc.status === 'connected'
                return (
                  <div key={i} className="status-card">
                    {/* Top icon + status dot */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div className="status-card-icon" style={{ background: accent }}>
                        {icon}
                      </div>
                      <div className="status-card-pulse" style={{
                        background: isOk ? 'var(--success)' : svc.status === 'error' ? 'var(--danger)' : 'var(--text-muted)',
                        animation: isOk ? 'pulse 2s infinite' : 'none',
                      }} />
                    </div>

                    {/* Name */}
                    <div className="status-card-name">{svc.name}</div>

                    {/* Detail */}
                    <div className="status-card-detail">{svc.detail}</div>

                    {/* Status badge */}
                    <div className="status-card-badge" style={{
                      background: isOk ? 'var(--success-bg)'
                        : svc.status === 'error' ? 'var(--danger-bg)'
                        : 'var(--surface-hover)',
                      color: isOk ? 'var(--success)'
                        : svc.status === 'error' ? 'var(--danger)'
                        : 'var(--text-muted)',
                    }}>
                      {svc.status === 'connected' ? 'Online'
                        : svc.status === 'error' ? 'Erro'
                        : svc.status === 'disconnected' ? 'Offline'
                        : svc.status}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </>
      )}
    </div>
  )
}
