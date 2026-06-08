interface MessageActionsProps {
  isUser: boolean
  isCopied: boolean
  onCopy: () => void
  onEdit?: () => void
  onRegenerate?: () => void
  onDelete?: () => void
}

export default function MessageActions({
  isUser,
  isCopied,
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
}: MessageActionsProps) {
  return (
    <div className="message-actions">
      <button className="msg-action-btn" onClick={onCopy} title="Copy">
        {isCopied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="action-label">Copied!</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span className="action-label">Copy</span>
          </>
        )}
      </button>

      {isUser && onEdit && (
        <button className="msg-action-btn" onClick={onEdit} title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span className="action-label">Edit</span>
        </button>
      )}

      {!isUser && onRegenerate && (
        <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span className="action-label">Retry</span>
        </button>
      )}

      {onDelete && (
        <button className="msg-action-btn delete" onClick={onDelete} title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span className="action-label">Delete</span>
        </button>
      )}
    </div>
  )
}
