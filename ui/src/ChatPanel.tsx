import SessionSidebar from './SessionSidebar'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import type { ToolProgress } from './useChatStream'
import type { ChatSession, Folder } from './types'

interface GeneratedImage {
  id: string; prompt: string; url: string; timestamp: string
}

interface ChatPanelProps {
  sessions: ChatSession[]
  activeSessionId: string
  folders: Folder[]
  sessionSearchQuery: string
  onSessionSearchChange: (q: string) => void
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, name: string) => void
  onTogglePin: (id: string) => void
  onNewFolder: (name: string, color?: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onSetFolderColor: (folderId: string, color: string) => void
  onToggleFolder: (id: string) => void
  onMoveSession: (sessionId: string, folderId: string | null) => void
  chatEditingTitle: string | null
  onChatEditingTitleChange: (val: string | null) => void
  isStreaming: boolean
  streamError: string | null
  activeSession: ChatSession
  streamingContent: string
  currentTool: ToolProgress | null
  onCopyMessage: (content: string) => void
  copiedMessageId: string | null
  onEditMessage: (index: number, newContent: string) => void
  onRegenerate: (index: number) => void
  onDeleteMessage: (index: number) => void
  chatInputValue: string
  onChatInputChange: (val: string) => void
  onSendMessage: (content?: string) => Promise<void>
  onStopStreaming: () => void
  showSuggestions: boolean
  suggestions: string[]
  suggestionTriggerIdx: number
  activeSuggestionIdx: number
  onShowSuggestionsChange: (show: boolean) => void
  onInsertSuggestion: (name: string) => void
  onSetSuggestions: (s: string[]) => void
  onSetTriggerIdx: (idx: number) => void
  onSetActiveSuggestionIdx: (idx: number) => void
  studioUploads: GeneratedImage[]
  gatewayActiveModel: string
  availableModels: string[]
  onActiveModelChange: (model: string) => void
  dashboardStoreName?: string
  onSessionsUpdate: (fn: (prev: ChatSession[]) => ChatSession[]) => void
  onGatewayActiveModelChange: (model: string) => void
}

export default function ChatPanel({
  sessions,
  activeSessionId,
  folders,
  sessionSearchQuery,
  onSessionSearchChange,
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
  chatEditingTitle,
  onChatEditingTitleChange,
  isStreaming,
  streamError,
  activeSession,
  streamingContent,
  currentTool,
  onCopyMessage,
  copiedMessageId,
  onEditMessage,
  onRegenerate,
  onDeleteMessage,
  chatInputValue,
  onChatInputChange,
  onSendMessage,
  onStopStreaming,
  showSuggestions,
  suggestions,
  suggestionTriggerIdx,
  activeSuggestionIdx,
  onShowSuggestionsChange,
  onInsertSuggestion,
  onSetSuggestions,
  onSetTriggerIdx,
  onSetActiveSuggestionIdx,
  studioUploads,
  gatewayActiveModel,
  availableModels,
  onActiveModelChange,
  dashboardStoreName,
  onSessionsUpdate,
  onGatewayActiveModelChange,
}: ChatPanelProps) {
  return (
    <div className="chat-layout" style={{ display: 'flex', height: '100vh' }}>
      {/* Chat Session Sidebar */}
      <div className="chat-session-sidebar" style={{
        width: 220,
        borderRight: '1px solid var(--surface-border)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        flexShrink: 0,
      }}>
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          folders={folders}
          searchQuery={sessionSearchQuery}
          onSearchChange={onSessionSearchChange}
          onSelectSession={onSelectSession}
          onNewSession={onNewSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onTogglePin={onTogglePin}
          onNewFolder={onNewFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onSetFolderColor={onSetFolderColor}
          onToggleFolder={onToggleFolder}
          onMoveSession={onMoveSession}
        />
      </div>

      {/* Chat Pane */}
      <div className="chat-pane">
        {/* Chat header */}
        <div className="chat-header">
          <div className="chat-header-left">
            {chatEditingTitle ? (
              <input
                className="chat-header-title-input"
                value={chatEditingTitle}
                onChange={e => onChatEditingTitleChange(e.target.value)}
                onBlur={() => {
                  if (chatEditingTitle.trim() && activeSession) {
                    onRenameSession(activeSession.id, chatEditingTitle.trim())
                  }
                  onChatEditingTitleChange(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur()
                  }
                  if (e.key === 'Escape') onChatEditingTitleChange(null)
                }}
                autoFocus
              />
            ) : (
              <span
                className="chat-header-title"
                onClick={() => activeSession && onChatEditingTitleChange(activeSession.title)}
              >
                {activeSession?.title || 'Chat'}
              </span>
            )}
            {isStreaming && (
              <span className="chat-header-streaming">
                <span className="streaming-dot" />
                Streaming...
              </span>
            )}
            {streamError && (
              <span className="chat-header-error">{streamError}</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <ChatMessages
          messages={activeSession?.messages || []}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          currentTool={currentTool}
          onCopy={onCopyMessage}
          copiedMessageId={copiedMessageId}
          onEdit={onEditMessage}
          onRegenerate={onRegenerate}
          onDelete={onDeleteMessage}
          onNewChat={onNewSession}
          emptyStateTitle={`What should we work on today${dashboardStoreName ? ` in ${dashboardStoreName}` : ''}?`}
          emptyStateSubtitle=""
        />

        {/* Input */}
        <ChatInput
          value={chatInputValue}
          onChange={onChatInputChange}
          onSend={() => onSendMessage()}
          isStreaming={isStreaming}
          onStop={onStopStreaming}
          placeholder="Pergunte sobre a sua loja..."
          uploads={studioUploads}
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          suggestionTriggerIdx={suggestionTriggerIdx}
          activeSuggestionIdx={activeSuggestionIdx}
          onShowSuggestions={onShowSuggestionsChange}
          onSelectSuggestion={onInsertSuggestion}
          onSetSuggestions={onSetSuggestions}
          onSetTriggerIdx={onSetTriggerIdx}
          onSetActiveSuggestionIdx={onSetActiveSuggestionIdx}
          model={activeSession?.model || gatewayActiveModel}
          onModelChange={(model) => {
            onSessionsUpdate(prev => prev.map(s =>
              s.id === activeSessionId ? { ...s, model } : s
            ))
            onGatewayActiveModelChange(model)
          }}
          models={availableModels}
        />
      </div>
    </div>
  )
}
