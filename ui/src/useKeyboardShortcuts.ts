import { useEffect } from 'react'

export function useKeyboardShortcuts(
  createNewSession: () => void,
  isStreaming: boolean,
  stopStreaming: () => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+K: new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        createNewSession()
      }
      // Escape: stop streaming
      if (e.key === 'Escape' && isStreaming) {
        stopStreaming()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createNewSession, isStreaming, stopStreaming])
}
