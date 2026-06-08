import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import ModelSelector from './ModelSelector'
import SlashCommandsPopup from './SlashCommandsPopup'
import MentionSuggestions from './MentionSuggestions'

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

const DEFAULT_MODELS = ['deepseek-v4-flash']

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
  model = 'deepseek-v4-flash',
  onModelChange,
  models = DEFAULT_MODELS,
  characterLimit = 4000,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSlashCommands, setShowSlashCommands] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [activeSlashIdx, setActiveSlashIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    if (showSlashCommands) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSlashIdx(prev => (prev + 1) % slashCommands.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSlashIdx(prev => (prev - 1 + slashCommands.length) % slashCommands.length); return }
      if (e.key === 'Enter') { e.preventDefault(); onChange(slashCommands[activeSlashIdx].cmd + ' '); setShowSlashCommands(false); return }
      if (e.key === 'Escape') { setShowSlashCommands(false); return }
    }

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); onSetActiveSuggestionIdx?.((activeSuggestionIdx + 1) % suggestions.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); onSetActiveSuggestionIdx?.((activeSuggestionIdx - 1 + suggestions.length) % suggestions.length); return }
      if (e.key === 'Enter') { e.preventDefault(); onSelectSuggestion?.(suggestions[activeSuggestionIdx]); return }
      if (e.key === 'Escape') { e.preventDefault(); onShowSuggestions?.(false); return }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  const charCount = value.length
  const isOverLimit = charCount > characterLimit

  return (
    <div className="chat-input-container" ref={containerRef}>
      <div className="chat-input-box">
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

        <div className="chat-input-footer">
          {/* Model selector — tiny subtle pill */}
          {onModelChange && (
            <ModelSelector
              model={model}
              models={models}
              onModelChange={onModelChange}
              showDropdown={showModelDropdown}
              onToggleDropdown={() => setShowModelDropdown(!showModelDropdown)}
              onCloseDropdown={() => setShowModelDropdown(false)}
            />
          )}

          {/* Character count */}
          {charCount > characterLimit * 0.8 && (
            <span className={`char-count ${isOverLimit ? 'over' : ''}`}>
              {charCount}/{characterLimit}
            </span>
          )}

          {/* Send / Stop button */}
          <div className="chat-input-buttons">
            {isStreaming ? (
              <button className="send-btn stop" onClick={onStop} title="Stop generating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                className={`send-btn ${value.trim() ? 'visible' : ''}`}
                onClick={onSend}
                disabled={!value.trim() || disabled}
                title="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slash commands popup */}
      {showSlashCommands && (
        <SlashCommandsPopup
          commands={slashCommands}
          activeIdx={activeSlashIdx}
          onSelect={(cmd) => { onChange(cmd + ' '); setShowSlashCommands(false) }}
        />
      )}

      {/* @mention suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <MentionSuggestions
          suggestions={suggestions}
          activeIdx={activeSuggestionIdx}
          onSelect={(name) => onSelectSuggestion?.(name)}
        />
      )}
    </div>
  )
}
