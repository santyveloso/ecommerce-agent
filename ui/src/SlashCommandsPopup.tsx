interface SlashCommand {
  cmd: string
  desc: string
}

interface SlashCommandsPopupProps {
  commands: SlashCommand[]
  activeIdx: number
  onSelect: (cmd: string) => void
}

export default function SlashCommandsPopup({ commands, activeIdx, onSelect }: SlashCommandsPopupProps) {
  return (
    <div className="slash-popup">
      {commands.map((cmd, i) => (
        <button
          key={cmd.cmd}
          className={`slash-item ${i === activeIdx ? 'active' : ''}`}
          onClick={() => onSelect(cmd.cmd)}
        >
          <code>{cmd.cmd}</code>
          <span>{cmd.desc}</span>
        </button>
      ))}
    </div>
  )
}
