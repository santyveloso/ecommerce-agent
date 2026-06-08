import React from 'react'
import InlineRenderer from './InlineRenderer'

interface TableRendererProps {
  headers: string[]
  alignments: string[]
  rows: React.ReactNode[]
}

export default function TableRenderer({ headers, alignments, rows }: TableRendererProps) {
  return (
    <div style={{
      overflowX: 'auto', margin: '8px 0',
      borderRadius: '8px', border: '1px solid var(--surface-border)',
      background: 'var(--surface)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: 'none' }}>
        {headers.length > 0 && (
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '8px 12px',
                  textAlign: (alignments[i] || 'left') as any,
                  fontWeight: 600, color: 'var(--text)',
                  background: 'var(--bg-sidebar)',
                  borderBottom: '1px solid var(--surface-border)'
                }}><InlineRenderer text={h} /></th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{rows}</tbody>
      </table>
    </div>
  )
}
