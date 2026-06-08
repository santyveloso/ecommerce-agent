interface MentionSuggestionsProps {
  suggestions: string[]
  activeIdx: number
  onSelect: (name: string) => void
}

export default function MentionSuggestions({ suggestions, activeIdx, onSelect }: MentionSuggestionsProps) {
  return (
    <div className="mention-popup">
      {suggestions.map((name, i) => (
        <button
          key={name}
          className={`mention-item ${i === activeIdx ? 'active' : ''}`}
          onClick={() => onSelect(name)}
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
  )
}
