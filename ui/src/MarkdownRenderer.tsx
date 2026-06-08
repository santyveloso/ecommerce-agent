import React from 'react'
import InlineRenderer from './InlineRenderer'
import TableRenderer from './TableRenderer'

/* ── MarkdownRenderer ──────────────────────────── */
export default function MarkdownRenderer({ content }: { content: string }) {
  const blocks: { type: 'code' | 'markdown'; content: string; lang?: string }[] = []
  let remaining = content
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'markdown', content: remaining.slice(lastIndex, match.index) })
    }
    blocks.push({ type: 'code', content: match[2], lang: match[1] || 'text' })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < remaining.length) {
    blocks.push({ type: 'markdown', content: remaining.slice(lastIndex) })
  }

  return (
    <div className="markdown-body">
      {blocks.map((block, bi) => {
        if (block.type === 'code') {
          return (
            <pre key={bi} style={{
              background: 'var(--bg)',
              borderRadius: '8px', padding: '14px 16px',
              fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.5, overflow: 'auto',
              border: '1px solid var(--surface-border)',
              margin: '8px 0', color: 'var(--text)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {block.lang && (
                <span style={{
                  display: 'block', fontSize: '10px',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  marginBottom: '8px', fontWeight: 600
                }}>{block.lang}</span>
              )}
              <code>{block.content}</code>
            </pre>
          )
        }
        return <MarkdownBlock key={`md-${bi}`} text={block.content} />
      })}
    </div>
  )
}

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableRows: React.ReactNode[] = []
  let tableHeaders: string[] = []
  let tableAlignments: string[] = []

  function flushTable(key: string) {
    if (tableRows.length > 0) {
      elements.push(
        <TableRenderer key={key} headers={tableHeaders} alignments={tableAlignments} rows={tableRows} />
      )
    }
    tableHeaders = []
    tableAlignments = []
    tableRows = []
    inTable = false
  }

  for (let li = 0; li < lines.length; li++) {
    const rawLine = lines[li]
    const line = rawLine.trim()

    // Table
    if (line.startsWith('|') && line.includes('|', line.lastIndexOf('|') - 1)) {
      const cols = line.split('|').filter(c => c.trim() !== '').map(c => c.trim())
      if (cols.every(c => /^:?-+:?$/.test(c.replace(/-/g, '').replace(/:/g, '')))) {
        tableAlignments = cols.map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center'
          if (c.endsWith(':')) return 'right'
          return 'left'
        })
        continue
      }
      if (!inTable) {
        inTable = true
        tableHeaders = cols
      } else {
        tableRows.push(
          <tr key={`tr-${li}`} style={{ borderBottom: '1px solid var(--surface-border)' }}>
            {cols.map((c, ci) => (
              <td key={ci} style={{
                padding: '8px 12px',
                textAlign: (tableAlignments[ci] || 'left') as any,
                color: 'var(--text-secondary)'
              }}><InlineRenderer text={c} /></td>
            ))}
          </tr>
        )
      }
      continue
    } else if (inTable) {
      flushTable(`table-${li}`)
    }

    // Heading
    const hMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (hMatch) {
      const level = hMatch[1].length
      const hSize = level === 1 ? '22px' : level === 2 ? '17px' : '15px'
      elements.push(
        <h2 key={`h-${li}`} style={{
          fontSize: hSize, fontWeight: 700, color: 'var(--text)',
          margin: '16px 0 8px 0',
          paddingBottom: level <= 2 ? '6px' : '0',
          borderBottom: level <= 2 ? '1px solid var(--surface-border)' : 'none'
        }}><InlineRenderer text={hMatch[2]} /></h2>
      )
      continue
    }

    // Horizontal rule
    if (/^\s*(\*\s*){3,}$/.test(line) || /^\s*(-\s*){3,}$/.test(line)) {
      elements.push(<hr key={`hr-${li}`} style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '16px 0' }} />)
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const qText = line.replace(/^>\s*/, '')
      elements.push(
        <blockquote key={`q-${li}`} style={{
          borderLeft: '3px solid var(--accent)', padding: '8px 14px', margin: '8px 0',
          background: 'var(--bg-sidebar)', borderRadius: '0 6px 6px 0',
          color: 'var(--text-secondary)', fontStyle: 'italic'
        }}><InlineRenderer text={qText} /></blockquote>
      )
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/)
    if (ulMatch) {
      const cbMatch = ulMatch[1].match(/^\[([ x])\]\s*(.*)/)
      if (cbMatch) {
        const checked = cbMatch[1] === 'x'
        elements.push(
          <div key={`li-${li}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '2px 0', color: 'var(--text)', fontSize: '13.5px' }}>
            <span style={{
              display: 'inline-flex', width: '16px', height: '16px', borderRadius: '3px',
              border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--surface-border)'}`,
              background: checked ? 'var(--accent)' : 'transparent',
              flexShrink: 0, marginTop: '3px',
              alignItems: 'center', justifyContent: 'center'
            }}>
              {checked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
            <span style={{
              color: checked ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: checked ? 'line-through' : 'none'
            }}><InlineRenderer text={cbMatch[2]} /></span>
          </div>
        )
      } else {
        elements.push(
          <div key={`li-${li}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '2px 0', color: 'var(--text)', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '4px', fontSize: '10px' }}>•</span>
            <span><InlineRenderer text={ulMatch[1]} /></span>
          </div>
        )
      }
      continue
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      elements.push(
        <div key={`li-${li}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '2px 0', color: 'var(--text)', fontSize: '13.5px' }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: '20px', fontSize: '12px', fontWeight: 500 }}>{olMatch[1]}.</span>
          <span><InlineRenderer text={olMatch[2]} /></span>
        </div>
      )
      continue
    }

    // Empty line
    if (line === '') {
      elements.push(<div key={`sp-${li}`} style={{ height: '8px' }} />)
      continue
    }

    // Paragraph
    elements.push(
      <p key={`p-${li}`} style={{ margin: '4px 0', color: 'var(--text)', fontSize: '13.5px', lineHeight: 1.6 }}>
        <InlineRenderer text={rawLine} />
      </p>
    )
  }

  if (inTable) flushTable('table-end')
  return <>{elements}</>
}
