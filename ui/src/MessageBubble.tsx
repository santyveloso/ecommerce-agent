import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

interface ApprovalInfo {
  id: string
  intent: string
  summary: string
  status: 'pending' | 'approved' | 'rejected'
}

interface MediaInfo {
  url: string
  type: 'video' | 'image'
  prompt?: string
  name?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  approvalRequired?: boolean
  approval?: ApprovalInfo
  media?: MediaInfo
}

interface MessageBubbleProps {
  message: Message
  index: number
  onCopy: (content: string) => void
  copied: boolean
  onEdit?: (index: number, newContent: string) => void
  onRegenerate?: (index: number) => void
  onDelete?: (index: number) => void
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
  timestamp?: string
}

export default function MessageBubble({
  message,
  index,
  onCopy,
  copied,
  onEdit,
  onRegenerate,
  onDelete,
  onApprove,
  onReject,
  timestamp,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isUser = message.role === 'user'

  const handleEditConfirm = () => {
    if (editContent.trim() && onEdit) {
      onEdit(index, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditConfirm()
    }
    if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleCopy = () => {
    onCopy(message.content)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && !isDeleting) {
      setIsDeleting(true)
      setTimeout(() => {
        onDelete(index)
        setIsDeleting(false)
      }, 300)
    }
  }

  const formatTimestamp = (ts?: string) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  return (
    <div
      className={`message-bubble ${isUser ? 'user' : 'assistant'} ${isDeleting ? 'deleting' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="message-content">
        {isEditing ? (
          <div className="message-edit-mode">
            <textarea
              className="edit-textarea"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
              rows={Math.min(editContent.split('\n').length + 1, 8)}
            />
            <div className="edit-actions">
              <button className="edit-cancel" onClick={handleEditCancel}>Cancel</button>
              <button className="edit-confirm" onClick={handleEditConfirm}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save & resend
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.media && (
              <div className="message-media">
                {message.media.type === 'image' ? (
                  <img src={message.media.url} alt={message.media.prompt || 'Generated image'} />
                ) : (
                  <video src={message.media.url} controls loop muted playsInline />
                )}
                {message.media.prompt && (
                  <span className="media-prompt">Prompt: {message.media.prompt}</span>
                )}
              </div>
            )}

            <MarkdownRenderer content={message.content} />

            {/* Approval box */}
            {message.approvalRequired && message.approval && (
              <div className={`approval-box ${message.approval.status}`}>
                <div className="approval-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="approval-intent">{message.approval.intent}</span>
                </div>
                <p className="approval-summary">{message.approval.summary}</p>
                {message.approval.status === 'pending' && onApprove && onReject && (
                  <div className="approval-actions">
                    <button className="approval-btn approve" onClick={() => onApprove(message.approval!.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Approve
                    </button>
                    <button className="approval-btn reject" onClick={() => onReject(message.approval!.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Reject
                    </button>
                  </div>
                )}
                {message.approval.status !== 'pending' && (
                  <span className={`approval-status ${message.approval.status}`}>
                    {message.approval.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Timestamp */}
        {timestamp && <span className="message-timestamp">{formatTimestamp(timestamp)}</span>}
      </div>

      {/* Action buttons (hover) */}
      {!isEditing && isHovered && (
        <div className="message-actions">
          <button className="msg-action-btn" onClick={handleCopy} title="Copy">
            {copied ? (
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
            <button className="msg-action-btn" onClick={() => { setEditContent(message.content); setIsEditing(true) }} title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="action-label">Edit</span>
            </button>
          )}

          {!isUser && onRegenerate && (
            <button className="msg-action-btn" onClick={() => onRegenerate(index)} title="Regenerate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span className="action-label">Retry</span>
            </button>
          )}

          {onDelete && (
            <button className="msg-action-btn delete" onClick={handleDeleteClick} title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="action-label">Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
