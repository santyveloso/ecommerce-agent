/* ── Shared Types ────────────────────────────── */

export interface Order {
  name: string; total: string; status: string; customer: string; date: string
  financial_status?: string; fulfillment_status?: string; created_at?: string
  items?: Array<{title: string; qty: number; price?: string}>
}
export interface DashboardData {
  storeName: string; currency: string; products: number; lowStock: number
  ordersToday: number; revenueToday: string; pendingApprovals: number
  recentOrders: Order[]
  roas?: number; spend?: number; orders?: number; revenue?: number
}
export interface Message {
  role: 'user' | 'assistant'
  content: string
  approvalRequired?: boolean
  approval?: {
    id: string
    intent: string
    summary: string
    status: 'pending' | 'approved' | 'rejected'
  }
  media?: {
    url: string
    type: 'video' | 'image'
    prompt?: string
    name?: string
  }
  timestamp?: string
}
export interface Folder {
  id: string
  name: string
  expanded: boolean
  color?: string
}
export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  folderId?: string | null
  pinned?: boolean
  model?: string
}
