import { useState, useCallback } from 'react'

export function useStudioAutocomplete(uploads: { name?: string; filename?: string }[]) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [triggerIdx, setTriggerIdx] = useState(-1)
  const [activeIdx, setActiveIdx] = useState(0)

  const getName = (u: any): string => u.name || u.filename || ''

  const handleStudioInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, onInputChange: (val: string) => void) => {
      const val = e.target.value
      onInputChange(val)

      const cursorIdx = e.target.selectionStart || 0
      const textBeforeCursor = val.slice(0, cursorIdx)
      const lastAtIdx = textBeforeCursor.lastIndexOf('@')
      if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(' ')) {
        const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase()
        const filtered = uploads
          .map(getName)
          .filter(name => name.toLowerCase().includes(query))
        if (filtered.length > 0) {
          setSuggestions(filtered)
          setShowSuggestions(true)
          setTriggerIdx(lastAtIdx)
          setActiveIdx(0)
        } else { setShowSuggestions(false) }
      } else { setShowSuggestions(false) }
    },
    [uploads]
  )

  const insertStudioSuggestion = useCallback(
    (name: string, studioInput: string, onInputChange: (val: string) => void) => {
      const before = studioInput.slice(0, triggerIdx)
      const inputEl = document.getElementById('studio-input-el') as HTMLInputElement
      const cursorIdx = inputEl?.selectionStart || studioInput.length
      const after = studioInput.slice(cursorIdx)
      onInputChange(`${before}@${name} ${after}`)
      setShowSuggestions(false)
      setTimeout(() => {
        if (inputEl) {
          inputEl.focus()
          inputEl.setSelectionRange(before.length + name.length + 2, before.length + name.length + 2)
        }
      }, 10)
    },
    [triggerIdx]
  )

  const handleStudioInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, onInsert: (name: string) => void) => {
      if (showSuggestions) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(prev => (prev + 1) % suggestions.length) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(prev => (prev - 1 + suggestions.length) % suggestions.length) }
        else if (e.key === 'Enter') { e.preventDefault(); onInsert(suggestions[activeIdx]) }
        else if (e.key === 'Escape') { e.preventDefault(); setShowSuggestions(false) }
      }
    },
    [showSuggestions, suggestions, activeIdx]
  )

  return {
    studioSuggestions: suggestions,
    studioShowSuggestions: showSuggestions,
    studioSuggestionTriggerIdx: triggerIdx,
    studioActiveSuggestionIdx: activeIdx,
    onShowSuggestionsChange: setShowSuggestions,
    onSetSuggestions: setSuggestions,
    onSetTriggerIdx: setTriggerIdx,
    onSetActiveSuggestionIdx: setActiveIdx,
    handleStudioInputChange,
    insertStudioSuggestion,
    handleStudioInputKeyDown,
  }
}
