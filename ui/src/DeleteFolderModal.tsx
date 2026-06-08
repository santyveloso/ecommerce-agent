interface DeleteFolderModalProps {
  folderName: string
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteFolderModal({ folderName, onClose, onConfirm }: DeleteFolderModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal delete-folder-modal">
        <h3>Delete Folder</h3>
        <p>Delete "<strong>{folderName}</strong>"? Sessions inside will be moved to the root.</p>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
