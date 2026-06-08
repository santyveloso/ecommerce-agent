import type { Folder, ChatSession } from './types'
import FolderHeader from './FolderHeader'
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

interface FolderGroupProps {
  folder: Folder
  sessions: ChatSession[]
  editingFolderId: string | null
  editingFolderName: string
  folderRenameRef: React.RefObject<HTMLInputElement | null>
  sessionItemConfig: SessionItemConfig
  onToggleFolder: (id: string) => void
  onSetFolderColor: (folderId: string, color: string) => void
  onDeleteRequest: (id: string, name: string) => void
  commitRenameFolder: () => void
  startRenameFolder: (folder: Folder) => void
  setEditingFolderId: (v: string | null) => void
  setEditingFolderName: (v: string) => void
  handleDragOver: (e: React.DragEvent, targetFolderId: string | null) => void
}

export default function FolderGroup({
  folder,
  sessions,
  editingFolderId,
  editingFolderName,
  folderRenameRef,
  sessionItemConfig,
  onToggleFolder,
  onSetFolderColor,
  onDeleteRequest,
  commitRenameFolder,
  startRenameFolder,
  setEditingFolderId,
  setEditingFolderName,
  handleDragOver,
}: FolderGroupProps) {
  return (
    <div key={folder.id} className="folder-group">
      <FolderHeader
        folder={folder}
        editingFolderId={editingFolderId}
        editingFolderName={editingFolderName}
        folderRenameRef={folderRenameRef}
        onToggleFolder={onToggleFolder}
        onSetFolderColor={onSetFolderColor}
        onDeleteRequest={onDeleteRequest}
        commitRenameFolder={commitRenameFolder}
        startRenameFolder={startRenameFolder}
        setEditingFolderId={setEditingFolderId}
        setEditingFolderName={setEditingFolderName}
        handleDragOver={handleDragOver}
      />

      {/* Sessions in folder */}
      {folder.expanded && (
        <div className="folder-sessions">
          {sessions.length === 0 && (
            <div className="folder-empty">Drop a chat here</div>
          )}
          {sessions.map(session => (
            renderSessionItem(session, sessionItemConfig)
          ))}
        </div>
      )}
    </div>
  )
}
