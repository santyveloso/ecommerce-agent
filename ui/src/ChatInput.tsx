import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  isStreaming: boolean
  onStop: () => void
  placeholder?: string
  disabled?: boolean
  uploads?: Array<{ name: string; filename: string; url: string }>
  showSuggestions?: boolean
  suggestions?: string[]
  suggestionTriggerIdx?: number
  activeSuggestionIdx?: number
  onShowSuggestions?: (show: boolean) => void
  onSelectSuggestion?: (name: string) => void
  onSetSuggestions?: (s: string[]) => void
  onSetTriggerIdx?: (i: number) => void
  onSetActiveSuggestionIdx?: (i: number) => void
  model?: string
  onModelChange?: (model: string) => void
  models?: string[]
  characterLimit?: number
}

const DEFAULT_MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022']

export default function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  onStop,
  placeholder = 'Ask anything about your store...',
  disabled = false,
  uploads = [],
  showSuggestions = false,
  suggestions = [],
  suggestionTriggerIdx: _suggestionTriggerIdx = -1,
  activeSuggestionIdx = 0,
  onShowSuggestions,
  onSelectSuggestion,
  onSetSuggestions,
  onSetTriggerIdx,
  onSetActiveSuggestionIdx,
  model = 'gpt-4o',
  onModelChange,
  models = DEFAULT_MODELS,
  characterLimit = 4000,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [activeSlashIdx, setActiveSlashIdx] = useState(0)
  const textareaOuterRef = useRef<HTMLDivElement>(null)

  const slashCommands = [
    { cmd: '/help', desc: 'Show available commands' },
    { cmd: '/clear', desc: 'Clear current conversation' },
  ]

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [value])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (textareaOuterRef.current && !textareaOuterRef.current.contains(e.target as Node)) {
        setShowSlashCommands(false)
        setShowModelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    onChange(val)

    const cursorIdx = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursorIdx)

    // @mention autocomplete
    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(' ')) {
      const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase()
      const filtered = uploads
        .map(u => u.name)
        .filter(name => name.toLowerCase().includes(query))
      if (filtered.length > 0) {
        onShowSuggestions?.(true)
        onSetSuggestions?.(filtered)
        onSetTriggerIdx?.(lastAtIdx)
        onSetActiveSuggestionIdx?.(0)
      } else {
        onShowSuggestions?.(false)
      }
    } else {
      onShowSuggestions?.(false)
    }

    // Slash command detection
    if (textBeforeCursor === '/' || (textBeforeCursor.startsWith('/') && !textBeforeCursor.includes(' '))) {
      setShowSlashCommands(true)
    } else {
      setShowSlashCommands(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash command navigation
    if (showSlashCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSlashIdx(prev => (prev + 1) % slashCommands.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSlashIdx(prev => (prev - 1 + slashCommands.length) % slashCommands.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = slashCommands[activeSlashIdx]
        onChange(cmd.cmd + ' ')
        setShowSlashCommands(false)
        return
      }
      if (e.key === 'Escape') {
        setShowSlashCommands(false)
        return
      }
    }

    // @mention navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onSetActiveSuggestionIdx?.((activeSuggestionIdx + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onSetActiveSuggestionIdx?.((activeSuggestionIdx - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        onSelectSuggestion?.(suggestions[activeSuggestionIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onShowSuggestions?.(false)
        return
      }
    }

    // Send on Enter, newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  const handleSend = () => {
    // Handle slash commands
    if (value.trim() === '/clear') {
      // The parent will handle this via onSend
    }
    if (value.trim() === '/help') {
      // The parent will handle this via onSend
    }
    if (value.trim()) {
      onSend()
    }
  }

  const charCount = value.length
  const isOverLimit = charCount > characterLimit

  return (
    <div className="chat-input-container" ref={textareaOuterRef}>
      {/* Model selector */}
      {onModelChange && (
        <div className="model-selector">
          <button
            className="model-selector-btn"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            title="Change model"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>{model}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showModelDropdown && (
            <div className="model-dropdown">
              {models.map(m => (
                <button
                  key={m}
                  className={`model-dropdown-item ${m === model ? 'active' : ''}`}
                  onClick={() => { onModelChange(m); setShowModelDropdown(false) }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Textarea area */}
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className={`chat-input ${isOverLimit ? 'over-limit' : ''}`}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        {/* Character count */}
        {charCount > characterLimit * 0.8 && (
          <span className={`char-count ${isOverLimit ? 'over' : ''}`}>
            {charCount}/{characterLimit}
          </span>
        )}
      </div>

      {/* Slash commands popup */}
      {showSlashCommands && (
        <div className="slash-popup">
          {slashCommands.map((cmd, i) => (
            <button
              key={cmd.cmd}
              className={`slash-item ${i === activeSlashIdx ? 'active' : ''}`}
              onClick={() => { onChange(cmd.cmd + ' '); setShowSlashCommands(false) }}
            >
              <code>{cmd.cmd}</code>
              <span>{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* @mention suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mention-popup">
          {suggestions.map((name, i) => (
            <button
              key={name}
              className={`mention-item ${i === activeSuggestionIdx ? 'active' : ''}`}
              onClick={() => onSelectSuggestion?.(name)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons row */}
      <div className="chat-input-actions">
        <div className="chat-input-hint">
          <kbd>Enter</kbd> send
          <span className="hint-sep">·</span>
          <kbd>Shift+Enter</kbd> newline
        </div>
        <div className="chat-input-buttons">
          {isStreaming ? (
            <button className="send-btn stop" onClick={onStop} title="Stop generating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className={`send-btn ${value.trim() ? 'visible' : ''}`}
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              title="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
