import { useState } from 'react'
import { FOLDER_COLORS } from './links-data'

interface NewFolderModalProps {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}

export default function NewFolderModal({ onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('var(--accent)')

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), color)
      setName('')
      setColor('var(--accent)')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal new-folder-modal">
        <h3>New Folder</h3>
        <input
          className="modal-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          placeholder="Folder name"
          autoFocus
        />
        <div className="folder-color-picker">
          <label className="folder-color-label">Color</label>
          <div className="folder-color-swatches">
            {FOLDER_COLORS.map(c => (
              <button
                key={c.value}
                className={`folder-color-swatch ${color === c.value ? 'active' : ''}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                title={c.name}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleCreate} disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  )
}
