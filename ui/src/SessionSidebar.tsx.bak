import { useState, useRef, useEffect } from 'react'

interface Folder {
  id: string
  name: string
  expanded: boolean
  color?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Array<{ role: string; content: string }>
  folderId?: string | null
  pinned?: boolean
}

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
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('var(--accent)')
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false)
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null)
  const [folderToDeleteName, setFolderToDeleteName] = useState('')

  const FOLDER_COLORS = [
    { name: 'Blue', value: 'var(--accent)' },
    { name: 'Purple', value: 'var(--chart-purple)' },
    { name: 'Green', value: 'var(--success)' },
    { name: 'Orange', value: 'var(--warning)' },
    { name: 'Red', value: 'var(--danger)' },
    { name: 'Cyan', value: 'var(--chart-cyan)' },
  ]

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
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onNewFolder(newFolderName.trim(), newFolderColor)
      setNewFolderName('')
      setNewFolderColor('var(--accent)')
      setShowNewFolderModal(false)
    }
  }

  // Delete folder
  const handleConfirmDeleteFolder = () => {
    if (folderToDeleteId) {
      onDeleteFolder(folderToDeleteId)
      setFolderToDeleteId(null)
      setShowDeleteFolderModal(false)
    }
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
          <div key={folder.id} className="folder-group">
            <div
              className="folder-header"
              onClick={() => onToggleFolder(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`folder-chevron ${folder.expanded ? 'expanded' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={folder.color || 'currentColor'} strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {editingFolderId === folder.id ? (
                <input
                  ref={folderRenameRef}
                  className="folder-rename-input"
                  value={editingFolderName}
                  onChange={e => setEditingFolderName(e.target.value)}
                  onBlur={commitRenameFolder}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRenameFolder()
                    if (e.key === 'Escape') setEditingFolderId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span
                  className="folder-name"
                  onDoubleClick={() => startRenameFolder(folder)}
                >
                  {folder.name}
                </span>
              )}
              <div className="folder-actions">
                <button
                  className="folder-action-btn"
                  onClick={e => {
                    e.stopPropagation()
                    const colors = FOLDER_COLORS.map(c => c.value)
                    const curIdx = folder.color ? colors.indexOf(folder.color) : -1
                    const nextIdx = (curIdx + 1) % colors.length
                    onSetFolderColor(folder.id, colors[nextIdx])
                  }}
                  title="Change color"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </button>
                <button
                  className="folder-action-btn"
                  onClick={e => {
                    e.stopPropagation()
                    setFolderToDeleteId(folder.id)
                    setFolderToDeleteName(folder.name)
                    setShowDeleteFolderModal(true)
                  }}
                  title="Delete folder"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sessions in folder */}
            {folder.expanded && (
              <div className="folder-sessions">
                {sessionsInFolder(folder.id).length === 0 && (
                  <div className="folder-empty">Drop a chat here</div>
                )}
                {sessionsInFolder(folder.id).map(session => (
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
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Pinned sessions */}
        {pinnedSessions.length > 0 && (
          <div className="session-group">
            <div className="session-group-label">Pinned</div>
            {pinnedSessions.map(session => (
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
            ))}
          </div>
        )}

        {/* Unfiled sessions */}
        {unfiledSessions.length > 0 && (
          <div
            className="session-group"
            onDragOver={(e) => handleDragOver(e, null)}
          >
            {folders.length > 0 && <div className="session-group-label">Chats</div>}
            {unfiledSessions.map(session => (
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
            ))}
          </div>
        )}
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
        <div className="modal-overlay">
          <div className="modal new-folder-modal">
            <h3>New Folder</h3>
            <input
              className="modal-input"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder() }}
              placeholder="Folder name"
              autoFocus
            />
            <div className="folder-color-picker">
              <label className="folder-color-label">Color</label>
              <div className="folder-color-swatches">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.value}
                    className={`folder-color-swatch ${newFolderColor === c.value ? 'active' : ''}`}
                    style={{ background: c.value }}
                    onClick={() => setNewFolderColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => { setShowNewFolderModal(false); setNewFolderName(''); setNewFolderColor('var(--accent)') }}>Cancel</button>
              <button className="modal-btn primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDeleteFolderModal && (
        <div className="modal-overlay">
          <div className="modal delete-folder-modal">
            <h3>Delete Folder</h3>
            <p>Delete "<strong>{folderToDeleteName}</strong>"? Sessions inside will be moved to the root.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => { setShowDeleteFolderModal(false); setFolderToDeleteId(null) }}>Cancel</button>
              <button className="modal-btn danger" onClick={handleConfirmDeleteFolder}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Reusable Session Item ────────────────────── */

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

function SessionItem({
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
