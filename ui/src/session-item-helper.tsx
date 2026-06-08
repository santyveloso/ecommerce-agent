import { type RefObject } from 'react'
import SessionItem from './SessionItem'
import type { ChatSession } from './types'

export interface SessionItemConfig {
  activeSessionId: string
  editingSessionId: string | null
  editingTitle: string
  renameRef: RefObject<HTMLInputElement | null>
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onTogglePin: (id: string) => void
  setEditingTitle: (t: string) => void
  startRenameSession: (s: ChatSession) => void
  commitRenameSession: () => void
  setEditingSessionId: (id: string | null) => void
  handleDragStart: (id: string) => void
  handleDragEnd: () => void
}

export function renderSessionItem(
  session: ChatSession,
  cfg: SessionItemConfig,
) {
  const {
    activeSessionId, editingSessionId, editingTitle, renameRef,
    onSelectSession, onDeleteSession, onTogglePin,
    setEditingTitle, startRenameSession, commitRenameSession,
    setEditingSessionId, handleDragStart, handleDragEnd,
  } = cfg

  return (
    <SessionItem
      key={session.id}
      session={session}
      isActive={session.id === activeSessionId}
      isEditing={editingSessionId === session.id}
      editTitle={editingTitle}
      onEditTitleChange={setEditingTitle}
      onSelect={() => onSelectSession(session.id)}
      onStartRename={() => startRenameSession(session)}
      onCommitRename={commitRenameSession}
      onRenameKeyDown={(e) => {
        if (e.key === 'Enter') commitRenameSession()
        if (e.key === 'Escape') setEditingSessionId(null)
      }}
      onDelete={() => onDeleteSession(session.id)}
      onTogglePin={() => onTogglePin(session.id)}
      onDragStart={() => handleDragStart(session.id)}
      onDragEnd={handleDragEnd}
      renameRef={editingSessionId === session.id ? renameRef : undefined}
    />
  )
}
