import type { ChatSession } from './types'
import { renderSessionItem } from './session-item-helper'

interface SessionItemConfig {
  activeSessionId: string
  editingSessionId: string | null
  editingTitle: string
  renameRef: React.RefObject<HTMLInputElement | null>
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onTogglePin: (id: string) => void
  setEditingTitle: (v: string) => void
  startRenameSession: (session: ChatSession) => void
  commitRenameSession: () => void
  setEditingSessionId: (v: string | null) => void
  handleDragStart: (sessionId: string) => void
  handleDragEnd: () => void
}

interface SessionGroupProps {
  label?: string
  sessions: ChatSession[]
  config: SessionItemConfig
  onDragOver?: (e: React.DragEvent) => void
}

export default function SessionGroup({ label, sessions, config, onDragOver }: SessionGroupProps) {
  if (sessions.length === 0) return null

  return (
    <div className="session-group" onDragOver={onDragOver}>
      {label && <div className="session-group-label">{label}</div>}
      {sessions.map(session => (
        renderSessionItem(session, config)
      ))}
    </div>
  )
}
