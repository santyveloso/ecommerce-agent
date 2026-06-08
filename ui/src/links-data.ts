/* ── Links Data & Helpers ────────────────────── */

export const DEFAULT_LINKS = [
  { id: 'bp-academy', name: 'Blueprint Academy', url: 'https://www.blueprint-academy.com/dashboard' },
  { id: 'sp-lite', name: 'SP Lite', url: 'https://app.sp-lite.com/' },
  { id: 'ads-manager', name: 'Ads Manager', url: 'https://adsmanager.facebook.com/' },
  { id: 'ads-library', name: 'Ads Library', url: 'https://www.facebook.com/ads/library/' },
  { id: 'google-analytics', name: 'Google Analytics', url: 'https://analytics.google.com/' },
  { id: 'shopify', name: 'Shopify Loja', url: '' },
]

export const LINK_GRADIENTS: Record<string, string> = {
  'bp-academy': 'linear-gradient(135deg, #1e3a5f, #8b0000)',
  'sp-lite': 'linear-gradient(135deg, #059669, #34d399)',
  'ads-manager': 'linear-gradient(135deg, #1877F2, #1c4e80)',
  'ads-library': 'linear-gradient(135deg, #06b6d4, #0284c7)',
  'google-analytics': 'linear-gradient(135deg, #f59e0b, #dc2626)',
  'shopify': 'linear-gradient(135deg, #7c3aed, #2563eb)',
}

export const LINK_ICONS: Record<string, string> = {
  'bp-academy': 'BP',
  'sp-lite': 'SP',
  'ads-manager': 'M',
  'ads-library': 'AL',
  'google-analytics': 'GA',
  'shopify': 'SH',
}

export const LINK_ICON_COLORS: Record<string, string> = {
  'bp-academy': '#6b21a8',
  'sp-lite': '#047857',
  'ads-manager': '#1d4ed8',
  'ads-library': '#0284c7',
  'google-analytics': '#b45309',
  'shopify': '#5b21b6',
}

export const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export const FOLDER_COLORS = [
  { name: 'Blue', value: 'var(--accent)' },
  { name: 'Purple', value: 'var(--chart-purple)' },
  { name: 'Green', value: 'var(--success)' },
  { name: 'Orange', value: 'var(--warning)' },
  { name: 'Red', value: 'var(--danger)' },
  { name: 'Cyan', value: 'var(--chart-cyan)' },
]

export function getIconColor(id: string): string {
  return LINK_ICON_COLORS[id] || 'var(--accent)'
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

export function getGradient(id: string, idx: number): string {
  if (LINK_GRADIENTS[id]) return LINK_GRADIENTS[id]
  const palettes = [
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #6366f1)',
    'linear-gradient(135deg, #f43f5e, #e11d48)',
    'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  ]
  return palettes[idx % palettes.length]
}
