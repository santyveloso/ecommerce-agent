import React from 'react'
import { parseCodeBlocks } from './markdown-parser'
import MarkdownBlock from './MarkdownBlock'

/* ── MarkdownRenderer ──────────────────────────── */
export default function MarkdownRenderer({ content }: { content: string }) {
  const blocks = parseCodeBlocks(content)

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
