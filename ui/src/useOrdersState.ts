import { useState, useCallback, useEffect } from 'react'
import { API } from './constants'
import type { Order } from './types'

export function useOrdersState(activeTab: string, setChatInputValue: (v: string) => void, setActiveTab: (t: string) => void) {
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [fulFilter, setFulFilter] = useState('')

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await fetch(`${API}/orders`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) { console.error('Orders fetch error', err) }
    finally { setOrdersLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [activeTab])

  const [selectedOrderName, setSelectedOrderName] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<any | null>(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)

  const fetchOrderDetail = useCallback(async (orderName: string) => {
    setOrderDetailLoading(true)
    setOrderDetail(null)
    try {
      const res = await fetch(`${API}/orders/${encodeURIComponent(orderName)}`)
      if (res.ok) {
        const data = await res.json()
        setOrderDetail(data.order || data)
      }
    } catch (err) { console.error('Order detail error', err) }
    finally { setOrderDetailLoading(false) }
  }, [])

  const closeOrderPanel = useCallback(() => {
    setSelectedOrderName(null)
    setOrderDetail(null)
  }, [])

  const talkToHermes = useCallback((order: any) => {
    const itemsText = (order.items || [])
      .map((i: any) => `- ${i.qty}x ${i.title}${i.sku ? ` (${i.sku})` : ''}${i.price ? ` — ${i.price}${order.currency || '€'}` : ''}`)
      .join('\n')
    const contextMsg = `📋 **${order.name}**\nCliente: ${order.customer}\nEmail: ${order.email}\nTotal: ${order.total}${order.currency || '€'}\nEstado: ${order.status}\nEnvio: ${order.fulfillment}\nMorada: ${order.address}\n\n**Items:**\n${itemsText || '-'}`

    setChatInputValue(contextMsg)
    setActiveTab('chat')
  }, [setChatInputValue, setActiveTab])

  return {
    orders, setOrders,
    ordersLoading,
    ordersSearch, setOrdersSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    payFilter, setPayFilter,
    fulFilter, setFulFilter,
    fetchOrders,
    selectedOrderName, setSelectedOrderName,
    orderDetail, setOrderDetail,
    orderDetailLoading,
    fetchOrderDetail,
    closeOrderPanel,
    talkToHermes,
  }
}
