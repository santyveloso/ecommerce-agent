interface ModelSelectorProps {
  model: string
  models: string[]
  onModelChange: (model: string) => void
  showDropdown: boolean
  onToggleDropdown: () => void
  onCloseDropdown: () => void
}

export default function ModelSelector({
  model,
  models,
  onModelChange,
  showDropdown,
  onToggleDropdown,
  onCloseDropdown,
}: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <button
        className="model-selector-btn"
        onClick={onToggleDropdown}
        title="Change model"
      >
        <span>{model}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {showDropdown && (
        <div className="model-dropdown">
          {models.map(m => (
            <button
              key={m}
              className={`model-dropdown-item ${m === model ? 'active' : ''}`}
              onClick={() => { onModelChange(m); onCloseDropdown() }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
