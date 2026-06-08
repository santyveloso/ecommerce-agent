import { useState, useCallback, useEffect } from 'react'
import { API } from './constants'

export function useAutomationsState(activeTab: string) {
  const [automations, setAutomations] = useState<any[]>([])
  const [automationsLoading, setAutomationsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAutoName, setNewAutoName] = useState('')
  const [newAutoSchedule, setNewAutoSchedule] = useState('')
  const [newAutoPrompt, setNewAutoPrompt] = useState('')
  const [newAutoSkills, setNewAutoSkills] = useState('')
  const [newAutoDeliver, setNewAutoDeliver] = useState('local')
  const [creating, setCreating] = useState(false)
  const [autoActionLoading, setAutoActionLoading] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAutomations() {
      setAutomationsLoading(true)
      try {
        const res = await fetch(`${API}/automations`)
        if (res.ok) {
          const data = await res.json()
          setAutomations(data.automations || [])
        }
      } catch (err) { console.error('Automations fetch error', err) }
      finally { setAutomationsLoading(false) }
    }
    if (activeTab === 'automations') fetchAutomations()
  }, [activeTab])

  const pauseAutomation = async (id: string) => {
    try {
      const res = await fetch(`${API}/automations/${id}/pause`, { method: 'POST' })
      if (res.ok) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' } : a))
      }
    } catch (err) { console.error('Pause error', err) }
  }

  const resumeAutomation = async (id: string) => {
    try {
      const res = await fetch(`${API}/automations/${id}/resume`, { method: 'POST' })
      if (res.ok) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: 'active' } : a))
      }
    } catch (err) { console.error('Resume error', err) }
  }

  const deleteAutomation = async (id: string) => {
    setAutoActionLoading(id)
    try {
      const res = await fetch(`${API}/automations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id))
      }
    } catch (err) { console.error('Delete error', err) }
    finally { setAutoActionLoading(null) }
  }

  const runAutomationNow = async (id: string) => {
    setAutoActionLoading(id)
    try {
      await fetch(`${API}/automations/${id}/run`, { method: 'POST' })
      setAutoActionLoading(null)
    } catch (err) { console.error('Run error', err) }
    finally { setAutoActionLoading(null) }
  }

  const createAutomation = async () => {
    if (!newAutoName.trim() || !newAutoSchedule.trim() || !newAutoPrompt.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAutoName.trim(),
          schedule: newAutoSchedule.trim(),
          prompt: newAutoPrompt.trim(),
          skills: newAutoSkills.trim(),
          deliver: newAutoDeliver,
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewAutoName('')
        setNewAutoSchedule('')
        setNewAutoPrompt('')
        setNewAutoSkills('')
        const r = await fetch(`${API}/automations`)
        if (r.ok) setAutomations((await r.json()).automations || [])
      }
    } catch (err) { console.error('Create error', err) }
    finally { setCreating(false) }
  }

  return {
    automations, setAutomations,
    automationsLoading,
    showCreateModal, setShowCreateModal,
    newAutoName, setNewAutoName,
    newAutoSchedule, setNewAutoSchedule,
    newAutoPrompt, setNewAutoPrompt,
    newAutoSkills, setNewAutoSkills,
    newAutoDeliver, setNewAutoDeliver,
    creating,
    autoActionLoading,
    expandedJobId, setExpandedJobId,
    pauseAutomation, resumeAutomation,
    deleteAutomation, runAutomationNow,
    createAutomation,
  }
}
