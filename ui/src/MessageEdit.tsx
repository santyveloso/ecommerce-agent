interface MessageEditProps {
  content: string
  onChange: (val: string) => void
  onConfirm: () => void
  onCancel: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export default function MessageEdit({ content, onChange, onConfirm, onCancel, onKeyDown }: MessageEditProps) {
  return (
    <div className="message-edit-mode">
      <textarea
        className="edit-textarea"
        value={content}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        rows={Math.min(content.split('\n').length + 1, 8)}
      />
      <div className="edit-actions">
        <button className="edit-cancel" onClick={onCancel}>Cancel</button>
        <button className="edit-confirm" onClick={onConfirm}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Save & resend
        </button>
      </div>
    </div>
  )
}
