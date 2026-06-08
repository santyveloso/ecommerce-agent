import { Icons } from './Icons'

interface AutomationsPanelProps {
  automations: any[]
  automationsLoading: boolean
  showCreateModal: boolean
  onShowCreateModal: (show: boolean) => void
  newAutoName: string
  onNewAutoNameChange: (val: string) => void
  newAutoSchedule: string
  onNewAutoScheduleChange: (val: string) => void
  newAutoPrompt: string
  onNewAutoPromptChange: (val: string) => void
  newAutoSkills: string
  onNewAutoSkillsChange: (val: string) => void
  newAutoDeliver: string
  onNewAutoDeliverChange: (val: string) => void
  creating: boolean
  onCreateAutomation: () => Promise<void>
  onPauseAutomation: (id: string) => Promise<void>
  onResumeAutomation: (id: string) => Promise<void>
  onRunAutomationNow: (id: string) => Promise<void>
  onDeleteAutomation: (id: string) => Promise<void>
  actionLoading: string | null
  expandedJobId: string | null
  onSetExpandedJobId: (id: string | null) => void
}

export default function AutomationsPanel({
  automations,
  automationsLoading,
  showCreateModal,
  onShowCreateModal,
  newAutoName,
  onNewAutoNameChange,
  newAutoSchedule,
  onNewAutoScheduleChange,
  newAutoPrompt,
  onNewAutoPromptChange,
  newAutoSkills,
  onNewAutoSkillsChange,
  newAutoDeliver,
  onNewAutoDeliverChange,
  creating,
  onCreateAutomation,
  onPauseAutomation,
  onResumeAutomation,
  onRunAutomationNow,
  onDeleteAutomation,
  actionLoading,
  expandedJobId,
  onSetExpandedJobId,
}: AutomationsPanelProps) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Routines</h1>
          <p className="greeting">Cron jobs e tarefas agendadas do Hermes</p>
        </div>
        <div className="topbar-actions">
          <button className="refresh-btn" onClick={() => onShowCreateModal(true)}>
            {Icons.plus} Nova Automacao
          </button>
        </div>
      </div>

      {automationsLoading ? (
        <div className="loading-screen"><div className="loader" /></div>
      ) : automations.length === 0 ? (
        <div className="section" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Nenhuma automacao configurada.</p>
          <button className="refresh-btn" onClick={() => onShowCreateModal(true)}>
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
                        onClick={() => onSetExpandedJobId(expandedJobId === a.id ? null : a.id)}>
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
                            onClick={() => onPauseAutomation(a.id || a.job_id)}>Pausar</button>
                        ) : (
                          <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => onResumeAutomation(a.id || a.job_id)}>Ativar</button>
                        )}
                        <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => onRunAutomationNow(a.id || a.job_id)}
                          disabled={actionLoading === (a.id || a.job_id)}>
                          {actionLoading === (a.id || a.job_id) ? '...' : 'Executar'}
                        </button>
                        <button className="quick-btn" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--danger)' }}
                          onClick={() => onDeleteAutomation(a.id || a.job_id)}
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
        <div className="modal-overlay" onClick={() => onShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Nova Automacao</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="field"><span>Nome</span>
                <input value={newAutoName} onChange={e => onNewAutoNameChange(e.target.value)} placeholder="Ex: Relatorio diario" />
              </label>
              <label className="field"><span>Agenda (cron)</span>
                <input value={newAutoSchedule} onChange={e => onNewAutoScheduleChange(e.target.value)} placeholder="Ex: 0 9 * * 1-5" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>formato cron: minuto hora dia mes dia-semana</span>
              </label>
              <label className="field"><span>Prompt</span>
                <textarea value={newAutoPrompt} onChange={e => onNewAutoPromptChange(e.target.value)}
                  placeholder="O que o agente deve fazer..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                />
              </label>
              <label className="field"><span>Skills (opcional)</span>
                <input value={newAutoSkills} onChange={e => onNewAutoSkillsChange(e.target.value)} placeholder="Ex: shopify, email" />
              </label>
              <label className="field"><span>Entrega</span>
                <select value={newAutoDeliver} onChange={e => onNewAutoDeliverChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  <option value="local">Local (apenas log)</option>
                  <option value="origin">Origin (chat atual)</option>
                  <option value="telegram">Telegram</option>
                </select>
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="modal-btn cancel" onClick={() => onShowCreateModal(false)}>Cancelar</button>
              <button className="modal-btn primary" onClick={onCreateAutomation}
                disabled={creating || !newAutoName.trim() || !newAutoSchedule.trim() || !newAutoPrompt.trim()}>
                {creating ? 'A criar...' : 'Criar Automacao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
