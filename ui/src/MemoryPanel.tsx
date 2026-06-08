import MarkdownRenderer from './MarkdownRenderer'

interface MemoryPanelProps {
  memoryEntries: any[]
  memoryLoading: boolean
  newMemory: string
  onNewMemoryChange: (val: string) => void
  onAddMemory: () => Promise<void>
  selectedMemoryFile: any | null
  onLoadMemoryFile: (file: any) => Promise<void>
  memoryFileLoading: boolean
  memoryFileContent: string
  memoryEditMode: boolean
  onSetMemoryEditMode: (mode: boolean) => void
  memoryEditContent: string
  onMemoryEditContentChange: (val: string) => void
  memorySaving: boolean
  onSaveMemoryFile: () => Promise<void>
}

export default function MemoryPanel({
  memoryEntries,
  memoryLoading,
  newMemory,
  onNewMemoryChange,
  onAddMemory,
  selectedMemoryFile,
  onLoadMemoryFile,
  memoryFileLoading,
  memoryFileContent,
  memoryEditMode,
  onSetMemoryEditMode,
  memoryEditContent,
  onMemoryEditContentChange,
  memorySaving,
  onSaveMemoryFile,
}: MemoryPanelProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', padding: 0 }}>
      {/* ── File List Sidebar ── */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: '1px solid var(--surface-border)',
        background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--surface-border)' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Memory</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{memoryEntries.length} ficheiro{memoryEntries.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Quick add */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newMemory}
              onChange={e => onNewMemoryChange(e.target.value)}
              placeholder="Adicionar nota rapida..."
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid var(--surface-border)',
                borderRadius: 8, background: 'var(--surface)', color: 'var(--text)',
                fontSize: 12, fontFamily: 'inherit', outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter') onAddMemory() }}
            />
            <button onClick={onAddMemory} disabled={!newMemory.trim()}
              style={{
                padding: '8px 12px', borderRadius: 8, border: 'none',
                background: newMemory.trim() ? 'var(--accent)' : 'var(--surface)',
                color: newMemory.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: newMemory.trim() ? 'pointer' : 'default',
              }}>
              + Add
            </button>
          </div>
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {memoryLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="loader" /></div>
          ) : memoryEntries.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhum ficheiro de memoria.
            </div>
          ) : (
            (() => {
              const groups: Record<string, any[]> = { long_term: [], daily: [], reference: [] }
              memoryEntries.forEach((f: any) => {
                const t = f.type || 'daily'
                if (groups[t]) groups[t].push(f)
                else groups.daily.push(f)
              })
              const labels: Record<string, string> = {
                long_term: 'Longo Prazo',
                daily: 'Diarios',
                reference: 'Referencia',
              }
              const colors: Record<string, string> = {
                long_term: 'var(--accent)',
                daily: 'var(--success)',
                reference: 'var(--warning)',
              }
              return Object.entries(groups).map(([type, files]) => {
                if (files.length === 0) return null
                return (
                  <div key={type}>
                    <div style={{
                      padding: '8px 20px 4px', fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                    }}>
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: colors[type] || 'var(--text-muted)', marginRight: 6,
                        verticalAlign: 'middle',
                      }} />
                      {labels[type] || type}
                    </div>
                    {files.map((file: any, fi: number) => (
                      <div key={file.name || fi} onClick={() => onLoadMemoryFile(file)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 20px', cursor: 'pointer', margin: '0 8px',
                          borderRadius: 8,
                          background: selectedMemoryFile?.name === file.name ? 'var(--surface)' : 'transparent',
                          color: selectedMemoryFile?.name === file.name ? 'var(--text)' : 'var(--text-secondary)',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={e => { if (selectedMemoryFile?.name !== file.name) e.currentTarget.style.background = 'var(--surface-hover)' }}
                        onMouseLeave={e => { if (selectedMemoryFile?.name !== file.name) e.currentTarget.style.background = 'transparent' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: selectedMemoryFile?.name === file.name ? 'var(--accent-bg)' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          color: selectedMemoryFile?.name === file.name ? 'var(--accent)' : 'var(--text-muted)',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '-'}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {file.modified ? new Date(file.modified).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
            })()
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selectedMemoryFile ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>Seleciona um ficheiro</p>
              <p style={{ fontSize: 12 }}>Escolhe um ficheiro de memoria para ver ou editar</p>
            </div>
          </div>
        ) : memoryFileLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader" />
          </div>
        ) : (
          <>
            {/* Content header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--surface-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg)',
            }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>{selectedMemoryFile.name}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {selectedMemoryFile.type === 'long_term' ? 'Memoria de longo prazo' : selectedMemoryFile.type === 'daily' ? 'Nota diaria' : 'Referencia'}
                  {' · '}{selectedMemoryFile.modified ? new Date(selectedMemoryFile.modified).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {memoryEditMode ? (
                  <>
                    <button onClick={() => { onSetMemoryEditMode(false); onMemoryEditContentChange(memoryFileContent) }}
                      className="quick-btn" style={{ fontSize: 12, padding: '6px 12px' }}>
                      Cancelar
                    </button>
                    <button onClick={onSaveMemoryFile} disabled={memorySaving}
                      style={{
                        padding: '6px 16px', borderRadius: 8, border: 'none',
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 12, fontWeight: 600, cursor: memorySaving ? 'default' : 'pointer',
                        opacity: memorySaving ? 0.7 : 1,
                      }}>
                      {memorySaving ? 'A guardar...' : 'Guardar'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => onSetMemoryEditMode(true)}
                    className="quick-btn" style={{ fontSize: 12, padding: '6px 12px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Content body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--bg)' }}>
              {memoryEditMode ? (
                <textarea
                  value={memoryEditContent}
                  onChange={e => onMemoryEditContentChange(e.target.value)}
                  style={{
                    width: '100%', minHeight: 'calc(100% - 40px)',
                    padding: 16, border: '1px solid var(--surface-border)',
                    borderRadius: 10, background: 'var(--surface)',
                    color: 'var(--text)', fontSize: 13, lineHeight: 1.6,
                    fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                    resize: 'vertical',
                  }}
                />
              ) : (
                <div className="memory-markdown" style={{ maxWidth: 720 }}>
                  <MarkdownRenderer content={memoryFileContent} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
