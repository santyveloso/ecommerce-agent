import { useState, useEffect } from 'react'
import { setApiKey } from './api'

/* ── Settings Panel ─────────────────────────── */
interface SettingsPanelProps {
  API: string
  theme: string
  setTheme: (t: string) => void
}
export default function SettingsPanel({ API, theme, setTheme }: SettingsPanelProps) {
  const [shopifyStatus, setShopifyStatus] = useState<'loading' | 'ok' | 'off' | 'err'>('loading')
  const [gatewayStatus, setGatewayStatus] = useState<'loading' | 'ok' | 'off' | 'err'>('loading')
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [showGatewayForm, setShowGatewayForm] = useState(false)
  const [gwTempUrl, setGwTempUrl] = useState('')
  const [gwTempToken, setGwTempToken] = useState('')
  const [gwError, setGwError] = useState('')

  useEffect(() => {
    fetch(`${API}/setup/status`)
      .then(r => r.json())
      .then(d => {
        setShopifyStatus(d.configured ? 'ok' : 'off')
        if (d.api_key) setApiKey(d.api_key)
      })
      .catch(() => setShopifyStatus('err'))
  }, [API])

  useEffect(() => {
    fetch(`${API}/setup/gateway`)
      .then(r => r.json())
      .then(d => {
        setGatewayStatus(d.connected ? 'ok' : d.configured ? 'off' : 'off')
        if (d.gateway_url) setGatewayUrl(d.gateway_url)
      })
      .catch(() => setGatewayStatus('err'))
  }, [API])

  const handleGatewayUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGwError('')
    try {
      const r = await fetch(`${API}/setup/gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway_url: gwTempUrl.trim(),
          gateway_token: gwTempToken.trim(),
        }),
      })
      const d = await r.json()
      if (d.connected) {
        setGatewayStatus('ok')
        setGatewayUrl(gwTempUrl.trim())
      } else {
        setGatewayStatus('off')
        setGwError('Ligação salva mas gateway não respondeu')
      }
      setShowGatewayForm(false)
    } catch (err: any) {
      setGwError(err.message || 'Erro ao salvar')
    }
  }

  const reconnectShopify = () => {
    localStorage.removeItem('ec_configured')
    window.location.reload()
  }

  const badge = (s: typeof shopifyStatus) => {
    if (s === 'ok') return <span className="settings-status-badge ok">● Ligado</span>
    if (s === 'off') return <span className="settings-status-badge off">● Desligado</span>
    if (s === 'err') return <span className="settings-status-badge err">● Erro</span>
    return <span className="settings-status-badge off">A verificar...</span>
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700 }}>
      <div className="topbar" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="greeting">Configurações da aplicação e conexões</p>
        </div>
      </div>

      {/* ── Conexões ── */}
      <div className="settings-section">
        <h2>Conexões</h2>
        <p className="section-desc">Estado das tuas ligações — Shopify + Germes</p>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>🛒 Shopify</span>
            <span>Loja conectada para gerir produtos e encomendas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {badge(shopifyStatus)}
            {shopifyStatus === 'off' && (
              <button className="settings-btn primary" onClick={reconnectShopify}>Ligar</button>
            )}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span>🤖 Germes (Agente AI)</span>
            <span>{gatewayUrl || 'Ainda não configurado'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {badge(gatewayStatus)}
            <button className="settings-btn" onClick={() => setShowGatewayForm(!showGatewayForm)}>
              {showGatewayForm ? 'Fechar' : gatewayUrl ? 'Alterar' : 'Configurar'}
            </button>
          </div>
        </div>

        {showGatewayForm && (
          <form onSubmit={handleGatewayUpdate} style={{
            marginTop: 16, padding: 16, background: 'var(--bg)',
            borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <label className="field">
              <span>URL do Germes</span>
              <input value={gwTempUrl} onChange={e => setGwTempUrl(e.target.value)}
                placeholder="http://hostinger-vps:8888/v1/chat/completions" />
            </label>
            <label className="field">
              <span>Token</span>
              <input value={gwTempToken} onChange={e => setGwTempToken(e.target.value)}
                placeholder="opcional" type="password" />
            </label>
            {gwError && <div className="onboarding-error">{gwError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="settings-btn primary">Salvar</button>
              <button type="button" className="settings-btn" onClick={() => setShowGatewayForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Theme ── */}
      <div className="settings-section">
        <h2>Tema</h2>
        <p className="section-desc">Escolhe o visual da aplicação</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { key: 'dark', label: 'Dark', icon: '🌙', preview: '#0f1117' },
            { key: 'light', label: 'Light', icon: '☀️', preview: '#f4f5f7' },
            { key: 'mono', label: 'Mono', icon: '🪨', preview: '#121212' },
            { key: 'midnight', label: 'Midnight', icon: '🌊', preview: '#0f1419' },
            { key: 'espresso', label: 'Espresso', icon: '☕', preview: '#0d0d0d' },
          ].map(t => (
            <button
              key={t.key}
              className="quick-btn"
              onClick={() => setTheme(t.key)}
              style={{
                flex: '1 1 100px', minWidth: 100,
                padding: '14px 12px', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: theme === t.key ? 'var(--accent)' : 'var(--surface)',
                color: theme === t.key ? '#fff' : 'var(--text)',
                border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--surface-border)',
                fontWeight: theme === t.key ? 600 : 400,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 12 }}>{t.label}</span>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.preview, border: '1px solid var(--surface-border)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── API ── */}
      <div className="settings-section">
        <h2>API</h2>
        <p className="section-desc">Backend local</p>
        <code style={{ background: 'var(--bg)', padding: '8px 14px', borderRadius: 8, display: 'inline-block', fontSize: 13 }}>{API}</code>
      </div>
    </div>
  )
}
