/* ── Studio Image Modal ──────────────────────── */
import { demoPlaceholderFn } from './helpers'

interface GeneratedImage {
  id: string
  prompt: string
  url: string
  timestamp: string
}

interface Props {
  image: GeneratedImage
  allImages: GeneratedImage[]
  studioInput: string
  studioLoading: boolean
  onClose: () => void
  onStudioInputChange: (val: string) => void
  onVariate: (e: React.FormEvent, contextImage: GeneratedImage) => void
}

export default function StudioImageModal({
  image,
  allImages,
  studioInput,
  studioLoading,
  onClose,
  onStudioInputChange,
  onVariate,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        display: 'flex', height: '100%', maxHeight: '90vh',
        width: '100%', maxWidth: 1400,
        background: 'var(--surface)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        {/* Image — left side */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', minWidth: 0,
        }}>
          <img
            src={image.url || `data:image/svg+xml,${encodeURIComponent(demoPlaceholderFn(image.prompt, allImages.indexOf(image)))}`}
            alt={image.prompt}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
        {/* Sidebar — right side */}
        <div style={{
          width: 340, display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid var(--surface-border)',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>Prompt</h3>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{image.prompt}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              {new Date(image.timestamp).toLocaleString('pt-PT')}
            </p>
          </div>
          <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Variacao</p>
            <form onSubmit={e => {
              e.preventDefault()
              if (!studioInput.trim()) return
              onClose()
              onVariate(e, image)
            }} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <textarea
                value={studioInput}
                onChange={e => onStudioInputChange(e.target.value)}
                placeholder="Descreve a variacao..."
                style={{
                  flex: 1, width: '100%', padding: '10px 12px',
                  border: '1px solid var(--surface-border)', borderRadius: 8,
                  background: 'var(--bg)', color: 'var(--text)',
                  fontSize: 12, fontFamily: 'inherit', outline: 'none',
                  resize: 'none', minHeight: 100,
                }}
              />
              <button type="submit" disabled={studioLoading || !studioInput.trim()}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: studioInput.trim() ? 'var(--accent)' : 'var(--surface)',
                  color: studioInput.trim() ? '#fff' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: studioInput.trim() ? 'pointer' : 'default',
                }}>
                {studioLoading ? 'A gerar...' : 'Gerar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
