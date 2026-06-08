import { useState, useEffect } from 'react'
import { uid } from './helpers'
import { DEFAULT_LINKS } from './links-data'

export function useLinksState() {
  const [links, setLinks] = useState<{id: string; name: string; url: string}[]>(() => {
    try {
      const saved = localStorage.getItem('ec_links')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LINKS
        const defaultIds = new Set(DEFAULT_LINKS.map(d => d.id))
        const customLinks = parsed.filter((p: any) => !defaultIds.has(p.id))
        return [...DEFAULT_LINKS, ...customLinks]
      }
    } catch {}
    return DEFAULT_LINKS
  })
  const [showAddLink, setShowAddLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [shopifyUrl, setShopifyUrl] = useState(() => localStorage.getItem('ec_shopify_url') || '')

  useEffect(() => { localStorage.setItem('ec_links', JSON.stringify(links)) }, [links])
  useEffect(() => { localStorage.setItem('ec_shopify_url', shopifyUrl) }, [shopifyUrl])

  const displayLinks = links.map(l =>
    l.id === 'shopify' ? { ...l, url: shopifyUrl } : l
  )

  const addLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return
    setLinks(prev => [...prev, { id: uid(), name: newLinkName.trim(), url: newLinkUrl.trim() }])
    setNewLinkName('')
    setNewLinkUrl('')
    setShowAddLink(false)
  }

  const deleteLink = (id: string) => {
    if (id === 'shopify') { setShopifyUrl(''); return }
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return {
    links, setLinks,
    showAddLink, setShowAddLink,
    newLinkName, setNewLinkName,
    newLinkUrl, setNewLinkUrl,
    shopifyUrl, setShopifyUrl,
    displayLinks,
    addLink, deleteLink,
  }
}
