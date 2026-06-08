import { useState, useEffect, useCallback } from 'react'
import { uid } from './helpers'
import type { Folder, ChatSession } from './types'

export function useChatSessions(gatewayActiveModel: string) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('ec_chat_sessions')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{ id: 'default', title: 'Conversa Geral', messages: [], model: 'deepseek-v4-flash' }]
  })
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem('ec_active_session') || 'default'
  })
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('ec_chat_folders')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [sessionSearchQuery, setSessionSearchQuery] = useState('')
  const [chatEditingTitle, setChatEditingTitle] = useState<string | null>(null)

  // Persist
  useEffect(() => { localStorage.setItem('ec_chat_sessions', JSON.stringify(sessions)) }, [sessions])
  useEffect(() => { localStorage.setItem('ec_chat_folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem('ec_active_session', activeSessionId) }, [activeSessionId])

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

  // ── Session CRUD ────────────────────────────
  const createNewSession = useCallback(() => {
    const id = uid()
    const newSession: ChatSession = {
      id,
      title: 'Nova Conversa',
      messages: [],
      model: gatewayActiveModel || 'deepseek-v4-flash',
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(id)
    return id
  }, [gatewayActiveModel])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id)
      if (filtered.length === 0) {
        const newId = uid()
        const def: ChatSession = { id: newId, title: 'Conversa Geral', messages: [], model: gatewayActiveModel || 'deepseek-v4-flash' }
        setActiveSessionId(newId)
        return [def]
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id)
      }
      return filtered
    })
  }, [activeSessionId, gatewayActiveModel])

  const renameSession = useCallback((id: string, name: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: name } : s))
  }, [])

  const togglePin = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))
  }, [])

  // ── Folder CRUD ─────────────────────────────
  const newFolder = useCallback((name: string, color?: string) => {
    setFolders(prev => [...prev, { id: uid(), name, expanded: true, color }])
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id))
    setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s))
  }, [])

  const setFolderColor = useCallback((folderId: string, color: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, color } : f))
  }, [])

  const toggleFolder = useCallback((id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f))
  }, [])

  const moveSession = useCallback((sessionId: string, folderId: string | null) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, folderId } : s))
  }, [])

  return {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    folders,
    sessionSearchQuery, setSessionSearchQuery,
    chatEditingTitle, setChatEditingTitle,
    activeSession,
    createNewSession, deleteSession, renameSession, togglePin,
    newFolder, renameFolder, deleteFolder, setFolderColor, toggleFolder, moveSession,
  }
}
