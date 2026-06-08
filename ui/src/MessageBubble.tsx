import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ApprovalBox from './ApprovalBox'
import MessageEdit from './MessageEdit'
import MessageActions from './MessageActions'

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
          <MessageEdit
            content={editContent}
            onChange={setEditContent}
            onConfirm={handleEditConfirm}
            onCancel={handleEditCancel}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
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
              <ApprovalBox
                approval={message.approval}
                onApprove={onApprove}
                onReject={onReject}
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        {timestamp && <span className="message-timestamp">{formatTimestamp(timestamp)}</span>}
      </div>

      {/* Action buttons (hover) */}
      {!isEditing && isHovered && (
        <MessageActions
          isUser={isUser}
          isCopied={copied}
          onCopy={handleCopy}
          onEdit={message.role === 'user' ? () => { setEditContent(message.content); setIsEditing(true) } : undefined}
          onRegenerate={!isUser && onRegenerate ? () => onRegenerate(index) : undefined}
          onDelete={onDelete ? handleDeleteClick : undefined}
        />
      )}
    </div>
  )
}
