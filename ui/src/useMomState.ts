import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from './api'

export interface MomMessage {
  id: number
  text: string
  from: 'santy' | 'mom'
  created_at: string
}

export function useMomState(activeTab: string) {
  const [messages, setMessages] = useState<MomMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenIdRef = useRef(0)
  const isActiveRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = activeTab === 'mom'

  // Sync ref outside of render (avoids lint error on ref assignment during render)
  useEffect(() => {
    isActiveRef.current = isActive
  })

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/mom/messages?since=${lastSeenIdRef.current}`)
      if (!res.ok) return
      const data = await res.json()
      const newMsgs: MomMessage[] = data.messages || []
      if (newMsgs.length > 0) {
        const prevMaxId = lastSeenIdRef.current
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const merged = [...prev]
          for (const m of newMsgs) {
            if (!existingIds.has(m.id)) merged.push(m)
          }
          return merged.sort((a, b) => a.id - b.id)
        })
        const maxId = Math.max(...newMsgs.map(m => m.id))
        lastSeenIdRef.current = maxId

        // Count new "mom" messages if panel is not active
        if (!isActiveRef.current) {
          const newMomMsgs = newMsgs.filter(m => m.from === 'mom' && m.id > prevMaxId)
          if (newMomMsgs.length > 0) {
            newMomMsgs.forEach(m => {
              if (Notification.permission === 'granted') {
                const body = m.text.length > 80 ? m.text.slice(0, 80) + '…' : m.text
                new Notification('💬 Mãe', { body })
              }
            })
            setUnreadCount(prev => prev + newMomMsgs.length)
          }
        }
      }
    } catch {
      // Network error — will retry on next poll
    }
  }, [])

  // Reset unread when panel opens
  useEffect(() => {
    if (isActive) {
      lastSeenIdRef.current = 0
      fetchMessages().then(() => {
        setLoading(false)
        setUnreadCount(0)
      })
      // Poll every 10s
      const poll = () => {
        fetchMessages()
        pollTimerRef.current = setTimeout(poll, 10000)
      }
      pollTimerRef.current = setTimeout(poll, 10000)
      return () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      }
    } else {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [isActive, fetchMessages])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > 500) return false
    setSending(true)
    try {
      const res = await apiFetch('/api/mom/messages', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro ao enviar')
      }
      const msg: MomMessage = await res.json()
      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id)
        if (exists) return prev
        return [...prev, msg].sort((a, b) => a.id - b.id)
      })
      lastSeenIdRef.current = msg.id
      return true
    } catch (err) {
      console.error('Mom send error', err)
      return false
    } finally {
      setSending(false)
    }
  }, [])

  // Also poll when panel is inactive (for unread badge)
  useEffect(() => {
    if (isActive) return
    const poll = () => {
      fetchMessages()
      pollTimerRef.current = setTimeout(poll, 15000)
    }
    pollTimerRef.current = setTimeout(poll, 15000)
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [isActive, fetchMessages])

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
  }
}
