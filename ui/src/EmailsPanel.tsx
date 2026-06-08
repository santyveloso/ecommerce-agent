import { Icons } from './Icons'
import { formatDate } from './helpers'

interface EmailsPanelProps {
  emails: any[]
  emailsLoading: boolean
  selectedEmail: any | null
  emailThread: any[] | null
  emailThreadLoading: boolean
  actionLoading: string | null
  onRefreshEmails: () => Promise<void>
  onViewEmail: (id: string) => Promise<void>
  onBackToList: () => void
  onIgnoreEmail: (id: string) => Promise<void>
  onArchiveEmail: (id: string) => Promise<void>
}

export default function EmailsPanel({
  emails,
  emailsLoading,
  selectedEmail,
  emailThread,
  emailThreadLoading,
  actionLoading,
  onRefreshEmails,
  onViewEmail,
  onBackToList,
  onIgnoreEmail,
  onArchiveEmail,
}: EmailsPanelProps) {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="topbar" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Emails</h1>
          <p className="greeting">{emails.length} email{emails.length !== 1 ? 's' : ''} por ler de clientes</p>
        </div>
        <button className="refresh-btn" onClick={onRefreshEmails}>
          {Icons.refresh} Atualizar
        </button>
      </div>

      {/* Thread View */}
      {(emailThread || emailThreadLoading) && (
        <div className="section" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="quick-btn" onClick={onBackToList}>
              {Icons.refresh} Voltar
            </button>
          </div>

          {emailThreadLoading && !emailThread ? (
            <div className="loading-screen"><div className="loader" /></div>
          ) : emailThread ? (
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
              {emailThread.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="quick-btn" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'transparent' }}
                    onClick={() => onIgnoreEmail(emailThread[0].id)} disabled={actionLoading === emailThread[0].id}>
                    {actionLoading === emailThread[0].id ? '...' : 'Ignorar'}
                  </button>
                  <button className="quick-btn" onClick={() => onArchiveEmail(emailThread[0].id)} disabled={actionLoading === emailThread[0].id}>
                    {actionLoading === emailThread[0].id ? '...' : 'Arquivar'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Email List */}
      {!emailThread && !emailThreadLoading && (
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
                onClick={() => onViewEmail(em.id)}
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
                    onClick={() => onIgnoreEmail(em.id)} disabled={actionLoading === em.id}>
                    Ignorar
                  </button>
                  <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-secondary)' }}
                    onClick={() => onArchiveEmail(em.id)} disabled={actionLoading === em.id}>
                    Arquivar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
