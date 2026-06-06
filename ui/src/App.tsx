import { useState, useEffect, useRef, useCallback } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import SessionSidebar from './SessionSidebar'
import { useChatStream } from './useChatStream'
import RevenueChart from './RevenueChart'
import './revenue-chart.css'
import './dashboard.css'
import './chat.css'

/* ── Types ──────────────────────────────────── */
interface Order {
  name: string; total: string; status: string; customer: string; date: string
  financial_status?: string; fulfillment_status?: string; created_at?: string
  items?: Array<{title: string; qty: number; price?: string}>
}
interface DashboardData {
  storeName: string; currency: string; products: number; lowStock: number
  ordersToday: number; revenueToday: string; pendingApprovals: number
  recentOrders: Order[]
  roas?: number; spend?: number; orders?: number; revenue?: number
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  approvalRequired?: boolean
  approval?: {
    id: string
    intent: string
    summary: string
    status: 'pending' | 'approved' | 'rejected'
  }
  media?: {
    url: string
    type: 'video' | 'image'
    prompt?: string
    name?: string
  }
  timestamp?: string
}
interface Folder {
  id: string
  name: string
  expanded: boolean
  color?: string
}
interface ChatSession {
  id: string
  title: string
  messages: Message[]
  folderId?: string | null
  pinned?: boolean
  model?: string
}

const API = 'http://localhost:7777'
const FALLBACK_MODELS = ['deepseek-v4-flash']

/* ── SVG Icons ──────────────────────────────── */
const Icons = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  cart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  package: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  switch: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  studio: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/></svg>,
  zap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  cpu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>,
  link: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  memory: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

