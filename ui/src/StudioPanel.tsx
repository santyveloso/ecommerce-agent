import { useState, useCallback } from 'react'
import StudioImageModal from './StudioImageModal'
import { uid, demoPlaceholderFn } from './helpers'

interface GeneratedImage {
  id: string
  prompt: string
  url: string
  timestamp: string
}

interface StudioPanelProps {
  cardSize: 'S' | 'M' | 'L'
  onCardSizeChange: (size: 'S' | 'M' | 'L') => void
  generatedImages: GeneratedImage[]
  onClearImages: () => void
  modalImage: GeneratedImage | null
  onModalImageChange: (img: GeneratedImage | null) => void
  studioInput: string
  onStudioInputValueChange: (val: string) => void
  studioLoading: boolean
  selectedImage: GeneratedImage | null
  studioUploads: GeneratedImage[]
  studioShowSuggestions: boolean
  studioSuggestions: string[]
  studioActiveSuggestionIdx: number
  onStudioSend: (e: React.FormEvent, contextImage?: GeneratedImage | null) => Promise<void>
  onStudioInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInsertStudioSuggestion: (name: string) => void
  onStudioInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export default function StudioPanel({
  cardSize,
  onCardSizeChange,
  generatedImages,
  onClearImages,
  modalImage,
  onModalImageChange,
  studioInput,
  studioLoading,
  selectedImage,
  studioUploads,
  studioShowSuggestions,
  studioSuggestions,
  studioActiveSuggestionIdx,
  onStudioSend,
  onStudioInputChange,
  onInsertStudioSuggestion,
  onStudioInputKeyDown,
  onStudioInputValueChange,
}: StudioPanelProps) {
  const sizeButtons = (['S', 'M', 'L'] as const)

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* ── Main: Gallery + Prompt ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '20px 28px', borderBottom: '1px solid var(--surface-border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            minHeight: 56, gap: 12,
          }}>
            <div style={{ flexShrink: 0 }}>
              <h1 className="page-title" style={{ fontSize: 16, margin: 0 }}>Studio</h1>
              <p className="greeting" style={{ fontSize: 12, margin: 0 }}>Cria imagens com IA para as tuas lojas</p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', borderRadius: 8, padding: 2, border: '1px solid var(--surface-border)' }}>
                {sizeButtons.map(size => (
                  <button key={size} onClick={() => onCardSizeChange(size)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none',
                      background: cardSize === size ? 'var(--accent)' : 'transparent',
                      color: cardSize === size ? '#fff' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}>{size}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{generatedImages.length} gerada{generatedImages.length !== 1 ? 's' : ''}</span>
              <button onClick={onClearImages}
                className="quick-btn" style={{ fontSize: 11, padding: '5px 10px', color: 'var(--danger)' }}>
                Limpar
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {generatedImages.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 16, paddingTop: 80, color: 'var(--text-muted)',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'var(--surface)', border: '1px solid var(--surface-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>Nenhuma imagem gerada</p>
                  <p style={{ fontSize: 12 }}>Escreve um prompt abaixo para comecar</p>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: cardSize === 'S' ? 'repeat(auto-fill, minmax(160px, 1fr))'
                  : cardSize === 'M' ? 'repeat(auto-fill, minmax(220px, 1fr))'
                  : 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: cardSize === 'S' ? 10 : cardSize === 'M' ? 14 : 20,
              }}>
                {generatedImages.map((img, i) => (
                  <div key={img.id} onClick={() => onModalImageChange(img)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--surface-border)' }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', overflow: 'hidden',
                      background: 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {img.url ? (
                        <img src={img.url} alt={img.prompt}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={`data:image/svg+xml,${encodeURIComponent(demoPlaceholderFn(img.prompt, i))}`}
                          alt={img.prompt}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ padding: cardSize === 'S' ? '6px 8px' : '10px 12px' }}>
                      <p style={{
                        fontSize: cardSize === 'S' ? 10 : 12,
                        color: 'var(--text)', lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {img.prompt}
                      </p>
                      {cardSize !== 'S' && (
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(img.timestamp).toLocaleString('pt-PT')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {studioLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <div className="loader" style={{ width: 20, height: 20 }} />
                A gerar imagem...
              </div>
            )}
          </div>

          {/* Prompt bar */}
          <div style={{
            padding: '16px 28px 20px', borderTop: '1px solid var(--surface-border)',
            background: 'var(--bg)',
          }}>
            <form onSubmit={(e) => onStudioSend(e, undefined)} style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={studioInput}
                  onChange={onStudioInputChange}
                  onKeyDown={onStudioInputKeyDown}
                  placeholder={selectedImage ? 'Descreve a variacao que queres...' : 'Descreve a imagem que queres criar...'}
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: `1px solid ${selectedImage ? 'var(--accent)' : 'var(--surface-border)'}`,
                    borderRadius: 10, background: 'var(--surface)', color: 'var(--text)',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                {/* Suggestions dropdown */}
                {studioShowSuggestions && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 4,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}>
                    {studioSuggestions.map((name, i) => (
                      <div key={name}
                        onClick={() => onInsertStudioSuggestion(name)}
                        style={{
                          padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                          background: i === studioActiveSuggestionIdx ? 'var(--accent-bg)' : 'transparent',
                          color: 'var(--text)',
                        }}>
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={studioLoading || !studioInput.trim()}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: studioInput.trim() ? 'var(--accent)' : 'var(--surface)',
                  color: studioInput.trim() ? '#fff' : 'var(--text-muted)',
                  fontSize: 14, fontWeight: 600, cursor: studioInput.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                Gerar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Image Modal ── */}
      {modalImage && (
        <StudioImageModal
          image={modalImage}
          allImages={generatedImages}
          studioInput={studioInput}
          studioLoading={studioLoading}
          onClose={() => onModalImageChange(null)}
          onStudioInputChange={onStudioInputValueChange}
          onVariate={(e, img) => onStudioSend(e, img || undefined)}
        />
      )}
    </>
  )
}
