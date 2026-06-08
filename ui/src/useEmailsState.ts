import { useState, useEffect } from 'react'
import { API } from './constants'

export function useEmailsState(activeTab: string) {
  const [emails, setEmails] = useState<any[]>([])
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [emailThread, setEmailThread] = useState<any[] | null>(null)
  const [emailThreadLoading, setEmailThreadLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmails() {
      setEmailsLoading(true)
      try {
        const res = await fetch(`${API}/zoho/emails`)
        if (res.ok) {
          const data = await res.json()
          setEmails(data.emails || [])
        }
      } catch (err) { console.error('Emails fetch error', err) }
      finally { setEmailsLoading(false) }
    }
    if (activeTab === 'emails') fetchEmails()
  }, [activeTab])

  const viewEmail = async (id: string) => {
    setEmailDetailLoading(true)
    setSelectedEmail(null)
    setEmailThread(null)
    setEmailThreadLoading(true)
    try {
      const res = await fetch(`${API}/zoho/emails/${id}/thread`)
      if (res.ok) {
        const data = await res.json()
        setEmailThread(data.messages || [])
      }
    } catch (err) { console.error('Email thread error', err) }
    finally {
      setEmailDetailLoading(false)
      setEmailThreadLoading(false)
    }
  }

  const viewThread = async (id: string) => {
    setEmailThreadLoading(true)
    setEmailThread(null)
    try {
      const res = await fetch(`${API}/zoho/emails/${id}/thread`)
      if (res.ok) {
        const data = await res.json()
        setEmailThread(data.messages || [])
      }
    } catch (err) { console.error('Email thread error', err) }
    finally { setEmailThreadLoading(false) }
  }

  const ignoreEmail = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API}/zoho/emails/${id}/read`, { method: 'POST' })
      setEmails(prev => prev.filter(e => e.id !== id))
      if (selectedEmail?.id === id) setSelectedEmail(null)
      if (emailThread?.[0]?.id === id) setEmailThread(null)
    } catch (err) { console.error('Ignore error', err) }
    finally { setActionLoading(null) }
  }

  const archiveEmail = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API}/zoho/emails/${id}/archive`, { method: 'POST' })
      setEmails(prev => prev.filter(e => e.id !== id))
      if (selectedEmail?.id === id) setSelectedEmail(null)
      if (emailThread?.[0]?.id === id) setEmailThread(null)
    } catch (err) { console.error('Archive error', err) }
    finally { setActionLoading(null) }
  }

  const refreshEmails = async () => {
    setSelectedEmail(null)
    setEmailThread(null)
    setEmailsLoading(true)
    try {
      const res = await fetch(`${API}/zoho/emails`)
      if (res.ok) { const data = await res.json(); setEmails(data.emails || []) }
    } catch {}
    finally { setEmailsLoading(false) }
  }

  const backToList = () => {
    setSelectedEmail(null)
    setEmailThread(null)
  }

  return {
    emails, setEmails,
    emailsLoading,
    selectedEmail, setSelectedEmail,
    emailDetailLoading,
    emailThread, setEmailThread,
    emailThreadLoading,
    actionLoading,
    viewEmail, viewThread,
    ignoreEmail, archiveEmail,
    refreshEmails, backToList,
  }
}
