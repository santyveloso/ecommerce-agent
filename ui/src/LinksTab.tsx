import { Icons } from './Icons'
import { LINK_ICONS, getIconColor, getFaviconUrl, getGradient } from './links-data'

interface LinkItem {
  id: string
  name: string
  url: string
}

interface LinksTabProps {
  links: LinkItem[]
  showAddLink: boolean
  newLinkName: string
  newLinkUrl: string
  shopifyUrl: string
  displayLinks: LinkItem[]
  setShowAddLink: (v: boolean) => void
  setNewLinkName: (v: string) => void
  setNewLinkUrl: (v: string) => void
  setShopifyUrl: (v: string) => void
  addLink: () => void
  deleteLink: (id: string) => void
}

export default function LinksTab({
  links,
  showAddLink,
  newLinkName,
  newLinkUrl,
  shopifyUrl,
  displayLinks,
  setShowAddLink,
  setNewLinkName,
  setNewLinkUrl,
  setShopifyUrl,
  addLink,
  deleteLink,
}: LinksTabProps) {
  return (
    <div style={{ padding: '32px 40px' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Links</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Atalhos rápidos para as tuas ferramentas
          </p>
        </div>
        <button
          onClick={() => setShowAddLink(!showAddLink)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: showAddLink ? 'var(--surface)' : 'var(--accent)',
            color: showAddLink ? 'var(--text)' : '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            boxShadow: showAddLink ? 'none' : '0 2px 8px rgba(99,102,241,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!showAddLink) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { if (!showAddLink) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showAddLink ? 'Fechar' : 'Adicionar Link'}
        </button>
      </div>

      {/* ── Add link form ── */}
      {showAddLink && (
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--surface-border)', padding: 24, marginBottom: 32,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
            Novo Link
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={newLinkName}
              onChange={e => setNewLinkName(e.target.value)}
              placeholder="Nome (ex: Canva)"
              style={{
                flex: '1 1 200px', padding: '12px 16px',
                border: '1px solid var(--surface-border)', borderRadius: 10,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <input
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="URL (ex: https://canva.com)"
              style={{
                flex: '2 1 300px', padding: '12px 16px',
                border: '1px solid var(--surface-border)', borderRadius: 10,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={addLink}
              disabled={!newLinkName.trim() || !newLinkUrl.trim()}
              style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: !newLinkName.trim() || !newLinkUrl.trim() ? 'var(--surface-border)' : 'var(--accent)',
                color: !newLinkName.trim() || !newLinkUrl.trim() ? 'var(--text-muted)' : '#fff',
                fontSize: 14, fontWeight: 600, cursor: !newLinkName.trim() || !newLinkUrl.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Shopify URL config */}
      {links.some(l => l.id === 'shopify') && (
        <div className="section" style={{ marginBottom: 24, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Shopify Store URL</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={shopifyUrl}
              onChange={e => setShopifyUrl(e.target.value)}
              placeholder="https://tualoja.myshopify.com/admin"
              style={{
                flex: 1, padding: '10px 14px',
                border: '1px solid var(--surface-border)', borderRadius: 8,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Link cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {displayLinks.map((link, idx) => (
          <a
            key={link.id}
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { if (!link.url) e.preventDefault() }}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: 0, borderRadius: 16, overflow: 'hidden',
              textDecoration: 'none', cursor: link.url ? 'pointer' : 'default',
              minHeight: 180, position: 'relative',
              border: link.url ? 'none' : '2px dashed var(--surface-border)',
              background: link.url ? getGradient(link.id, idx) : 'transparent',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: 'scale(1)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            {/* Card content */}
            <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                background: link.url ? getIconColor(link.id) : 'var(--surface)',
                color: '#fff',
              }}>
                {link.url ? (
                  <img src={getFaviconUrl(link.url)} alt="" style={{ width: 22, height: 22, borderRadius: 4 }} onError={e => { (e.target as HTMLElement).style.display = 'none'; (e.target as HTMLElement).parentElement!.textContent = LINK_ICONS[link.id] || link.name.slice(0, 2).toUpperCase() }} />
                ) : (
                  LINK_ICONS[link.id] || link.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: link.url ? '#fff' : 'var(--text-muted)', lineHeight: 1.3 }}>
                {link.name}
              </div>
              <div style={{
                fontSize: 12, color: link.url ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {link.url || 'Sem URL configurado'}
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{
              padding: '12px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: link.url ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--surface-border)',
              marginTop: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: link.url ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
                {link.url ? 'Abrir →' : 'Configurar'}
              </span>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); deleteLink(link.id) }}
                style={{
                  background: link.url ? 'rgba(255,255,255,0.15)' : 'var(--danger-bg)',
                  border: 'none', borderRadius: 8, padding: '4px 10px',
                  color: link.url ? 'rgba(255,255,255,0.8)' : 'var(--danger)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {link.id === 'shopify' && !shopifyUrl ? 'Limpar' : 'Remover'}
              </button>
            </div>
          </a>
        ))}

      </div>
    </div>
  )
}
