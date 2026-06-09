import { useState } from 'react'
import { API } from './constants'

/* ── Onboarding ─────────────────────────────── */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Shopify
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')

  // Step 2: Choose default view
  const [defaultView, setDefaultView] = useState('dashboard')

  // Step 3: Germes / Remote Agent
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [gatewayToken, setGatewayToken] = useState('')

  const handleShopifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API}/setup/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_store_domain: domain.trim(),
          shopify_access_token: token.trim(),
          shopify_api_version: '2026-01',
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.detail || 'Falhou')
      }
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Erro ao ligar a loja')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('ec_default_tab', defaultView)
    setStep(3)
  }

  const handleGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API}/setup/gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway_url: gatewayUrl.trim(),
          gateway_token: gatewayToken.trim(),
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.detail || 'Falhou')
      }
      localStorage.setItem('ec_configured', '1')
      onDone()
    } catch (err: any) {
      setError(err.message || 'Erro ao ligar ao agente')
    } finally {
      setLoading(false)
    }
  }

  const skipGateway = () => {
    localStorage.setItem('ec_configured', '1')
    onDone()
  }

  if (step === 2) {
    return (
      <div className="onboarding-wrapper">
        <div className="onboarding-card" style={{ maxWidth: 480 }}>
          <div className="onboarding-steps">
            <div className="onboarding-step-dot done" />
            <div className="onboarding-step-line done" />
            <div className="onboarding-step-dot active" />
            <div className="onboarding-step-line" />
            <div className="onboarding-step-dot" />
          </div>
          <div className="onboarding-logo"><div className="logo-icon">EC</div></div>
          <h1 className="onboarding-title">Escolhe o teu ecrã inicial</h1>
          <p className="onboarding-subtitle">O que queres ver quando abres a aplicação?</p>
          <form onSubmit={handleViewSubmit} className="onboarding-form">
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setDefaultView('dashboard')}
                className={`onboarding-view-btn ${defaultView === 'dashboard' ? 'active' : ''}`}
              >
                <span style={{ fontSize: 32 }}>📊</span>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Dashboard</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vê métricas, vendas e estado da loja</span>
              </button>
              <button
                type="button"
                onClick={() => setDefaultView('chat')}
                className={`onboarding-view-btn ${defaultView === 'chat' ? 'active' : ''}`}
              >
                <span style={{ fontSize: 32 }}>💬</span>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Chat</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fala diretamente com o Germes</span>
              </button>
            </div>
            <button type="submit" className="onboarding-btn">
              Continuar
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="onboarding-wrapper">
        <div className="onboarding-card" style={{ maxWidth: 480 }}>
          <div className="onboarding-steps">
            <div className="onboarding-step-dot done" />
            <div className="onboarding-step-line done" />
            <div className="onboarding-step-dot done" />
            <div className="onboarding-step-line done" />
            <div className="onboarding-step-dot active" />
          </div>
          <div className="onboarding-logo"><div className="logo-icon">EC</div></div>
          <h1 className="onboarding-title">Ligar ao Germes</h1>
          <p className="onboarding-subtitle">Conecta ao teu agente AI na VPS da Hostinger para poderes falar com ele.</p>

          <form onSubmit={handleGatewaySubmit} className="onboarding-form">
            <label className="field">
              <span>URL do Germes (Hostinger VPS)</span>
              <input value={gatewayUrl} onChange={e => setGatewayUrl(e.target.value)}
                placeholder="http://123.123.123.123:8888" />
              <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                O URL da VPS onde o agente está a correr (o Santy dá-te isto)
              </small>
            </label>
            <label className="field">
              <span>Token (se houver)</span>
              <input value={gatewayToken} onChange={e => setGatewayToken(e.target.value)}
                placeholder="opcional" type="password" />
            </label>
            {error && <div className="onboarding-error">{error}</div>}
            <button type="submit" className="onboarding-btn" disabled={loading || !gatewayUrl.trim()}>
              {loading ? 'A ligar...' : 'Ligar Germes'}
            </button>
            <button type="button" className="onboarding-btn" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--surface-border)' }}
              onClick={skipGateway}>
              Saltar (configurar depois)
            </button>
          </form>
          <p className="onboarding-help" style={{ marginTop: 16 }}>
            Já tens a loja ligada! Agora só falta o Germes — ou podes configurar depois nas Settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card" style={{ maxWidth: 480 }}>
        <div className="onboarding-steps">
          <div className="onboarding-step-dot active" />
          <div className="onboarding-step-line" />
          <div className="onboarding-step-dot" />
          <div className="onboarding-step-line" />
          <div className="onboarding-step-dot" />
        </div>
        <div className="onboarding-logo"><div className="logo-icon">EC</div></div>
        <h1 className="onboarding-title">Bem-vindo ao Ecommerce Agent</h1>
        <p className="onboarding-subtitle">Vamos ligar a tua loja Shopify em 2 passos.</p>
        <form onSubmit={handleShopifySubmit} className="onboarding-form">
          <label className="field">
            <span>Link da tua loja Shopify</span>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="minha-loja.myshopify.com" required />
          </label>
          <label className="field">
            <span>Token de acesso (Admin API)</span>
            <input value={token} onChange={e => setToken(e.target.value)}
              placeholder="shpat_..." required type="password" />
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
              Vai a Shopify Admin &rarr; Settings &rarr; Apps and sales channels &rarr; Develop apps.
              Cria uma app com <code>read_products</code>, <code>read_orders</code>, <code>write_products</code> e copia o token.
            </small>
          </label>
          {error && <div className="onboarding-error">{error}</div>}
          <button type="submit" className="onboarding-btn" disabled={loading || !domain || !token}>
            {loading ? 'A testar conexao...' : 'Ligar loja'}
          </button>
        </form>
      </div>
    </div>
  )
}
