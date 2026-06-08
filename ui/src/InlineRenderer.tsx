import React from 'react'

export default function InlineRenderer({ text }: { text: string }) {
  const parts = text.split(/(!?\[([^\]]*)\]\(([^)]+)\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g)
  const rendered = parts.map((part, i) => {
    if (!part) return null
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) return <img key={i} src={imgMatch[2]} alt={imgMatch[1] || ''} style={{ maxWidth: '100%', borderRadius: '8px', margin: '4px 0' }} />
    const linkMatch = part.match(/^\[([^\]]*)\]\(([^)]+)\)$/)
    if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--electric)', textDecoration: 'none', borderBottom: '1px solid var(--electric-bg)' }}>{linkMatch[1]}</a>
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1)
      return <code key={i} style={{ background: 'var(--bg-sidebar)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', color: 'var(--electric)' }}>{code}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ fontWeight: 700, color: 'var(--text)' }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{part.slice(1, -1)}</em>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={i} style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{part.slice(2, -2)}</del>
    return part
  })
  return <>{rendered}</>
}
