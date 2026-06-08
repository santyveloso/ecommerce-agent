import { useState, useRef, useEffect } from 'react'
import NewFolderModal from './NewFolderModal'
import DeleteFolderModal from './DeleteFolderModal'
import FolderGroup from './FolderGroup'
import SessionGroup from './SessionGroup'
import type { Folder, ChatSession } from './types'

interface SessionSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string
  folders: Folder[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, name: string) => void
  onTogglePin: (id: string) => void
  onNewFolder: (name: string, color?: string) => void
  onRenameFolder: (id: string, name: string) => void
  onSetFolderColor: (folderId: string, color: string) => void
  onDeleteFolder: (id: string) => void
  onToggleFolder: (id: string) => void
  onMoveSession: (sessionId: string, folderId: string | null) => void
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  folders,
  searchQuery,
  onSearchChange,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onTogglePin,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onSetFolderColor,
  onToggleFolder,
  onMoveSession,
}: SessionSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [dragSessionId, setDragSessionId] = useState<string | null>(null)
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null)
  const [dropTargetRoot, _setDropTargetRoot] = useState(false)
  // New folder
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)

  // Delete folder
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null)
  const [folderToDeleteName, setFolderToDeleteName] = useState('')
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false)

  const renameRef = useRef<HTMLInputElement>(null)
  const folderRenameRef = useRef<HTMLInputElement>(null)

  // Auto-focus rename inputs
  useEffect(() => {
    if (editingSessionId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [editingSessionId])

  useEffect(() => {
    if (editingFolderId && folderRenameRef.current) {
      folderRenameRef.current.focus()
      folderRenameRef.current.select()
    }
  }, [editingFolderId])

  // Filter sessions by search
  const filteredSessions = searchQuery
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions

  // Group sessions: folders first, then pinned
  const pinnedSessions = filteredSessions.filter(s => s.pinned)
  const unfiledSessions = filteredSessions.filter(s => !s.folderId && !s.pinned)
  const sessionsInFolder = (folderId: string) =>
    filteredSessions.filter(s => s.folderId === folderId)

  // Drag handlers
  const handleDragStart = (sessionId: string) => {
    setDragSessionId(sessionId)
  }

  const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    if (targetFolderId !== null) {
      setDropTargetFolderId(targetFolderId)
      _setDropTargetRoot(false)
    } else {
      _setDropTargetRoot(true)
      setDropTargetFolderId(null)
    }
  }

  const handleDragEnd = () => {
    if (dragSessionId && (dropTargetFolderId !== undefined)) {
      onMoveSession(dragSessionId, dropTargetFolderId)
    }
    setDragSessionId(null)
    setDropTargetFolderId(null)
    _setDropTargetRoot(false)
  }

  // Session rename
  const startRenameSession = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
  }

  const commitRenameSession = () => {
    if (editingSessionId && editingTitle.trim()) {
      onRenameSession(editingSessionId, editingTitle.trim())
    }
    setEditingSessionId(null)
  }

  // Folder rename
  const startRenameFolder = (folder: Folder) => {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  const commitRenameFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      onRenameFolder(editingFolderId, editingFolderName.trim())
    }
    setEditingFolderId(null)
  }

  // New folder
  const handleCreateFolder = (name: string, color: string) => {
    onNewFolder(name.trim(), color)
    setShowNewFolderModal(false)
  }

  // Delete folder
  const handleConfirmDeleteFolder = () => {
    if (folderToDeleteId) {
      onDeleteFolder(folderToDeleteId)
      setFolderToDeleteId(null)
      setShowDeleteFolderModal(false)
    }
  }

  const sessionItemConfig = {
    activeSessionId,
    editingSessionId,
    editingTitle,
    renameRef,
    onSelectSession,
    onDeleteSession,
    onTogglePin,
    setEditingTitle,
    startRenameSession,
    commitRenameSession,
    setEditingSessionId,
    handleDragStart,
    handleDragEnd,
  }

  return (
    <div className="session-sidebar">
      {/* Search */}
      <div className="session-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => onSearchChange('')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* New session button */}
      <button className="new-session-btn" onClick={onNewSession}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      {/* Scrollable session list */}
      <div className="session-list">
        {/* Folders — always on top */}
        {folders.map(folder => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            sessions={sessionsInFolder(folder.id)}
            editingFolderId={editingFolderId}
            editingFolderName={editingFolderName}
            folderRenameRef={folderRenameRef}
            sessionItemConfig={sessionItemConfig}
            onToggleFolder={onToggleFolder}
            onSetFolderColor={onSetFolderColor}
            onDeleteRequest={(id, name) => {
              setFolderToDeleteId(id)
              setFolderToDeleteName(name)
              setShowDeleteFolderModal(true)
            }}
            commitRenameFolder={commitRenameFolder}
            startRenameFolder={startRenameFolder}
            setEditingFolderId={setEditingFolderId}
            setEditingFolderName={setEditingFolderName}
            handleDragOver={handleDragOver}
          />
        ))}

        {/* Pinned sessions */}
        <SessionGroup
          label="Pinned"
          sessions={pinnedSessions}
          config={sessionItemConfig}
        />

        {/* Unfiled sessions */}
        <SessionGroup
          label={folders.length > 0 ? 'Chats' : undefined}
          sessions={unfiledSessions}
          config={sessionItemConfig}
          onDragOver={(e) => handleDragOver(e, null)}
        />
      </div>

      {/* Bottom actions */}
      <div className="session-sidebar-footer">
        <button className="sidebar-footer-btn" onClick={() => setShowNewFolderModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          New Folder
        </button>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <NewFolderModal
          onClose={() => setShowNewFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {/* Delete Folder Modal */}
      {showDeleteFolderModal && (
        <DeleteFolderModal
          folderName={folderToDeleteName}
          onClose={() => { setShowDeleteFolderModal(false); setFolderToDeleteId(null) }}
          onConfirm={handleConfirmDeleteFolder}
        />
      )}
    </div>
  )
}
