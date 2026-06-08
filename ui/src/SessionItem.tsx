import { useState } from 'react'

interface ChatSession {
  id: string
  title: string
  messages: Array<{ role: string; content: string }>
  folderId?: string | null
  pinned?: boolean
}

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  isEditing: boolean
  editTitle: string
  onEditTitleChange: (t: string) => void
  onSelect: () => void
  onStartRename: () => void
  onCommitRename: () => void
  onRenameKeyDown: (e: React.KeyboardEvent) => void
  onDelete: () => void
  onTogglePin: () => void
  onDragStart: () => void
  onDragEnd: () => void
  renameRef?: React.RefObject<HTMLInputElement | null>
}

/* ── Reusable Session Item ────────────────────── */
export default function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onEditTitleChange,
  onSelect,
  onStartRename,
  onCommitRename,
  onRenameKeyDown,
  onDelete,
  onTogglePin,
  onDragStart,
  onDragEnd,
  renameRef,
}: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const msgCount = session.messages.filter(m => m.role === 'user').length

  return (
    <div
      className={`session-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
    >
      {session.pinned && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="session-pin-icon">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
        </svg>
      )}

      {isEditing ? (
        <input
          ref={renameRef as React.RefObject<HTMLInputElement>}
          className="session-rename-input"
          value={editTitle}
          onChange={e => onEditTitleChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={onRenameKeyDown}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="session-title" onDoubleClick={(e) => { e.stopPropagation(); onStartRename() }}>
          {session.title}
        </span>
      )}

      {!isEditing && isHovered && (
        <div className="session-item-actions">
          <button onClick={(e) => { e.stopPropagation(); onTogglePin() }} title={session.pinned ? 'Unpin' : 'Pin'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={session.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onStartRename() }} title="Rename">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}

      {!isHovered && msgCount > 0 && (
        <span className="session-msg-count">{msgCount}</span>
      )}
    </div>
  )
}
