import { useState, useEffect, useCallback } from 'react'
import { uid } from './helpers'
import { API } from './constants'
import {
  processSlashCommand,
  createUserMessage,
  createAssistantMessage,
  shouldAutoTitle,
  deriveTitle,
  buildConversationContext,
  buildConversationContextFromIndex,
} from './chat-utils'
import { useChatStream, type ToolProgress } from './useChatStream'
import { useChatSessions } from './useChatSessions'
import type { Message } from './types'

export function useChatState(gatewayActiveModel: string) {
  const {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    folders,
    sessionSearchQuery, setSessionSearchQuery,
    chatEditingTitle, setChatEditingTitle,
    activeSession,
    createNewSession: _createNewSession,
    deleteSession, renameSession, togglePin,
    newFolder, renameFolder, deleteFolder, setFolderColor, toggleFolder, moveSession,
  } = useChatSessions(gatewayActiveModel)

  const [chatInputValue, setChatInputValue] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // @mention state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionTriggerIdx, setSuggestionTriggerIdx] = useState(-1)
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0)

  // ── SSE Streaming hook ────────────────────────
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreamingDone, setIsStreamingDone] = useState(false)
  const [currentTool, setCurrentTool] = useState<ToolProgress | null>(null)

  const { isStreaming, error: streamError, stop: stopStreaming, stream: startStream } = useChatStream({
    onToken: (token) => {
      setStreamingContent(prev => prev + token)
    },
    onDone: (fullContent) => {
      setStreamingContent(fullContent)
      setIsStreamingDone(true)
      setCurrentTool(null)
    },
    onError: (err) => {
      console.error('Stream error:', err)
      setCurrentTool(null)
    },
    onToolProgress: (progress) => {
      if (progress.status === 'completed') {
        setCurrentTool(null)
      } else {
        setCurrentTool(progress)
      }
    }
  })

  // Wrap createNewSession to also clear input
  const createNewSession = useCallback(() => {
    _createNewSession()
    setChatInputValue('')
    setShowSuggestions(false)
  }, [_createNewSession])

  // ── Chat Operations ────────────────────────────
  const handleSendMessage = useCallback(async (content?: string) => {
    const msg = content || chatInputValue.trim()
    if (!msg || isStreaming) return

    if (processSlashCommand(msg, activeSessionId, setSessions, setChatInputValue)) return

    const shouldRenameTitle = shouldAutoTitle(activeSession)

    const userMsg = createUserMessage(msg)
    const assistantMsgId = uid()
    const assistantMsg = createAssistantMessage()

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      const newMessages = [...s.messages, userMsg, { ...assistantMsg, id: assistantMsgId } as any]
      return {
        ...s,
        messages: newMessages,
        title: shouldRenameTitle ? deriveTitle(msg) : s.title,
      }
    }))

    setChatInputValue('')
    setShowSuggestions(false)
    setStreamingContent('')
    setIsStreamingDone(false)

    const conversationMessages = buildConversationContext(activeSession.messages, msg)
    const model = activeSession.model || gatewayActiveModel || 'deepseek-v4-flash'

    try {
      await startStream(conversationMessages, model)
    } catch {
      try {
        const res = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversationMessages, model }),
        })
        if (res.ok) {
          const data = await res.json()
          const reply = data.reply || data.message || data.content || 'Sem resposta.'
          setSessions(prev => prev.map(s =>
            s.id === activeSessionId ? {
              ...s,
              messages: s.messages.map((m, i) =>
                i === s.messages.length - 1 && m.role === 'assistant'
                  ? { ...m, content: reply }
                  : m
              ),
            } : s
          ))
        }
      } catch (err) {
        console.error('Chat error:', err)
      }
    }
  }, [chatInputValue, isStreaming, activeSessionId, activeSession, startStream, gatewayActiveModel, setSessions])

  // When stream finishes, commit content to session
  useEffect(() => {
    if (isStreamingDone && streamingContent) {
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s
        const lastIdx = s.messages.length - 1
        const lastMsg = s.messages[lastIdx]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          const updated = [...s.messages]
          updated[lastIdx] = { ...lastMsg, content: streamingContent }
          return { ...s, messages: updated }
        }
        return s
      }))
      setIsStreamingDone(false)
      setStreamingContent('')
    }
  }, [isStreamingDone, streamingContent, activeSessionId, setSessions])

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopiedMessageId('msg-copied')
    setTimeout(() => setCopiedMessageId(null), 2000)
  }, [])

  const handleEditMessage = useCallback((index: number, newContent: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      const truncated = s.messages.slice(0, index)
      const editedUserMsg: Message = { ...s.messages[index], content: newContent }
      return { ...s, messages: [...truncated, editedUserMsg] }
    }))

    const conversationMessages = buildConversationContextFromIndex(activeSession.messages, index, newContent)

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [...s.messages.slice(0, index), s.messages[index], assistantMsg] } : s
    ))

    startStream(conversationMessages, activeSession.model)
  }, [activeSessionId, activeSession, startStream, setSessions])

  const handleRegenerate = useCallback((index: number) => {
    let lastUserIdx = -1
    for (let i = index - 1; i >= 0; i--) {
      if (activeSession.messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const conversationMessages = buildConversationContextFromIndex(activeSession.messages, index)

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s
      const updated = [...s.messages]
      updated[index] = { ...updated[index], content: '' }
      return { ...s, messages: updated }
    }))

    startStream(conversationMessages, activeSession.model)
  }, [activeSessionId, activeSession, startStream, setSessions])

  const handleDeleteMessage = useCallback((index: number) => {
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: s.messages.filter((_, i) => i !== index) }
        : s
    ))
  }, [activeSessionId, setSessions])

  const handleChatInputChange = useCallback((val: string) => {
    setChatInputValue(val)
    const textBeforeCursor = val

    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(' ')) {
      // mention handling — query available but uploads list is in parent
    } else {
      setShowSuggestions(false)
    }
  }, [])

  const insertSuggestion = useCallback((name: string) => {
    const before = chatInputValue.slice(0, suggestionTriggerIdx)
    const after = chatInputValue.slice(chatInputValue.length)
    setChatInputValue(`${before}@${name} ${after}`)
    setShowSuggestions(false)
  }, [chatInputValue, suggestionTriggerIdx])

  return {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    folders,
    sessionSearchQuery, setSessionSearchQuery,
    chatInputValue, setChatInputValue,
    chatEditingTitle, setChatEditingTitle,
    copiedMessageId,
    showSuggestions, setShowSuggestions,
    suggestions, setSuggestions,
    suggestionTriggerIdx, setSuggestionTriggerIdx,
    activeSuggestionIdx, setActiveSuggestionIdx,
    isStreaming, streamError, stopStreaming,
    streamingContent, currentTool,
    activeSession,
    createNewSession, deleteSession, renameSession, togglePin,
    newFolder, renameFolder, deleteFolder, setFolderColor, toggleFolder, moveSession,
    handleSendMessage, handleCopyMessage, handleEditMessage, handleRegenerate, handleDeleteMessage,
    handleChatInputChange, insertSuggestion,
  }
}
