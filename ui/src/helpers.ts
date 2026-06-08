/* ── Pure Helpers ────────────────────────────── */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return d.toLocaleDateString('pt-PT', { weekday: 'short' })
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

/* ── Studio demo placeholder generator ─────── */
export function demoPlaceholderFn(prompt: string, seed: number = 1): string {
  const colors = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc'], ['#f5576c', '#ff6f91'],
    ['#30cfd0', '#330867'],
  ]
  const [c1, c2] = colors[seed % colors.length]
  const shortPrompt = prompt.length > 60 ? prompt.slice(0, 57) + '...' : prompt
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="g${seed}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#g${seed})" rx="12"/>
    <circle cx="200" cy="160" r="50" fill="rgba(255,255,255,0.15)"/>
    <polygon points="200,100 250,180 150,180" fill="rgba(255,255,255,0.1)" transform="translate(0,20)"/>
    <circle cx="120" cy="280" r="30" fill="rgba(255,255,255,0.08)"/>
    <circle cx="280" cy="280" r="40" fill="rgba(255,255,255,0.06)"/>
    <rect x="60" y="320" width="280" height="40" rx="8" fill="rgba(0,0,0,0.2)"/>
    <text x="200" y="346" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Inter,sans-serif" font-size="14" font-weight="500">${shortPrompt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
  </svg>`
}
