import { useState, useCallback, useEffect } from 'react'
import { API } from './constants'

export function useMemoryState(activeTab: string) {
  const [memoryEntries, setMemoryEntries] = useState<any[]>([])
  const [memoryLoading, setMemoryLoading] = useState(true)
  const [newMemory, setNewMemory] = useState('')

  useEffect(() => {
    async function fetchMemory() {
      setMemoryLoading(true)
      try {
        const res = await fetch(`${API}/memory/files`)
        if (res.ok) {
          const data = await res.json()
          setMemoryEntries(data.files || data.entries || data.memories || [])
        }
      } catch (err) { console.error('Memory fetch error', err) }
      finally { setMemoryLoading(false) }
    }
    if (activeTab === 'memory') fetchMemory()
  }, [activeTab])

  const addMemory = async () => {
    if (!newMemory.trim()) return
    try {
      const res = await fetch(`${API}/memory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemory.trim() }),
      })
      if (res.ok) {
        setNewMemory('')
        const r = await fetch(`${API}/memory/files`)
        if (r.ok) { const d = await r.json(); setMemoryEntries(d.files || d.entries || d.memories || []) }
      }
    } catch (err) { console.error('Memory add error', err) }
  }

  const [selectedMemoryFile, setSelectedMemoryFile] = useState<any | null>(null)
  const [memoryFileContent, setMemoryFileContent] = useState('')
  const [memoryFileLoading, setMemoryFileLoading] = useState(false)
  const [memoryEditMode, setMemoryEditMode] = useState(false)
  const [memoryEditContent, setMemoryEditContent] = useState('')
  const [memorySaving, setMemorySaving] = useState(false)

  const loadMemoryFile = useCallback(async (file: any) => {
    setSelectedMemoryFile(file)
    setMemoryFileLoading(true)
    setMemoryEditMode(false)
    try {
      const ghostPrefix = '/Users/santiagoveloso/ghost/'
      const relativePath = file.path.startsWith(ghostPrefix)
        ? file.path.slice(ghostPrefix.length)
        : file.path
      const res = await fetch(`${API}/memory/read?path=${encodeURIComponent(relativePath)}`)
      if (res.ok) {
        const data = await res.json()
        setMemoryFileContent(data.content || '')
        setMemoryEditContent(data.content || '')
      } else {
        setMemoryFileContent('*Erro ao carregar o ficheiro.*')
        setMemoryEditContent('')
      }
    } catch (err) {
      console.error('Memory read error', err)
      setMemoryFileContent('*Erro ao carregar o ficheiro.*')
    } finally {
      setMemoryFileLoading(false)
    }
  }, [])

  const saveMemoryFile = useCallback(async () => {
    if (!selectedMemoryFile) return
    setMemorySaving(true)
    try {
      const res = await fetch(`${API}/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedMemoryFile.path, content: memoryEditContent }),
      })
      if (res.ok) {
        setMemoryFileContent(memoryEditContent)
        setMemoryEditMode(false)
      }
    } catch (err) {
      console.error('Memory save error', err)
    } finally {
      setMemorySaving(false)
    }
  }, [selectedMemoryFile, memoryEditContent])

  return {
    memoryEntries, setMemoryEntries,
    memoryLoading,
    newMemory, setNewMemory,
    addMemory,
    selectedMemoryFile, setSelectedMemoryFile,
    memoryFileContent,
    memoryFileLoading,
    memoryEditMode, setMemoryEditMode,
    memoryEditContent, setMemoryEditContent,
    memorySaving,
    loadMemoryFile, saveMemoryFile,
  }
}
