import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import type { ToolProgress } from './useChatStream'

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

interface ChatMessagesProps {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  currentTool?: ToolProgress | null
  onCopy: (content: string) => void
  copiedMessageId: string | null
  onEdit?: (index: number, newContent: string) => void
  onRegenerate?: (index: number) => void
  onDelete?: (index: number) => void
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
  onNewChat?: () => void
  emptyStateTitle?: string
  emptyStateSubtitle?: string
}

export default function ChatMessages({
  messages,
  isStreaming,
  streamingContent,
  currentTool,
  onCopy,
  copiedMessageId,
  onEdit,
  onRegenerate,
  onDelete,
  onApprove,
  onReject,
  onNewChat,
  emptyStateTitle = 'What can I help with?',
  emptyStateSubtitle = '',
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const prevMsgCountRef = useRef(messages.length)

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    const shouldScroll = messages.length > prevMsgCountRef.current || isStreaming
    if (shouldScroll) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    prevMsgCountRef.current = messages.length
  }, [messages.length, isStreaming, streamingContent])

  // Detect scroll position for "scroll to bottom" button
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollButton(diff > 200)
  }

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }

  const isEmpty = messages.length === 0 && !streamingContent

  if (isEmpty) {
    return (
      <div className="chat-messages-empty">
        <h2 className="empty-state-title">{emptyStateTitle}</h2>
      </div>
    )
  }

  // Generate a stable key for the streaming message
  const streamMsgKey = `streaming-${messages.length}`

  return (
    <div className="chat-messages-container">
      <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>
        {messages.map((msg, i) => {
          // Skip empty assistant placeholder during streaming — evita 2 avatares
          if (msg.role === 'assistant' && !msg.content && isStreaming && i === messages.length - 1) {
            return null
          }
          return (
            <MessageBubble
              key={`${msg.role}-${i}-${msg.content.slice(0, 20)}`}
              message={msg}
              index={i}
              onCopy={onCopy}
              copied={copiedMessageId === `msg-${i}`}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
              onApprove={onApprove}
              onReject={onReject}
            />
          )
        })}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <MessageBubble
            key={streamMsgKey}
            message={{ role: 'assistant', content: streamingContent }}
            index={messages.length}
            onCopy={onCopy}
            copied={false}
          />
        )}

        {/* Streaming indicator */}
        {isStreaming && !streamingContent && (
          <div className="message-bubble assistant streaming">
            <div className="message-avatar assistant-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="message-content">
              <div className="bubble bubble-assistant">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tool progress indicator — mostra o que o agente está a fazer */}
        {currentTool && currentTool.status === 'running' && (
          <div className="tool-progress-indicator">
            <span className="tool-progress-spinner" />
            <span className="tool-progress-label">
              {currentTool.emoji} {currentTool.label}
            </span>
          </div>
        )}

        <div className="chat-scroll-anchor" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button className="scroll-to-bottom" onClick={scrollToBottom} title="Scroll to bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  )
}