/* ── Helpers ──────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}



/* ── Onboarding ─────────────────────────────── */
function Onboarding({ onDone }: { onDone: () => void }) {
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [apiVer, setApiVer] = useState('2026-01')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const r = await fetch(`${API}/setup/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_store_domain: domain.trim(),
          shopify_access_token: token.trim(),
          shopify_api_version: apiVer.trim(),
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.detail || 'Falhou')
      }
      localStorage.setItem('ec_configured', '1')
      onDone()
    } catch (err: any) {
      setError(err.message || 'Erro ao ligar a loja')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card">
        <div className="onboarding-logo"><div className="logo-icon">EC</div></div>
        <h1 className="onboarding-title">Ecommerce Agent</h1>
        <p className="onboarding-subtitle">Conecta a tua loja Shopify para comecar.</p>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <label className="field"><span>Shopify store domain</span><input value={domain} onChange={e => setDomain(e.target.value)} placeholder="minha-loja.myshopify.com" required /></label>
          <label className="field"><span>Shopify Admin API access token</span><input value={token} onChange={e => setToken(e.target.value)} placeholder="shpat_..." required type="password" /></label>
          <label className="field"><span>API version (opcional)</span><input value={apiVer} onChange={e => setApiVer(e.target.value)} placeholder="2026-01" /></label>
          {error && <div className="onboarding-error">{error}</div>}
          <button type="submit" className="onboarding-btn" disabled={saving || !domain || !token}>{saving ? 'A testar conexao...' : 'Conectar loja'}</button>
        </form>
        <p className="onboarding-help">Precisas de ajuda? Vai a Shopify Admin &rarr; Settings &rarr; Apps and sales channels &rarr; Develop apps. Cria uma app com scopes <code>read_products</code>, <code>read_orders</code>, <code>write_products</code>, instala e copia o token.</p>
      </div>
    </div>
  )
}

/* ── Main App ───────────────────────────────── */
export default function App() {
  const [configured, setConfigured] = useState(() => !!localStorage.getItem('ec_configured'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if API already has credentials (survives localStorage clears)
    fetch(`${API}/setup/status`)
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          localStorage.setItem('ec_configured', '1')
          setConfigured(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="loading-screen"><div className="loader" /><span>A carregar...</span></div>
  }

  if (!configured) {
    return <Onboarding onDone={() => setConfigured(true)} />
  }

  return <Dashboard />
}

/* ── Dashboard ──────────────────────────────── */
function Dashboard() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ec_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS)
  const [gatewayActiveModel, setGatewayActiveModel] = useState<string>('deepseek-v4-flash')

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('ec_theme', dark ? 'dark' : 'light')
  }, [dark])

  // ── Fetch available models from gateway ────
  useEffect(() => {
    fetch(`${API}/gateway/models`)
      .then(r => r.json())
      .then(data => {
        if (data.models?.length) {
          setAvailableModels(data.models)
        }
        if (data.active) {
          setGatewayActiveModel(data.active)
        }
      })
      .catch(() => {/* gateway offline, fallback models */})
  }, [])

  const setActiveModel = useCallback(async (model: string) => {
    setGatewayActiveModel(model)
    try {
      await fetch(`${API}/gateway/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })
    } catch {/* silent */}
  }, [])

  // ── Dashboard Data ──────────────────────
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [dateRange, setDateRange] = useState<{ since: string; until: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dashCache = useRef<DashboardData | null>(null)
  const metricsCache = useRef<Record<string, any>>({})

  // Fetch only /dashboard (cached — só atualiza no mount + refresh manual)
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dashboard`)
      if (res.ok) {
        dashCache.current = await res.json()
      }
    } catch (err) {
      console.error('Dashboard fetch error', err)
    }
  }, [])

  // Fetch /dashboard/metrics para um preset (cacheado por preset)
  const fetchMetrics = useCallback(async (preset: string, since?: string, until?: string) => {
    const cached = metricsCache.current[preset]
    if (cached && !since && !until) return cached

    try {
      const params = since && until
        ? `preset=${preset}&since=${since}&until=${until}`
        : `preset=${preset}`
      const res = await fetch(`${API}/dashboard/metrics?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (!since) metricsCache.current[preset] = data
        return data
      }
    } catch (err) {
      console.error('Metrics fetch error', err)
    }
    return null
  }, [])

  // Merge dashCache + metrics e atualiza o estado
  const mergeAndSet = useCallback((dash: DashboardData, metrics: any) => {
    if (metrics) {
      dash.roas = metrics.roas
      dash.spend = metrics.spend
      dash.orders = metrics.orders
      dash.revenue = metrics.revenue
    }
    setDashboardData({ ...dash })
    setDashboardLoading(false)
  }, [])

  // Load inicial: dashboard + metrics today
  useEffect(() => {
    (async () => {
      setDashboardLoading(true)
      await fetchDashboardData()
      const dash = dashCache.current
      if (dash) {
        const metrics = await fetchMetrics('today')
        mergeAndSet(dash, metrics)
      }
    })()
  }, [])

  // Click outside to close date picker
  const pickerRef = useRef<HTMLDivElement>(null)
  const dateSinceRef = useRef<HTMLInputElement>(null)
  const dateUntilRef = useRef<HTMLInputElement>(null)
  const calGridRef = useRef<HTMLDivElement>(null)
  const calScrollRef = useRef<HTMLDivElement>(null)
  const [calSince, setCalSince] = useState('')
  const [calUntil, setCalUntil] = useState('')
  const allMonths = (() => {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear()
    const months = []
    for (let i = -6; i <= 5; i++) {
      const total = m + i
      const month = ((total % 12) + 12) % 12
      const year = y + Math.floor((total) / 12)
      months.push({ month, year, key: `${year}-${month}` })
    }
    return months
  })()
  const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  const renderMonth = (month: number, year: number) => {
    const days = new Date(year, month + 1, 0).getDate()
    const startDow = new Date(year, month, 1).getDay()
    const cells: React.ReactNode[] = []
    for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />)
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isSince = calSince === dateStr
      const isUntil = calUntil === dateStr
      const inRange = calSince && calUntil && dateStr >= calSince && dateStr <= calUntil
      const isToday = dateStr === new Date().toISOString().slice(0, 10)
      cells.push(
        <div key={d} className={`cal-day ${isSince || isUntil ? 'selected' : ''} ${inRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => {
            if (!calSince || (calSince && calUntil)) {
              setCalSince(dateStr); setCalUntil('')
            } else {
              setCalUntil(dateStr)
              changePeriod('custom', calSince, dateStr)
            }
          }}
        >{d}</div>
      )
    }
    return cells
  }
  useEffect(() => {
    if (!showDatePicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDatePicker])

  // Scroll no calendário para mudar mês — contínuo com snap

  // Muda período (incluindo custom)
  const changePeriod = useCallback(async (p: string, since?: string, until?: string) => {
    setPeriod(p)
    setShowDatePicker(false)
    if (since && until) {
      setDateRange({ since, until })
    } else {
      setDateRange(null)
    }

    // Se ainda não temos dashboard data, espera
    if (!dashCache.current) {
      await fetchDashboardData()
    }

    const metrics = await fetchMetrics(p, since, until)
    if (dashCache.current) {
      mergeAndSet(dashCache.current, metrics)
    }
  }, [fetchDashboardData, fetchMetrics, mergeAndSet])

  // Refresh manual
  const handleRefresh = useCallback(async () => {
    setDashboardLoading(true)
    await fetchDashboardData()
    const dash = dashCache.current
    if (dash) {
      const preset = dateRange?.since
        ? 'custom'
        : period === 'today' ? 'today' : period === 'week' ? 'last_7' : 'this_month'
      const metrics = dateRange?.since
        ? await fetchMetrics('custom', dateRange.since, dateRange.until)
        : await fetchMetrics(preset)
      mergeAndSet(dash, metrics)
    } else {
      setDashboardLoading(false)
    }
  }, [fetchDashboardData, fetchMetrics, mergeAndSet, period, dateRange])

  // ── Chat State ──────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('ec_chat_sessions')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{ id: 'default', title: 'Conversa Geral', messages: [], model: 'deepseek-v4-flash' }]
  })
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem('ec_active_session') || 'default'
  })
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('ec_chat_folders')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [sessionSearchQuery, setSessionSearchQuery] = useState('')
  const [chatInputValue, setChatInputValue] = useState('')
  const [chatEditingTitle, setChatEditingTitle] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // @mention state for chat
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionTriggerIdx, setSuggestionTriggerIdx] = useState(-1)
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0)

  // Persist sessions
  useEffect(() => { localStorage.setItem('ec_chat_sessions', JSON.stringify(sessions)) }, [sessions])
  useEffect(() => { localStorage.setItem('ec_chat_folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem('ec_active_session', activeSessionId) }, [activeSessionId])

  // Active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

  // SSE Streaming hook
  const { isStreaming, error: streamError, stop: stopStreaming, stream: startStream } = useChatStream({
    onToken: () => {}, // tokens handled via streamingContent
    onDone: (fullContent) => {
      setStreamingContent(fullContent)
      setIsStreamingDone(true)
    },
    onError: (err) => {
      console.error('Stream error:', err)
    }
  })

  const [streamingContent, setStreamingContent] = useState('')
  const [isStreamingDone, setIsStreamingDone] = useState(false)

  // ── Chat Operations ─────────────────────
  const createNewSession = useCallback(() => {
    const id = uid()
    const newSession: ChatSession = {
      id,
      title: 'Nova Conversa',
      messages: [],
      model: 'deepseek-v4-flash',
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(id)
    setChatInputValue('')
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id)
      if (filtered.length === 0) {
        // Create a default session
        const newId = uid()
        const def: ChatSession = { id: newId, title: 'Conversa Geral', messages: [], model: 'deepseek-v4-flash' }
        setActiveSessionId(newId)
        return [def]
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id)
      }
      return filtered
    })
  }, [activeSessionId])

  const renameSession = useCallback((id: string, name: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: name } : s))
  }, [])

  const togglePin = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))
  }, [])

  const newFolder = useCallback((name: string, color?: string) => {
    setFolders(prev => [...prev, { id: uid(), name, expanded: true, color }])
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id))
    setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s))
  }, [])

  const setFolderColor = useCallback((folderId: string, color: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, color } : f))
  }, [])

  const toggleFolder = useCallback((id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f))
  }, [])

  const moveSession = useCallback((sessionId: string, folderId: string | null) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, folderId } : s))
  }, [])

  const handleSendMessage = useCallback(async (content?: string) => {
    const msg = content || chatInputValue.trim()
    if (!msg || isStreaming) return

    // Slash commands
    if (msg === '/clear') {
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [] } : s
      ))
      setChatInputValue('')
      return
    }

    if (msg === '/help') {
      const helpMsg: Message = {
        role: 'assistant',
        content: '### Comandos Disponiveis\n\n- `/clear` — Limpa a conversa atual\n- `/help` — Mostra esta ajuda\n\nTambem podes usar `@` para mencionar imagens do Creative Studio.',
        timestamp: new Date().toISOString(),
      }
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, helpMsg] } : s
      ))
      setChatInputValue('')
      return
    }

    // Auto-title first message
    const shouldRename = activeSession.messages.length === 0 && activeSession.title === 'Nova Conversa'

    const userMsg: Message = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }

    const assistantMsgId = uid()
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    // Update session with user message and empty assistant
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      const newMessages = [...s.messages, userMsg, { ...assistantMsg, id: assistantMsgId } as any]
      return {
        ...s,
        messages: newMessages,
        title: shouldRename ? msg.slice(0, 50) + (msg.length > 50 ? '...' : '') : s.title,
      }
    }))

    setChatInputValue('')
    setShowSuggestions(false)
    setStreamingContent('')
    setIsStreamingDone(false)

    // Build conversation context
    const conversationMessages = activeSession.messages
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))
    conversationMessages.push({ role: 'user', content: msg })

    const model = activeSession.model || gatewayActiveModel || 'deepseek-v4-flash'

    // Try SSE streaming, fallback to non-streaming
    try {
      await startStream(conversationMessages, model)
    } catch {
      // Fallback to non-streaming
      try {
        const res = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversationMessages, model }),
        })
        if (res.ok) {
          const data = await res.json()
          const reply = data.reply || data.message || data.content || 'Sem resposta.'
          setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? {
              ...s,
              messages: s.messages.map((m, i) =>
                i === s.messages.length - 1 && m.role === 'assistant'
                  ? { ...m, content: reply }
                  : m
              ),
            } : s
          ))
        }
      } catch (err) {
        console.error('Chat error:', err)
      }
    }
  }, [chatInputValue, isStreaming, activeSessionId, activeSession, startStream])

  // When stream finishes, commit content to session
  useEffect(() => {
    if (isStreamingDone && streamingContent) {
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s
        const lastIdx = s.messages.length - 1
        const lastMsg = s.messages[lastIdx]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          const updated = [...s.messages]
          updated[lastIdx] = { ...lastMsg, content: streamingContent }
          return { ...s, messages: updated }
        }
        return s
      }))
      setIsStreamingDone(false)
      setStreamingContent('')
    }
  }, [isStreamingDone, streamingContent, activeSessionId])

  // Copy message
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopiedMessageId('msg-copied')
    setTimeout(() => setCopiedMessageId(null), 2000)
  }, [])

  // Edit message (resend from that point)
  const handleEditMessage = useCallback((index: number, newContent: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      // Truncate messages after the edited one and resend
      const truncated = s.messages.slice(0, index)
      const editedUserMsg: Message = { ...s.messages[index], content: newContent }
      return { ...s, messages: [...truncated, editedUserMsg] }
    }))

    // Resend from the edited message
    const truncated = activeSession.messages.slice(0, index)
    const conversationMessages = truncated
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))
    conversationMessages.push({ role: 'user', content: newContent })

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [...s.messages.slice(0, index), s.messages[index], assistantMsg] } : s
    ))

    startStream(conversationMessages, activeSession.model)
  }, [activeSessionId, activeSession, startStream])

  // Regenerate
  const handleRegenerate = useCallback((index: number) => {
    // Find the last user message before this assistant message
    let lastUserIdx = -1
    for (let i = index - 1; i >= 0; i--) {
      if (activeSession.messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const conversationMessages = activeSession.messages
      .slice(0, index)
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      const updated = [...s.messages]
      updated[index] = { ...updated[index], content: '' }
      return { ...s, messages: updated }
    }))

    startStream(conversationMessages, activeSession.model)
  }, [activeSessionId, activeSession, startStream])

  // Delete message
  const handleDeleteMessage = useCallback((index: number) => {
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: s.messages.filter((_, i) => i !== index) }
        : s
    ))
  }, [activeSessionId])

  // @mention handling for chat
  const handleChatInputChange = useCallback((val: string) => {
    setChatInputValue(val)
    const _cursorIdx = val.length // textarea doesn't give us cursor via onChange prop directly
    const textBeforeCursor = val

    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(' ')) {
      const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase()
      // We need uploads list for mentions - skip if not available
    } else {
      setShowSuggestions(false)
    }
  }, [])

  const insertSuggestion = useCallback((name: string) => {
    const before = chatInputValue.slice(0, suggestionTriggerIdx)
    const after = chatInputValue.slice(chatInputValue.length)
    setChatInputValue(`${before}@${name} ${after}`)
    setShowSuggestions(false)
  }, [chatInputValue, suggestionTriggerIdx])

  // ── Keyboard shortcuts ──────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+K: new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        createNewSession()
      }
      // Escape: stop streaming
      if (e.key === 'Escape' && isStreaming) {
        stopStreaming()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createNewSession, isStreaming, stopStreaming])

  // ── Studio State ────────────────────────
  const [studioMessages, setStudioMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ec_studio_messages')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{
      role: 'assistant',
      content: 'Bem-vindo ao **Creative Studio**! 🎨\n\nEu sou o **Hermes**, e estou ligado ao **Higgsfield** para te ajudar a criar imagens e vídeos promocionais premium para a tua loja.\n\nExperimenta fazer upload de imagens no painel lateral, usa `@` para as referenciar nas tuas mensagens e pede-me para:\n- **Criar uma imagem** (ex: *"Cria uma imagem de uma sapatilha desportiva em fundo cyberpunk"*)\n- **Gerar um vídeo** (ex: *"Anima esta @imagem para fazer um vídeo de 5 segundos"*)\n- **Modificar ou estender** conteúdo visual.'
    }]
  })
  const [studioInput, setStudioInput] = useState('')
  const [studioLoading, setStudioLoading] = useState(false)
  const [studioUploads, setStudioUploads] = useState<{name: string, filename: string, url: string, size: number}[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, filename: string} | null>(null)
  const [_studioModel, _setStudioModel] = useState('higgsfield-v2-beta')
  const studioMessagesEndRef = useRef<HTMLDivElement>(null)
  const studioFileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => { localStorage.setItem('ec_studio_messages', JSON.stringify(studioMessages)) }, [studioMessages])

  const fetchStudioUploads = useCallback(async () => {
    setUploadsLoading(true)
    try {
      const res = await fetch(`${API}/studio/uploads`)
      if (res.ok) {
        const d = await res.json()
        setStudioUploads(d.uploads || [])
      }
    } catch (err) { console.error("Erro ao carregar uploads", err) }
    finally { setUploadsLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'studio' || activeTab === 'chat') fetchStudioUploads()
  }, [activeTab, fetchStudioUploads])

  useEffect(() => {
    if (activeTab === 'studio') studioMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [studioMessages, activeTab])

  const uploadFile = async (file: File) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploadsLoading(true)
    setDuplicateAlert(null)
    try {
      const res = await fetch(`${API}/studio/upload`, { method: 'POST', body: formData })
      if (res.status === 409) {
        const errData = await res.json()
        setDuplicateAlert(errData.detail || 'Esta imagem ja existe nos assets.')
        return
      }
      if (!res.ok) throw new Error('Falha no upload')
      const data = await res.json()
      setStudioUploads(prev => [data, ...prev])
    } catch { alert('Erro ao fazer upload da imagem.') }
    finally { setUploadsLoading(false) }
  }

  const handleStudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (e.target) e.target.value = ''
  }

  const handleDropFile = (files: FileList | null) => {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  const handleStudioSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studioInput.trim() || studioLoading) return
    const userText = studioInput.trim()
    setStudioInput('')
    setShowSuggestions(false)
    const userMsg: Message = { role: 'user', content: userText }
    setStudioMessages(prev => [...prev, userMsg])
    setStudioLoading(true)
    try {
      const res = await fetch(`${API}/studio/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      })
      if (!res.ok) throw new Error('Erro na geração')
      const d = await res.json()
      setStudioMessages(prev => [...prev, { role: 'assistant', content: d.reply, media: d.media }])
    } catch {
      setStudioMessages(prev => [...prev, { role: 'assistant', content: '❌ Ocorreu um erro ao gerar o conteúdo.' }])
    } finally { setStudioLoading(false) }
  }

  // ── Orders Tab ──────────────────────────
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [fulFilter, setFulFilter] = useState('')

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await fetch(`${API}/orders`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) { console.error('Orders fetch error', err) }
    finally { setOrdersLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [activeTab])

  // ── Order Detail Panel ──────────────────
  const [selectedOrderName, setSelectedOrderName] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<any | null>(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)

  const fetchOrderDetail = useCallback(async (orderName: string) => {
    setOrderDetailLoading(true)
    setOrderDetail(null)
    try {
      const res = await fetch(`${API}/orders/${encodeURIComponent(orderName)}`)
      if (res.ok) {
        const data = await res.json()
        setOrderDetail(data.order || data)
      }
    } catch (err) { console.error('Order detail error', err) }
    finally { setOrderDetailLoading(false) }
  }, [])

  const closeOrderPanel = useCallback(() => {
    setSelectedOrderName(null)
    setOrderDetail(null)
  }, [])

  const talkToHermes = useCallback((order: any) => {
    const itemsText = (order.items || [])
      .map((i: any) => `- ${i.qty}x ${i.title}${i.sku ? ` (${i.sku})` : ''}${i.price ? ` — ${i.price}${order.currency || '€'}` : ''}`)
      .join('\n')
    const contextMsg = `📋 **${order.name}**\nCliente: ${order.customer}\nEmail: ${order.email}\nTotal: ${order.total}${order.currency || '€'}\nEstado: ${order.status}\nEnvio: ${order.fulfillment}\nMorada: ${order.address}\n\n**Items:**\n${itemsText || '-'}`

    setChatInputValue(contextMsg)
    setActiveTab('chat')
  }, [setChatInputValue, setActiveTab])

  // ── Emails Tab ──────────────────────────
  const [emails, setEmails] = useState<any[]>([])
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [emailThread, setEmailThread] = useState<any[] | null>(null)
  const [emailThreadLoading, setEmailThreadLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmails() {
      setEmailsLoading(true)
      try {
        const res = await fetch(`${API}/zoho/emails`)
        if (res.ok) {
          const data = await res.json()
          setEmails(data.emails || [])
        }
      } catch (err) { console.error('Emails fetch error', err) }
      finally { setEmailsLoading(false) }
    }
    if (activeTab === 'emails') fetchEmails()
  }, [activeTab])

  const viewEmail = async (id: string) => {
    setEmailDetailLoading(true)
    setSelectedEmail(null)
    setEmailThread(null)
    try {
      const res = await fetch(`${API}/zoho/emails/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedEmail(data)
      }
    } catch (err) { console.error('Email detail error', err) }
    finally { setEmailDetailLoading(false) }
  }

  const viewThread = async (id: string) => {
    setEmailThreadLoading(true)
    setEmailThread(null)
    try {
      const res = await fetch(`${API}/zoho/emails/${id}/thread`)
      if (res.ok) {
        const data = await res.json()
        setEmailThread(data.messages || [])
      }
    } catch (err) { console.error('Email thread error', err) }
    finally { setEmailThreadLoading(false) }
  }

  const ignoreEmail = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API}/zoho/emails/${id}/read`, { method: 'POST' })
      setEmails(prev => prev.filter(e => e.id !== id))
      if (selectedEmail?.id === id) setSelectedEmail(null)
    } catch (err) { console.error('Ignore error', err) }
    finally { setActionLoading(null) }
  }

  const archiveEmail = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API}/zoho/emails/${id}/archive`, { method: 'POST' })
      setEmails(prev => prev.filter(e => e.id !== id))
      if (selectedEmail?.id === id) setSelectedEmail(null)
    } catch (err) { console.error('Archive error', err) }
    finally { setActionLoading(null) }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString('pt-PT', { weekday: 'short' })
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
  }

  // ── Memory Tab ──────────────────────────
  const [memoryEntries, setMemoryEntries] = useState<any[]>([])
  const [memoryLoading, setMemoryLoading] = useState(true)
  const [newMemory, setNewMemory] = useState('')

  useEffect(() => {
    async function fetchMemory() {
      setMemoryLoading(true)
      try {
        const res = await fetch(`${API}/memory/files`)
        if (res.ok) {
          const data = await res.json()
          setMemoryEntries(data.files || data.entries || data.memories || [])
        }
      } catch (err) { console.error('Memory fetch error', err) }
      finally { setMemoryLoading(false) }
    }
    if (activeTab === 'memory') fetchMemory()
  }, [activeTab])

  const addMemory = async () => {
    if (!newMemory.trim()) return
    try {
      const res = await fetch(`${API}/memory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemory.trim() }),
      })
      if (res.ok) {
        setNewMemory('')
        const r = await fetch(`${API}/memory/files`)
        if (r.ok) { const d = await r.json(); setMemoryEntries(d.files || d.entries || d.memories || []) }
      }
    } catch (err) { console.error('Memory add error', err) }
  }

  // ── Memory File View/Edit ────────────────
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<any | null>(null)
  const [memoryFileContent, setMemoryFileContent] = useState('')
  const [memoryFileLoading, setMemoryFileLoading] = useState(false)
  const [memoryEditMode, setMemoryEditMode] = useState(false)
  const [memoryEditContent, setMemoryEditContent] = useState('')
  const [memorySaving, setMemorySaving] = useState(false)

  const homeDir = '/Users/' + (typeof window !== 'undefined' ? window.location.hostname === 'localhost' ? 'santiagoveloso' : '' : '')

  const loadMemoryFile = useCallback(async (file: any) => {
    setSelectedMemoryFile(file)
    setMemoryFileLoading(true)
    setMemoryEditMode(false)
    try {
      // The file.path is absolute (e.g. /Users/santiagoveloso/ghost/MEMORY.md)
      // The /memory/read endpoint expects a path relative to ~/ghost/
      const ghostPrefix = '/Users/santiagoveloso/ghost/'
      const relativePath = file.path.startsWith(ghostPrefix)
        ? file.path.slice(ghostPrefix.length)
        : file.path
      const res = await fetch(`${API}/memory/read?path=${encodeURIComponent(relativePath)}`)
      if (res.ok) {
        const data = await res.json()
        setMemoryFileContent(data.content || '')
        setMemoryEditContent(data.content || '')
      } else {
        setMemoryFileContent('*Erro ao carregar o ficheiro.*')
        setMemoryEditContent('')
      }
    } catch (err) {
      console.error('Memory read error', err)
      setMemoryFileContent('*Erro ao carregar o ficheiro.*')
    } finally {
      setMemoryFileLoading(false)
    }
  }, [])

  const saveMemoryFile = useCallback(async () => {
    if (!selectedMemoryFile) return
    setMemorySaving(true)
    try {
      const res = await fetch(`${API}/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedMemoryFile.path, content: memoryEditContent }),
      })
      if (res.ok) {
        setMemoryFileContent(memoryEditContent)
        setMemoryEditMode(false)
      }
    } catch (err) {
      console.error('Memory save error', err)
    } finally {
      setMemorySaving(false)
    }
  }, [selectedMemoryFile, memoryEditContent])

  // ── Links Tab ───────────────────────────
  const DEFAULT_LINKS = [
    { id: 'bp-academy', name: 'Blueprint Academy', url: 'https://www.blueprint-academy.com/dashboard' },
    { id: 'sp-lite', name: 'SP Lite', url: 'https://app.sp-lite.com/' },
    { id: 'ads-manager', name: 'Ads Manager', url: 'https://adsmanager.facebook.com/' },
    { id: 'ads-library', name: 'Ads Library', url: 'https://www.facebook.com/ads/library/' },
    { id: 'google-analytics', name: 'Google Analytics', url: 'https://analytics.google.com/' },
    { id: 'shopify', name: 'Shopify Loja', url: '' },
  ]
  const [links, setLinks] = useState<{id: string; name: string; url: string}[]>(() => {
    try {
      const saved = localStorage.getItem('ec_links')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_LINKS
  })
  const [showAddLink, setShowAddLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [shopifyUrl, setShopifyUrl] = useState(() => localStorage.getItem('ec_shopify_url') || '')
  useEffect(() => { localStorage.setItem('ec_links', JSON.stringify(links)) }, [links])
  useEffect(() => { localStorage.setItem('ec_shopify_url', shopifyUrl) }, [shopifyUrl])

  // Keep Shopify link in sync with configurable URL
  const displayLinks = links.map(l =>
    l.id === 'shopify' ? { ...l, url: shopifyUrl } : l
  )

  const addLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return
    setLinks(prev => [...prev, { id: uid(), name: newLinkName.trim(), url: newLinkUrl.trim() }])
    setNewLinkName('')
    setNewLinkUrl('')
    setShowAddLink(false)
  }

  const deleteLink = (id: string) => {
    if (id === 'shopify') { setShopifyUrl(''); return }
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  const LINK_GRADIENTS: Record<string, string> = {
    'bp-academy': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'sp-lite': 'linear-gradient(135deg, #14b8a6, #10b981)',
    'ads-manager': 'linear-gradient(135deg, #f97316, #ef4444)',
    'ads-library': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'google-analytics': 'linear-gradient(135deg, #f59e0b, #eab308)',
    'shopify': 'linear-gradient(135deg, #059669, #10b981)',
  }

  const LINK_ICONS: Record<string, string> = {
    'bp-academy': 'BP',
    'sp-lite': 'SP',
    'ads-manager': 'AM',
    'ads-library': 'AL',
    'google-analytics': 'GA',
    'shopify': 'SH',
  }

  const getGradient = (id: string, idx: number) => {
    if (LINK_GRADIENTS[id]) return LINK_GRADIENTS[id]
    const palettes = [
      'linear-gradient(135deg, #ec4899, #8b5cf6)',
      'linear-gradient(135deg, #3b82f6, #6366f1)',
      'linear-gradient(135deg, #f43f5e, #e11d48)',
      'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    ]
    return palettes[idx % palettes.length]
  }

  // ── Automations Tab ─────────────────────
  const [automations, setAutomations] = useState<any[]>([])
  const [automationsLoading, setAutomationsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAutoName, setNewAutoName] = useState('')
  const [newAutoSchedule, setNewAutoSchedule] = useState('')
  const [newAutoPrompt, setNewAutoPrompt] = useState('')
  const [newAutoSkills, setNewAutoSkills] = useState('')
  const [newAutoDeliver, setNewAutoDeliver] = useState('local')
  const [creating, setCreating] = useState(false)
  const [autoActionLoading, setAutoActionLoading] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAutomations() {
      setAutomationsLoading(true)
      try {
        const res = await fetch(`${API}/automations`)
        if (res.ok) {
          const data = await res.json()
          setAutomations(data.automations || [])
        }
      } catch (err) { console.error('Automations fetch error', err) }
      finally { setAutomationsLoading(false) }
    }
    if (activeTab === 'automations') fetchAutomations()
  }, [activeTab])

  const pauseAutomation = async (id: string) => {
    try {
      const res = await fetch(`${API}/automations/${id}/pause`, { method: 'POST' })
      if (res.ok) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' } : a))
      }
    } catch (err) { console.error('Pause error', err) }
  }

  const resumeAutomation = async (id: string) => {
    try {
      const res = await fetch(`${API}/automations/${id}/resume`, { method: 'POST' })
      if (res.ok) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: 'active' } : a))
      }
    } catch (err) { console.error('Resume error', err) }
  }

  const deleteAutomation = async (id: string) => {
    setAutoActionLoading(id)
    try {
      const res = await fetch(`${API}/automations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id))
      }
    } catch (err) { console.error('Delete error', err) }
    finally { setAutoActionLoading(null) }
  }

  const runAutomationNow = async (id: string) => {
    setAutoActionLoading(id)
    try {
      await fetch(`${API}/automations/${id}/run`, { method: 'POST' })
      setAutoActionLoading(null)
    } catch (err) { console.error('Run error', err) }
    finally { setAutoActionLoading(null) }
  }

  const createAutomation = async () => {
    if (!newAutoName.trim() || !newAutoSchedule.trim() || !newAutoPrompt.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAutoName.trim(),
          schedule: newAutoSchedule.trim(),
          prompt: newAutoPrompt.trim(),
          skills: newAutoSkills.trim(),
          deliver: newAutoDeliver,
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewAutoName('')
        setNewAutoSchedule('')
        setNewAutoPrompt('')
        setNewAutoSkills('')
        // Refresh list
        const r = await fetch(`${API}/automations`)
        if (r.ok) setAutomations((await r.json()).automations || [])
      }
    } catch (err) { console.error('Create error', err) }
    finally { setCreating(false) }
  }

  // ── Sidebar resize ──────────────────────
  const isResizing = useRef(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const COLLAPSE_THRESHOLD = 80
  const collapsedRef = useRef(sidebarCollapsed)
  collapsedRef.current = sidebarCollapsed

  const handleResizeStart = useCallback((_e: React.MouseEvent) => {
    isResizing.current = true
    setIsTransitioning(false)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // Toggle collapsed/expanded on double-click or icon click
  const toggleSidebar = useCallback(() => {
    setIsTransitioning(true)
    if (sidebarCollapsed) {
      // Expand to last known width (or default 200)
      setSidebarCollapsed(false)
      setSidebarWidth(prev => Math.max(prev, 190))
    } else {
      setSidebarCollapsed(true)
    }
    setTimeout(() => setIsTransitioning(false), 200)
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const w = Math.max(56, Math.min(400, e.clientX))
      setSidebarWidth(w)
      if (w < COLLAPSE_THRESHOLD && !collapsedRef.current) setSidebarCollapsed(true)
      if (w > COLLAPSE_THRESHOLD + 20 && collapsedRef.current) setSidebarCollapsed(false)
    }
    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Snap to collapsed width fully if under threshold
      if (sidebarWidth < COLLAPSE_THRESHOLD && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [sidebarCollapsed, sidebarWidth])

  // ── Studio @mention autocomplete ──────────
  const [studioSuggestions, setStudioSuggestions] = useState<string[]>([])
  const [studioShowSuggestions, setStudioShowSuggestions] = useState(false)
  const [studioSuggestionTriggerIdx, setStudioSuggestionTriggerIdx] = useState(-1)
  const [studioActiveSuggestionIdx, setStudioActiveSuggestionIdx] = useState(0)

  const handleStudioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setStudioInput(val)

    const cursorIdx = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursorIdx)
    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(' ')) {
      const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase()
      const filtered = studioUploads.map(u => u.name).filter(name => name.toLowerCase().includes(query))
      if (filtered.length > 0) {
        setStudioSuggestions(filtered)
        setStudioShowSuggestions(true)
        setStudioSuggestionTriggerIdx(lastAtIdx)
        setStudioActiveSuggestionIdx(0)
      } else { setStudioShowSuggestions(false) }
    } else { setStudioShowSuggestions(false) }
  }

  const insertStudioSuggestion = (name: string) => {
    const before = studioInput.slice(0, studioSuggestionTriggerIdx)
    const inputEl = document.getElementById('studio-input-el') as HTMLInputElement
    const cursorIdx = inputEl?.selectionStart || studioInput.length
    const after = studioInput.slice(cursorIdx)
    setStudioInput(`${before}@${name} ${after}`)
    setStudioShowSuggestions(false)
    setTimeout(() => { if (inputEl) { inputEl.focus(); inputEl.setSelectionRange(before.length + name.length + 2, before.length + name.length + 2) } }, 10)
  }

  const handleStudioInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (studioShowSuggestions) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setStudioActiveSuggestionIdx(prev => (prev + 1) % studioSuggestions.length) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setStudioActiveSuggestionIdx(prev => (prev - 1 + studioSuggestions.length) % studioSuggestions.length) }
      else if (e.key === 'Enter') { e.preventDefault(); insertStudioSuggestion(studioSuggestions[studioActiveSuggestionIdx]) }
      else if (e.key === 'Escape') { e.preventDefault(); setStudioShowSuggestions(false) }
    }
  }

  // ── Delete asset ────────────────────────
  const deleteAsset = async (filename: string) => {
    try {
      const res = await fetch(`${API}/studio/upload/${filename}`, { method: 'DELETE' })
      if (res.ok) setStudioUploads(prev => prev.filter(a => a.filename !== filename))
    } catch (err) { console.error('Erro ao eliminar', err) }
  }

  // ── Render ──────────────────────────────
  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────── */}
      <div ref={sidebarRef} className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isTransitioning ? 'transition' : ''}`} style={{ width: sidebarCollapsed ? 56 : sidebarWidth }}>
        <div className="sidebar-logo">
          <div className="logo-icon">EC</div>
          {!sidebarCollapsed && (
            <>
              <span className="logo-text">chat</span>
              <span className="logo-badge">v2</span>
            </>
          )}
        </div>

        <div className="sidebar-nav">
          <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            {Icons.grid}{!sidebarCollapsed && <span>Dashboard</span>}
          </a>
          <a className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            {Icons.chat}{!sidebarCollapsed && <span>Chat</span>}
          </a>
          <a className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            {Icons.cart}{!sidebarCollapsed && <span>Orders</span>}
          </a>
          <a className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
            {Icons.mail}{!sidebarCollapsed && <span>Emails</span>}
          </a>
          <a className={`nav-item ${activeTab === 'studio' ? 'active' : ''}`} onClick={() => setActiveTab('studio')}>
            {Icons.studio}{!sidebarCollapsed && <span>Creative Studio</span>}
          </a>
          <a className={`nav-item ${activeTab === 'automations' ? 'active' : ''}`} onClick={() => setActiveTab('automations')}>
            {Icons.zap}{!sidebarCollapsed && <span>Automacoes</span>}
          </a>
          <a className={`nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
            {Icons.memory}{!sidebarCollapsed && <span>Memoria</span>}
          </a>
          <a className={`nav-item ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
            {Icons.link}{!sidebarCollapsed && <span>Links</span>}
          </a>
        </div>

        <div className="sidebar-footer">
          <div className="status-row">
            <div className="status-dot" />
            {!sidebarCollapsed && <span>Conectado</span>}
          </div>
          <button className="theme-toggle" onClick={() => setDark(!dark)} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? Icons.sun : Icons.moon}
          </button>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          style={{
            position: 'absolute', bottom: 12,
            right: sidebarCollapsed ? '50%' : -14,
            transform: sidebarCollapsed ? 'translateX(50%)' : 'none',
            background: 'var(--surface)', border: '1px solid var(--surface-border)',
            borderRadius: '50%', width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', zIndex: 11, padding: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Resize handle — always visible */}
        <div className="resize-handle" onMouseDown={handleResizeStart} title="Arrastar para redimensionar" />
      </div>

      {/* ── Main Content ────────────────── */}
      <div className="main" style={{ padding: '0' }}>
        {activeTab === 'dashboard' && (
          <div style={{ padding: '32px 40px' }}>
            <div className="topbar">
              <div>
                <h1 className="page-title">{dashboardData?.storeName || 'Dashboard'}</h1>
                <p className="greeting">Visao geral da sua loja <span className="greeting-highlight">em tempo real</span></p>
              </div>
              <div className="topbar-actions" style={{ position: 'relative' }}>
                <div className="period-selector">
                  {['today', 'week', 'month'].map(p => (
                    <button key={p} className={`period-btn ${period === p && !dateRange ? 'active' : ''}`} onClick={() => changePeriod(p)}>
                      {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                  <button className={`period-btn ${dateRange ? 'active' : ''}`} onClick={() => { setShowDatePicker(!showDatePicker); setCalSince(''); setCalUntil('') }}>
                    {Icons.calendar}
                  </button>
                </div>
                <button className="refresh-btn" onClick={handleRefresh}>{Icons.refresh} Atualizar</button>

                {showDatePicker && (
                  <div className="date-picker-dropdown" ref={pickerRef}>
                    <div className="date-picker-presets">
                      <button className="preset-btn" onClick={() => changePeriod('today')}>Hoje</button>
                      <button className="preset-btn" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 1)
                        changePeriod('custom', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                      }}>Ontem</button>
                      <button className="preset-btn" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 6)
                        changePeriod('last_7', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                      }}>Últimos 7 dias</button>
                      <button className="preset-btn" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 13)
                        changePeriod('last_14', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                      }}>Últimos 14 dias</button>
                      <button className="preset-btn" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() - 29)
                        changePeriod('last_30', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
                      }}>Últimos 30 dias</button>
                      <button className="preset-btn" onClick={() => {
                        const d = new Date(); d.setDate(1)
                        changePeriod('this_month', d.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
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
                            {renderMonth(m.month, m.year)}
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
              <div style={{ opacity: dashboardLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {dashboardData ? (
              <>
                <div className="cards four-cols">
                  <div className="card accent-blue">
                    <div className="card-icon" style={{ background: 'var(--chart-blue)' }}>{Icons.dollar}</div>
                    <div className="card-value">{dashboardData.revenue != null ? `${dashboardData.revenue.toFixed(2)}€` : dashboardData.revenueToday}</div>
                    <div className="card-label">{period === 'today' ? 'Receita de Hoje' : period === 'week' ? 'Receita (7 dias)' : 'Receita do Mês'}</div>
                  </div>
                  <div className="card accent-purple">
                    <div className="card-icon" style={{ background: 'var(--chart-purple)' }}>{Icons.trending}</div>
                    <div className="card-value">{dashboardData.roas != null ? `${dashboardData.roas}x` : '-'}</div>
                    <div className="card-label">ROAS</div>
                  </div>
                  <div className="card accent-green">
                    <div className="card-icon" style={{ background: 'var(--success)' }}>{Icons.cart}</div>
                    <div className="card-value">{dashboardData.orders != null ? dashboardData.orders : dashboardData.ordersToday}</div>
                    <div className="card-label">Compras{period === 'today' ? ' Hoje' : period === 'week' ? ' (7 dias)' : ' (Mês)'}</div>
                  </div>
                  <div className="card accent-cyan">
                    <div className="card-icon" style={{ background: 'var(--chart-cyan)' }}>{Icons.dollar}</div>
                    <div className="card-value">{dashboardData.spend != null ? `${dashboardData.spend.toFixed(2)}€` : '-'}</div>
                    <div className="card-label">Gasto AdSpend</div>
                  </div>
                </div>

                {dashboardData.pendingApprovals > 0 && (
                  <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--warning)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {Icons.alert}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{dashboardData.pendingApprovals} aprovacoes pendentes</span>
                    </div>
                  </div>
                )}

                <RevenueChart />

                <div className="sections">
                  <div className="section">
                    <div className="section-header">
                      <h2>Pedidos Recentes</h2>
                      <a className="more-link" onClick={() => setActiveTab('orders')}>Ver todos</a>
                    </div>
                    <table className="table">
                      <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
                      <tbody>
                        {(dashboardData.recentOrders || []).map((o, i) => (
                          <tr key={i}>
                            <td><span className="order-name">{o.name}</span></td>
                            <td>{o.customer}</td>
                            <td>{o.total}</td>
                            <td><span className={`status-tag ${o.status}`}>{o.status}</span></td>
                            <td>{o.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="section">
                    <div className="section-header"><h2>Acoes Rapidas</h2></div>
                    <div className="quick-actions">
                      <button className="quick-btn" onClick={() => setActiveTab('chat')}>{Icons.chat} Perguntar ao Agente</button>
                      <button className="quick-btn" onClick={() => setActiveTab('studio')}>{Icons.studio} Criar Conteudo</button>
                      <button className="quick-btn" onClick={() => setActiveTab('emails')}>{Icons.mail} Enviar Email</button>
                      <button className="quick-btn" onClick={handleRefresh}>{Icons.refresh} Atualizar Dados</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sem dados disponiveis</div>
            )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-layout" style={{ display: 'flex', height: '100vh' }}>
            {/* Chat Session Sidebar */}
            <div className="chat-session-sidebar" style={{
              width: 260,
              borderRight: '1px solid var(--surface-border)',
              background: 'var(--bg-sidebar)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              flexShrink: 0,
            }}>
              <SessionSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                folders={folders}
                searchQuery={sessionSearchQuery}
                onSearchChange={setSessionSearchQuery}
                onSelectSession={setActiveSessionId}
                onNewSession={createNewSession}
                onDeleteSession={deleteSession}
                onRenameSession={renameSession}
                onTogglePin={togglePin}
                onNewFolder={newFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
                onSetFolderColor={setFolderColor}
                onToggleFolder={toggleFolder}
                onMoveSession={moveSession}
              />
            </div>

            {/* Chat Pane */}
            <div className="chat-pane">
              {/* Chat header — minimal, Codex-style */}
              <div className="chat-header">
                <div className="chat-header-left">
                  {chatEditingTitle ? (
                    <input
                      className="chat-header-title-input"
                      value={chatEditingTitle}
                      onChange={e => setChatEditingTitle(e.target.value)}
                      onBlur={() => {
                        if (chatEditingTitle.trim() && activeSession) {
                          renameSession(activeSession.id, chatEditingTitle.trim())
                        }
                        setChatEditingTitle(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur()
                        }
                        if (e.key === 'Escape') setChatEditingTitle(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="chat-header-title"
                      onClick={() => activeSession && setChatEditingTitle(activeSession.title)}
                    >
                      {activeSession?.title || 'Chat'}
                    </span>
                  )}
                  {isStreaming && (
                    <span className="chat-header-streaming">
                      <span className="streaming-dot" />
                      Streaming...
                    </span>
                  )}
                  {streamError && (
                    <span className="chat-header-error">{streamError}</span>
                  )}
                </div>
                <button className="chat-header-new" onClick={createNewSession} title="Nova conversa">
                  {Icons.plus}
                </button>
              </div>

              {/* Messages */}
              <ChatMessages
                messages={activeSession?.messages || []}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                onCopy={handleCopyMessage}
                copiedMessageId={copiedMessageId}
                onEdit={handleEditMessage}
                onRegenerate={handleRegenerate}
                onDelete={handleDeleteMessage}
                onNewChat={createNewSession}
                emptyStateTitle={`What should we work on today${dashboardData?.storeName ? ` in ${dashboardData.storeName}` : ''}?`}
                emptyStateSubtitle=""
              />

              {/* Input */}
              <ChatInput
                value={chatInputValue}
                onChange={handleChatInputChange}
                onSend={() => handleSendMessage()}
                isStreaming={isStreaming}
                onStop={stopStreaming}
                placeholder="Pergunte sobre a sua loja..."
                uploads={studioUploads}
                showSuggestions={showSuggestions}
                suggestions={suggestions}
                suggestionTriggerIdx={suggestionTriggerIdx}
                activeSuggestionIdx={activeSuggestionIdx}
                onShowSuggestions={setShowSuggestions}
                onSelectSuggestion={insertSuggestion}
                onSetSuggestions={setSuggestions}
                onSetTriggerIdx={setSuggestionTriggerIdx}
                onSetActiveSuggestionIdx={setActiveSuggestionIdx}
                model={activeSession?.model || gatewayActiveModel}
                onModelChange={(model) => {
                  setSessions(prev => prev.map(s =>
                    s.id === activeSessionId ? { ...s, model } : s
                  ))
                  setActiveModel(model)
                }}
                models={availableModels}
              />
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ padding: '32px 40px' }}>
            <div className="topbar">
              <div>
                <h1 className="page-title">ORDERS</h1>
                <p className="greeting">Gerencie todos os pedidos da sua loja</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedOrderName && (
                  <button className="refresh-btn" onClick={closeOrderPanel}>{Icons.refresh} Fechar detalhes</button>
                )}
                <button className="refresh-btn" onClick={fetchOrders}>{Icons.refresh} Atualizar</button>
              </div>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'end' }}>
              <input
                type="text" placeholder="Pesquisar por pedido, cliente ou produto..."
                value={ordersSearch} onChange={e => setOrdersSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>até</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
              </div>
              <select value={payFilter} onChange={e => setPayFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
                <option value="">Pagamento: Todos</option>
                <option value="PAID">Pago</option>
                <option value="PENDING">Pendente</option>
                <option value="REFUNDED">Reembolsado</option>
                <option value="VOIDED">Cancelado</option>
              </select>
              <select value={fulFilter} onChange={e => setFulFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
                <option value="">Envio: Todos</option>
                <option value="FULFILLED">Entregue</option>
                <option value="UNFULFILLED">Por enviar</option>
                <option value="PARTIAL">Parcial</option>
              </select>
            </div>

            {ordersLoading ? (
              <div className="loading-screen"><div className="loader" /></div>
            ) : (
              <div className="orders-layout">
                {/* ── Table Section ── */}
                <div className="orders-table-section">
                  <div className="section">
                    {(() => {
                      const wordMatch = (text: string, q: string) => {
                        if (!text || !q) return false
                        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        return new RegExp(`(?<![\\p{L}])${escaped}`, 'iu').test(text)
                      }
                      const filtered = orders.filter(o => {
                        const q = ordersSearch.toLowerCase().trim()
                        if (q) {
                          const nameOk = q.length >= 4 ? o.name?.toLowerCase().includes(q) : false
                          const custOk = wordMatch(o.customer, q)
                          const itemsOk = o.items?.some((i: any) => wordMatch(i.title, q))
                          if (!(nameOk || custOk || itemsOk)) return false
                        }
                        if (payFilter && o.financial_status !== payFilter) return false
                        if (fulFilter && o.fulfillment_status !== fulFilter) return false
                        if (dateFrom && o.created_at && o.created_at < dateFrom) return false
                        if (dateTo && o.created_at) {
                          const end = new Date(dateTo)
                          end.setDate(end.getDate() + 1)
                          if (new Date(o.created_at) > end) return false
                        }
                        return true
                      })
                      return (
                        <table className="table">
                          <thead><tr><th>Pedido</th><th>Cliente</th><th>Items</th><th>Total</th><th>Pagamento</th><th>Envio</th><th>Data</th></tr></thead>
                          <tbody>
                            {filtered.map((o, i) => (
                              <tr key={i} onClick={() => {
                                setSelectedOrderName(o.name)
                                fetchOrderDetail(o.name)
                              }}
                                style={{ background: selectedOrderName === o.name ? 'var(--accent-bg)' : undefined }}
                              >
                                <td><span className="order-name">{o.name}</span></td>
                                <td>{o.customer}</td>
                                <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {o.items?.map((i: any) => `${i.qty}x ${i.title}`).join(', ') || '-'}
                                </td>
                                <td>{parseFloat(o.total).toFixed(2)}€</td>
                                <td><span className={`status-tag ${(o.financial_status || '').toLowerCase()}`}>{o.financial_status || '-'}</span></td>
                                <td><span className={`status-tag ${(o.fulfillment_status || '').toLowerCase()}`}>{o.fulfillment_status || '-'}</span></td>
                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('pt-PT') : '-'}</td>
                              </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Nenhum pedido encontrado com esses filtros</td></tr>}
                          </tbody>
                        </table>
                      )
                    })()}
                  </div>
                </div>

                {/* ── Order Detail Panel ── */}
                {selectedOrderName && (
                  <div className="order-detail-panel">
                    <div className="order-detail-header">
                      <h3>{orderDetail?.name || selectedOrderName}</h3>
                      <button className="quick-btn" onClick={closeOrderPanel}
                        style={{ width: 'auto', padding: '6px 10px', fontSize: 11 }}>
                        ✕
                      </button>
                    </div>

                    {orderDetailLoading ? (
                      <div className="loading-screen" style={{ height: 200 }}><div className="loader" /></div>
                    ) : orderDetail ? (
                      <>
                        {/* Status */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                          <span className={`status-tag ${(orderDetail.status || '').toLowerCase()}`}>
                            {orderDetail.status || '-'}
                          </span>
                          <span className={`status-tag ${(orderDetail.fulfillment || '').toLowerCase()}`}>
                            {orderDetail.fulfillment || '-'}
                          </span>
                        </div>

                        {/* Cliente */}
                        <div className="order-detail-section">
                          <div className="order-detail-label">Cliente</div>
                          <div className="order-detail-value">{orderDetail.customer}</div>
                          {orderDetail.email && (
                            <div className="order-detail-value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {orderDetail.email}
                            </div>
                          )}
                          {orderDetail.phone && (
                            <div className="order-detail-value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {orderDetail.phone}
                            </div>
                          )}
                        </div>

                        {/* Total */}
                        <div className="order-detail-section">
                          <div className="order-detail-label">Total</div>
                          <div className="order-detail-value" style={{ fontSize: 20, fontWeight: 700 }}>
                            {parseFloat(orderDetail.total).toFixed(2)}{orderDetail.currency || '€'}
                          </div>
                        </div>

                        {/* Data */}
                        <div className="order-detail-section">
                          <div className="order-detail-label">Data</div>
                          <div className="order-detail-value">
                            {orderDetail.created_at ? new Date(orderDetail.created_at).toLocaleString('pt-PT') : '-'}
                          </div>
                        </div>

                        {/* Morada */}
                        {orderDetail.address && orderDetail.address !== 'N/A' && (
                          <div className="order-detail-section">
                            <div className="order-detail-label">Morada de Envio</div>
                            <div className="order-detail-value">{orderDetail.address}</div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="order-detail-section">
                          <div className="order-detail-label">Items ({orderDetail.items?.length || 0})</div>
                          {(orderDetail.items || []).map((item: any, i: number) => (
                            <div key={i} className="order-detail-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  {item.price ? `${item.price}${orderDetail.currency || '€'}` : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                Qty: {item.qty}{item.sku ? ` | SKU: ${item.sku}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Note */}
                        {orderDetail.note && (
                          <div className="order-detail-section">
                            <div className="order-detail-label">Nota</div>
                            <div className="order-detail-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                              {orderDetail.note}
                            </div>
                          </div>
                        )}

                        {/* Cancel reason */}
                        {orderDetail.cancel_reason && (
                          <div className="order-detail-section">
                            <div className="order-detail-label">Motivo de Cancelamento</div>
                            <div className="order-detail-value" style={{ color: 'var(--danger)' }}>
                              {orderDetail.cancel_reason}
                            </div>
                          </div>
                        )}

                        {/* Transactions */} 
                        {orderDetail.transactions && orderDetail.transactions.length > 0 && (
                          <div className="order-detail-section">
                            <div className="order-detail-label">Transacoes</div>
                            {orderDetail.transactions.slice(0, 3).map((tx: any, i: number) => (
                              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                {tx.kind} — {tx.amount}{orderDetail.currency || '€'}
                                {tx.gateway ? ` (${tx.gateway})` : ''}
                                {tx.date ? ` — ${new Date(tx.date).toLocaleDateString('pt-PT')}` : ''}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Falar com Hermes ── */}
                        <button className="order-hermes-btn" onClick={() => talkToHermes(orderDetail)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Falar com Hermes Agent
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        Nao foi possivel carregar os detalhes da encomenda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'emails' && (
          <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
            <div className="topbar" style={{ marginBottom: 20 }}>
              <div>
                <h1 className="page-title">Emails</h1>
                <p className="greeting">{emails.length} email{emails.length !== 1 ? 's' : ''} por ler de clientes</p>
              </div>
              <button className="refresh-btn" onClick={() => { setSelectedEmail(null); setEmailThread(null); }}>
                {Icons.refresh} Atualizar
              </button>
            </div>

            {/* Detail / Thread View */}
            {(selectedEmail || emailThread) && (
              <div className="section" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button className="quick-btn" onClick={() => { setSelectedEmail(null); setEmailThread(null); }}>
                    {Icons.refresh} Voltar
                  </button>
                  {selectedEmail && !emailThread && (
                    <button className="quick-btn" onClick={() => viewThread(selectedEmail.id)} disabled={emailThreadLoading}>
                      {emailThreadLoading ? 'A carregar...' : 'Ver thread completa'}
                    </button>
                  )}
                </div>

                {emailThread ? (
                  /* Thread View */
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                      Thread — {emailThread.length} mensagen{emailThread.length !== 1 ? 'ns' : ''}
                    </h3>
                    {emailThread.map((msg, i) => (
                      <div key={i} style={{
                        padding: '16px 20px', background: 'var(--bg)',
                        border: '1px solid var(--surface-border)', borderRadius: 12,
                        marginBottom: 12,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{msg.from || 'Desconhecido'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(msg.date)}</span>
                        </div>
                        {msg.subject && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{msg.subject}</div>}
                        <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)' }}>
                          {msg.content || '(sem conteúdo)'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedEmail ? (
                  /* Detail View */
                  <div>
                    {emailDetailLoading ? (
                      <div className="loading-screen"><div className="loader" /></div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{selectedEmail.subject || '(Sem Assunto)'}</div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span><strong>De:</strong> {selectedEmail.from}</span>
                            <span><strong>Para:</strong> {selectedEmail.to || 'nós'}</span>
                            <span><strong>Data:</strong> {formatDate(selectedEmail.date)}</span>
                          </div>
                        </div>
                        <div style={{
                          padding: 20, background: 'var(--bg)',
                          border: '1px solid var(--surface-border)', borderRadius: 12,
                          fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {selectedEmail.content || '(sem conteúdo)'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button className="quick-btn" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'transparent' }}
                            onClick={() => ignoreEmail(selectedEmail.id)} disabled={actionLoading === selectedEmail.id}>
                            {actionLoading === selectedEmail.id ? '...' : 'Ignorar'}
                          </button>
                          <button className="quick-btn" onClick={() => archiveEmail(selectedEmail.id)} disabled={actionLoading === selectedEmail.id}>
                            {actionLoading === selectedEmail.id ? '...' : 'Arquivar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Email List */}
            {!selectedEmail && !emailThread && (
              <div className="section">
                {emailsLoading ? (
                  <div className="loading-screen"><div className="loader" /></div>
                ) : emails.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{Icons.mail}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum email por ler. Tudo em dia!</p>
                  </div>
                ) : (
                  emails.map((em, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderBottom: '1px solid var(--surface-border)',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                      onClick={() => viewEmail(em.id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{em.from?.split('<')[0]?.trim() || em.from || 'Desconhecido'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>{formatDate(em.date)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {em.subject || '(Sem Assunto)'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {em.snippet || ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-secondary)' }}
                          onClick={() => ignoreEmail(em.id)} disabled={actionLoading === em.id}>
                          Ignorar
                        </button>
                        <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-secondary)' }}
                          onClick={() => archiveEmail(em.id)} disabled={actionLoading === em.id}>
                          Arquivar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'studio' && (
          <div style={{ display: 'flex', height: '100vh' }}>
            {/* Studio chat — LEFT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                {studioMessages.map((msg, i) => (
                  <div key={i} className={`message-bubble ${msg.role}`} style={{ maxWidth: 800, margin: '0 auto 16px' }}>
                    <div className={`message-avatar ${msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
                      {msg.role === 'user'
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      }
                    </div>
                    <div className="message-content">
                      {msg.media && (
                        <div className="message-media">
                          {msg.media.type === 'image'
                            ? <img src={msg.media.url} alt={msg.media.prompt || 'Generated'} />
                            : <video src={msg.media.url} controls loop muted playsInline />
                          }
                          {msg.media.prompt && <span className="media-prompt">Prompt: {msg.media.prompt}</span>}
                        </div>
                      )}
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                ))}
                {studioLoading && (
                  <div className="message-bubble assistant">
                    <div className="message-avatar assistant-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                    <div className="message-content"><div className="typing-indicator"><span/><span/><span/></div></div>
                  </div>
                )}
                <div ref={studioMessagesEndRef} />
              </div>

              {/* Studio input */}
              <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--surface-border)', background: 'var(--bg)', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <form onSubmit={handleStudioSend} style={{ flex: 1, position: 'relative' }}>
                    <input
                      id="studio-input-el"
                      value={studioInput}
                      onChange={handleStudioInputChange}
                      onKeyDown={handleStudioInputKeyDown}
                      placeholder="Descreva o conteudo que quer criar..."
                      style={{
                        width: '100%', padding: '12px 16px', paddingRight: 44,
                        border: '1px solid var(--surface-border)', borderRadius: 10,
                        background: 'var(--surface)', color: 'var(--text)', fontSize: 14,
                        fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                    <button type="submit" disabled={studioLoading || !studioInput.trim()} style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: studioInput.trim() ? 'var(--accent)' : 'var(--surface)',
                      color: 'white', cursor: studioInput.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>

                    {/* Studio suggestions */}
                    {studioShowSuggestions && studioSuggestions.length > 0 && (
                      <div className="mention-popup">
                        {studioSuggestions.map((name, i) => (
                          <button key={name} className={`mention-item ${i === studioActiveSuggestionIdx ? 'active' : ''}`} onClick={() => insertStudioSuggestion(name)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Assets panel — RIGHT */}
            <div style={{
              width: 300, borderLeft: '1px solid var(--surface-border)',
              background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column',
              flexShrink: 0,
            }}>
              <div style={{ padding: '16px 16px 0' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Assets</h3>
              </div>

              {/* Drop zone */}
              <div style={{ padding: '0 16px 12px' }}>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleDropFile(e.dataTransfer.files); }}
                  onClick={() => studioFileInputRef.current?.click()}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '24px 16px', border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--surface-border)'}`,
                    borderRadius: 10, cursor: 'pointer',
                    color: isDragOver ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 13, transition: 'all 0.15s',
                    background: isDragOver ? 'var(--accent-bg)' : 'transparent',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {isDragOver ? (
                    <span style={{ fontWeight: 500 }}>Largar aqui</span>
                  ) : (
                    <>
                      <span>Clique para upload</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ou arraste ficheiros aqui</span>
                    </>
                  )}
                  <input ref={studioFileInputRef} type="file" accept="image/*" onChange={handleStudioUpload} style={{ display: 'none' }} />
                </div>
              </div>

              {duplicateAlert && (
                <div style={{ padding: '0 16px', marginBottom: 8 }}>
                  <div className="onboarding-error" style={{ fontSize: 12 }}>{duplicateAlert}</div>
                </div>
              )}

              {/* Gallery label */}
              <div style={{ padding: '0 16px', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Galeria ({studioUploads.length})
                </span>
              </div>

              {/* Gallery grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
                {uploadsLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <div className="loader" />
                  </div>
                )}
                {!uploadsLoading && studioUploads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                    Nenhum asset ainda
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {studioUploads.map(asset => (
                    <div key={asset.filename} style={{
                      position: 'relative', borderRadius: 8, overflow: 'hidden',
                      border: '1px solid var(--surface-border)',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--surface-border)' }}
                    >
                      <img
                        src={asset.url} alt={asset.name}
                        style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, filename: asset.filename }); }}
                      />
                      <p style={{
                        fontSize: 11, padding: '4px 6px', color: 'var(--text)', fontWeight: 500,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{asset.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right-click context menu */}
            {contextMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setContextMenu(null)} />
                <div style={{
                  position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                  background: 'var(--surface)', border: '1px solid var(--surface-border)',
                  borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 999,
                  minWidth: 160, padding: 4, overflow: 'hidden',
                }}>
                  <button onClick={() => { deleteAsset(contextMenu.filename); setContextMenu(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
                      fontSize: 13, background: 'none', border: 'none', color: 'var(--danger)',
                      cursor: 'pointer', borderRadius: 6, transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'automations' && (
          <div style={{ padding: '32px 40px' }}>
            <div className="topbar">
              <div>
                <h1 className="page-title">Automacoes</h1>
                <p className="greeting">Cron jobs e tarefas agendadas do Hermes</p>
              </div>
              <div className="topbar-actions">
                <button className="refresh-btn" onClick={() => {
                  setShowCreateModal(true)
                }}>{Icons.plus} Nova Automacao</button>
              </div>
            </div>

            {automationsLoading ? (
              <div className="loading-screen"><div className="loader" /></div>
            ) : automations.length === 0 ? (
              <div className="section" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Nenhuma automacao configurada.</p>
                <button className="refresh-btn" onClick={() => setShowCreateModal(true)}>
                  {Icons.plus} Criar primeira automacao
                </button>
              </div>
            ) : (
              <div className="section">
                <table className="table">
                  <thead><tr><th>Nome</th><th>Agenda</th><th>Status</th><th>Ultima Execucao</th><th>Proxima Execucao</th><th>Acoes</th></tr></thead>
                  <tbody>
                    {automations.map((a, i) => (
                      <>
                        <tr key={a.id || i}>
                          <td>
                            <span className="order-name" style={{ cursor: 'pointer' }}
                              onClick={() => setExpandedJobId(expandedJobId === a.id ? null : a.id)}>
                              {a.name || a.id || '-'}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.schedule || '-'}</td>
                          <td><span className={`status-tag ${a.status === 'active' || a.status === 'running' ? 'active' : 'paused'}`}>{a.status || '-'}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {a.last_run || '-'}
                            {a.last_status && (
                              <span style={{ color: a.last_status === 'ok' ? 'var(--success)' : 'var(--danger)', marginLeft: 4 }}>
                                ({a.last_status})
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.next_run || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {a.status === 'active' || a.status === 'running' ? (
                                <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px' }}
                                  onClick={() => pauseAutomation(a.id || a.job_id)}>Pausar</button>
                              ) : (
                                <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px' }}
                                  onClick={() => resumeAutomation(a.id || a.job_id)}>Ativar</button>
                              )}
                              <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px' }}
                                onClick={() => runAutomationNow(a.id || a.job_id)}
                                disabled={actionLoading === (a.id || a.job_id)}>
                                {actionLoading === (a.id || a.job_id) ? '...' : 'Executar'}
                              </button>
                              <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--danger)' }}
                                onClick={() => deleteAutomation(a.id || a.job_id)}
                                disabled={actionLoading === (a.id || a.job_id)}>
                                {actionLoading === (a.id || a.job_id) ? '...' : 'Apagar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedJobId === a.id && (
                          <tr key={`${a.id}-detail`}>
                            <td colSpan={6} style={{ padding: '12px 16px', background: 'var(--surface)' }}>
                              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                {a.prompt && <div><strong>Prompt:</strong> {a.prompt}</div>}
                                {a.skills && <div><strong>Skills:</strong> {a.skills}</div>}
                                {a.deliver && <div><strong>Deliver:</strong> {a.deliver}</div>}
                                {a.last_run && <div><strong>Ultima execucao:</strong> {a.last_run} {a.last_status ? `(${a.last_status})` : ''}</div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Create Modal ── */}
            {showCreateModal && (
              <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ marginBottom: 20 }}>Nova Automacao</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label className="field"><span>Nome</span>
                      <input value={newAutoName} onChange={e => setNewAutoName(e.target.value)} placeholder="Ex: Relatorio diario" />
                    </label>
                    <label className="field"><span>Agenda (cron)</span>
                      <input value={newAutoSchedule} onChange={e => setNewAutoSchedule(e.target.value)} placeholder="Ex: 0 9 * * 1-5" />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>formato cron: minuto hora dia mes dia-semana</span>
                    </label>
                    <label className="field"><span>Prompt</span>
                      <textarea value={newAutoPrompt} onChange={e => setNewAutoPrompt(e.target.value)}
                        placeholder="O que o agente deve fazer..."
                        rows={3}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                      />
                    </label>
                    <label className="field"><span>Skills (opcional)</span>
                      <input value={newAutoSkills} onChange={e => setNewAutoSkills(e.target.value)} placeholder="Ex: shopify, email" />
                    </label>
                    <label className="field"><span>Entrega</span>
                      <select value={newAutoDeliver} onChange={e => setNewAutoDeliver(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                        <option value="local">Local (apenas log)</option>
                        <option value="origin">Origin (chat atual)</option>
                        <option value="telegram">Telegram</option>
                      </select>
                    </label>
                  </div>
                  <div className="modal-actions" style={{ marginTop: 20 }}>
                    <button className="modal-btn cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                    <button className="modal-btn primary" onClick={createAutomation}
                      disabled={creating || !newAutoName.trim() || !newAutoSchedule.trim() || !newAutoPrompt.trim()}>
                      {creating ? 'A criar...' : 'Criar Automacao'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memory' && (
          <div style={{ padding: '32px 40px' }}>
            <div className="topbar">
              <div>
                <h1 className="page-title">Memoria</h1>
                <p className="greeting">Fatos e preferencias que o agente lembra entre conversas</p>
              </div>
            </div>
            <div className="section" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Adicionar Memoria</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={newMemory}
                  onChange={e => setNewMemory(e.target.value)}
                  placeholder="Ex: A loja foca em produtos sustentaveis..."
                  style={{
                    flex: 1, padding: '10px 14px', border: '1px solid var(--surface-border)',
                    borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button className="onboarding-btn" style={{ padding: '8px 20px', fontSize: 13 }} onClick={addMemory} disabled={!newMemory.trim()}>Adicionar</button>
              </div>
            </div>
            <div className="section">
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Memorias Existentes</h2>
              {memoryLoading ? (
                <div className="loading-screen"><div className="loader" /></div>
              ) : memoryEntries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma memoria guardada ainda.</p>
              ) : (
                memoryEntries.map((entry, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text)' }}>{entry.content || entry.text || JSON.stringify(entry)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div style={{ padding: '32px 40px' }}>
            <div className="topbar" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="page-title">Links</h1>
                <p className="greeting">Atalhos rápidos para as tuas ferramentas</p>
              </div>
              <button className="quick-btn" onClick={() => setShowAddLink(!showAddLink)} style={{ fontSize: 13, padding: '8px 16px' }}>
                {Icons.plus} {showAddLink ? 'Fechar' : 'Adicionar Link'}
              </button>
            </div>

            {/* Add link form */}
            {showAddLink && (
              <div className="section" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    value={newLinkName}
                    onChange={e => setNewLinkName(e.target.value)}
                    placeholder="Nome (ex: Canva)"
                    style={{
                      flex: '1 1 200px', padding: '10px 14px',
                      border: '1px solid var(--surface-border)', borderRadius: 8,
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <input
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    placeholder="URL (ex: https://canva.com)"
                    style={{
                      flex: '2 1 300px', padding: '10px 14px',
                      border: '1px solid var(--surface-border)', borderRadius: 8,
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button className="onboarding-btn" style={{ padding: '8px 20px', fontSize: 13 }}
                    onClick={addLink} disabled={!newLinkName.trim() || !newLinkUrl.trim()}>
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Shopify URL config */}
            {links.some(l => l.id === 'shopify') && (
              <div className="section" style={{ marginBottom: 24, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Shopify Store URL</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={shopifyUrl}
                    onChange={e => setShopifyUrl(e.target.value)}
                    placeholder="https://tualoja.myshopify.com/admin"
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: '1px solid var(--surface-border)', borderRadius: 8,
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Link cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {displayLinks.map((link, idx) => (
                <a
                  key={link.id}
                  href={link.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { if (!link.url) e.preventDefault() }}
                  style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    padding: 0, borderRadius: 16, overflow: 'hidden',
                    textDecoration: 'none', cursor: link.url ? 'pointer' : 'default',
                    minHeight: 180, position: 'relative',
                    border: link.url ? 'none' : '2px dashed var(--surface-border)',
                    background: link.url ? getGradient(link.id, idx) : 'transparent',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  {/* Card content */}
                  <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700,
                      background: link.url ? 'rgba(255,255,255,0.2)' : 'var(--surface)',
                      color: link.url ? '#fff' : 'var(--text-muted)',
                    }}>
                      {LINK_ICONS[link.id] || link.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: link.url ? '#fff' : 'var(--text-muted)', lineHeight: 1.3 }}>
                      {link.name}
                    </div>
                    <div style={{
                      fontSize: 12, color: link.url ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {link.url || 'Sem URL configurado'}
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div style={{
                    padding: '12px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: link.url ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--surface-border)',
                    marginTop: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: link.url ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
                      {link.url ? 'Abrir →' : 'Configurar'}
                    </span>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); deleteLink(link.id) }}
                      style={{
                        background: link.url ? 'rgba(255,255,255,0.15)' : 'var(--danger-bg)',
                        border: 'none', borderRadius: 8, padding: '4px 10px',
                        color: link.url ? 'rgba(255,255,255,0.8)' : 'var(--danger)',
                        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {link.id === 'shopify' && !shopifyUrl ? 'Limpar' : 'Remover'}
                    </button>
                  </div>
                </a>
              ))}

              {/* Add card */}
              {!showAddLink && (
                <div
                  onClick={() => setShowAddLink(true)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: 180, borderRadius: 16, padding: 24,
                    border: '2px dashed var(--surface-border)',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--surface-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 20 }}>
                    +
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Adicionar Link</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
