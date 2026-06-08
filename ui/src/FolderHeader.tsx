import { type RefObject } from 'react'
import { FOLDER_COLORS } from './links-data'

export interface FolderItem {
  id: string
  name: string
  expanded: boolean
  color?: string
}

interface FolderHeaderProps {
  folder: FolderItem
  editingFolderId: string | null
  editingFolderName: string
  folderRenameRef: RefObject<HTMLInputElement | null>
  onToggleFolder: (id: string) => void
  onSetFolderColor: (folderId: string, color: string) => void
  onDeleteRequest: (folderId: string, folderName: string) => void
  commitRenameFolder: () => void
  startRenameFolder: (folder: FolderItem) => void
  setEditingFolderId: (id: string | null) => void
  setEditingFolderName: (name: string) => void
  handleDragOver: (e: React.DragEvent, targetFolderId: string | null) => void
}

export default function FolderHeader({
  folder,
  editingFolderId,
  editingFolderName,
  folderRenameRef,
  onToggleFolder,
  onSetFolderColor,
  onDeleteRequest,
  commitRenameFolder,
  startRenameFolder,
  setEditingFolderId,
  setEditingFolderName,
  handleDragOver,
}: FolderHeaderProps) {
  return (
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
            onDeleteRequest(folder.id, folder.name)
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
  )
}
