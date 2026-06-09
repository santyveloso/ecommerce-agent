import { useState, useEffect, useRef } from 'react'
import { Icons } from './Icons'
import type { MomMessage } from './useMomState'

interface MomPanelProps {
  messages: MomMessage[]
  loading: boolean
  sending: boolean
  onSendMessage: (text: string) => Promise<boolean>
}

function fmtTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'Z')
  const now = new Date()
  const pad = (n: number) => n < 10 ? '0' + n : String(n)
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes())
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay) return time
  if (d.toDateString() === yesterday.toDateString()) return `ontem \u00e0s ${time}`
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`
}

export default function MomPanel({ messages, loading, sending, onSendMessage }: MomPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const ok = await onSendMessage(text)
    if (!ok) setInput(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f5d76e, #f39c12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            💛
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>MÃE</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Chat em tempo real</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loader" /></div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--surface-border)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--surface)',
          marginTop: 16,
          minHeight: 0,
        }}>
          {/* Messages */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 18,
              }}>
                Ainda não há mensagens 💬
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{
                  maxWidth: '78%',
                  padding: '12px 16px',
                  borderRadius: m.from === 'mom' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  alignSelf: m.from === 'mom' ? 'flex-start' : 'flex-end',
                  background: m.from === 'mom' ? 'var(--card)' : '#2563eb',
                  color: m.from === 'mom' ? 'var(--text)' : '#fff',
                  border: m.from === 'mom' ? '1px solid var(--surface-border)' : 'none',
                  wordBreak: 'break-word',
                  fontSize: 18,
                  lineHeight: 1.45,
                }}>
                  {m.from === 'mom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>💛</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#b8860b' }}>Mãe</span>
                    </div>
                  )}
                  <div>{m.text}</div>
                  <div style={{
                    fontSize: 12,
                    opacity: m.from === 'mom' ? 0.6 : 0.5,
                    marginTop: 4,
                  }}>
                    {m.from === 'santy' ? 'Tu' : ''} {fmtTime(m.created_at)}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            gap: 10,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreve uma mensagem..."
              maxLength={500}
              disabled={sending}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--surface-border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: 18,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{
                padding: '14px 24px',
                border: 'none',
                borderRadius: 14,
                background: sending ? '#ccc' : 'linear-gradient(135deg, #f5d76e, #f39c12)',
                color: '#fff',
                fontSize: 18,
                fontWeight: 600,
                cursor: sending ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {Icons.send || 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
