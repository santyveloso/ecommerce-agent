import { type RefObject } from 'react'
import { Icons } from './Icons'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  sidebarCollapsed: boolean
  sidebarWidth: number
  sidebarRef: RefObject<HTMLDivElement | null>
  handleResizeStart: (e: React.MouseEvent) => void
  momUnreadCount?: number
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  sidebarWidth,
  sidebarRef,
  handleResizeStart,
  momUnreadCount = 0,
}: SidebarProps) {
  return (
    <div ref={sidebarRef} className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: sidebarCollapsed ? 56 : sidebarWidth }}>
      <div className="sidebar-logo">
        <div className="logo-icon">EC</div>
        {!sidebarCollapsed && (
          <>
            <span className="logo-text">chat</span>
            <span className="logo-badge">v2</span>
          </>
        )}
      </div>

      <div className="sidebar-nav">
        <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          {Icons.grid}{!sidebarCollapsed && <span>Dashboard</span>}
        </a>
        <a className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          {Icons.chat}{!sidebarCollapsed && <span>Chat</span>}
        </a>
        <a className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          {Icons.cart}{!sidebarCollapsed && <span>Orders</span>}
        </a>
        <a className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
          {Icons.mail}{!sidebarCollapsed && <span>Emails</span>}
        </a>
        <a className={`nav-item ${activeTab === 'studio' ? 'active' : ''}`} onClick={() => setActiveTab('studio')}>
          {Icons.studio}{!sidebarCollapsed && <span>Studio</span>}
        </a>
        <a className={`nav-item ${activeTab === 'automations' ? 'active' : ''}`} onClick={() => setActiveTab('automations')}>
          {Icons.zap}{!sidebarCollapsed && <span>Routines</span>}
        </a>
        <a className={`nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
          {Icons.memory}{!sidebarCollapsed && <span>Memory</span>}
        </a>
        <a className={`nav-item ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
          {Icons.link}{!sidebarCollapsed && <span>Links</span>}
        </a>
        <a className={`nav-item ${activeTab === 'mom' ? 'active' : ''}`} onClick={() => setActiveTab('mom')} style={{ position: 'relative' }}>
          {Icons.heart}{!sidebarCollapsed && <span>Mãe</span>}
          {momUnreadCount > 0 && (
            <span style={{
              position: 'absolute',
              right: sidebarCollapsed ? 8 : 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ef4444',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
            }}>
              {momUnreadCount > 99 ? '99+' : momUnreadCount}
            </span>
          )}
        </a>
        <a className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
          {Icons.activity}{!sidebarCollapsed && <span>Status</span>}
        </a>
      </div>

      <div className="sidebar-footer">
        <a className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} style={{ marginBottom: 8 }}>
          {Icons.settings}{!sidebarCollapsed && <span>Settings</span>}
        </a>
        <div className="status-row">
          <div className="status-dot" />
          {!sidebarCollapsed && <span>Conectado</span>}
        </div>
      </div>

      {/* Resize handle — always visible */}
      <div className="resize-handle" onMouseDown={handleResizeStart} title="Arrastar para redimensionar" />
    </div>
  )
}
