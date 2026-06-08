import { Icons } from './Icons'
import OrderDetailPanel from './OrderDetailPanel'
import type { Order } from './types'

interface OrdersPanelProps {
  orders: Order[]
  ordersLoading: boolean
  ordersSearch: string
  onOrdersSearchChange: (val: string) => void
  dateFrom: string
  onDateFromChange: (val: string) => void
  dateTo: string
  onDateToChange: (val: string) => void
  payFilter: string
  onPayFilterChange: (val: string) => void
  fulFilter: string
  onFulFilterChange: (val: string) => void
  selectedOrderName: string | null
  orderDetail: any | null
  orderDetailLoading: boolean
  onFetchOrders: () => Promise<void>
  onSelectOrder: (name: string) => void
  onCloseOrderPanel: () => void
  onTalkToHermes: (order: any) => void
}

export default function OrdersPanel({
  orders,
  ordersLoading,
  ordersSearch,
  onOrdersSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  payFilter,
  onPayFilterChange,
  fulFilter,
  onFulFilterChange,
  selectedOrderName,
  orderDetail,
  orderDetailLoading,
  onFetchOrders,
  onSelectOrder,
  onCloseOrderPanel,
  onTalkToHermes,
}: OrdersPanelProps) {
  const wordMatch = (text: string, q: string) => {
    if (!text || !q) return false
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?<![\\p{L}])${escaped}`, 'iu').test(text)
  }

  const filtered = orders.filter(o => {
    const q = ordersSearch.toLowerCase().trim()
    if (q) {
      const nameOk = q.length >= 4 ? o.name?.toLowerCase().includes(q) : false
      const custOk = wordMatch(o.customer, q)
      const itemsOk = o.items?.some((i: any) => wordMatch(i.title, q))
      if (!(nameOk || custOk || itemsOk)) return false
    }
    if (payFilter && o.financial_status !== payFilter) return false
    if (fulFilter && o.fulfillment_status !== fulFilter) return false
    if (dateFrom && o.created_at && o.created_at < dateFrom) return false
    if (dateTo && o.created_at) {
      const end = new Date(dateTo)
      end.setDate(end.getDate() + 1)
      if (new Date(o.created_at) > end) return false
    }
    return true
  })

  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="topbar">
        <div>
          <h1 className="page-title">ORDERS</h1>
          <p className="greeting">Gerencie todos os pedidos da sua loja</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedOrderName && (
            <button className="refresh-btn" onClick={onCloseOrderPanel}>{Icons.refresh} Fechar detalhes</button>
          )}
          <button className="refresh-btn" onClick={onFetchOrders}>{Icons.refresh} Atualizar</button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'end' }}>
        <input
          type="text" placeholder="Pesquisar por pedido, cliente ou produto..."
          value={ordersSearch} onChange={e => onOrdersSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>até</span>
          <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
        </div>
        <select value={payFilter} onChange={e => onPayFilterChange(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
          <option value="">Pagamento: Todos</option>
          <option value="PAID">Pago</option>
          <option value="PENDING">Pendente</option>
          <option value="REFUNDED">Reembolsado</option>
          <option value="VOIDED">Cancelado</option>
        </select>
        <select value={fulFilter} onChange={e => onFulFilterChange(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
          <option value="">Envio: Todos</option>
          <option value="FULFILLED">Entregue</option>
          <option value="UNFULFILLED">Por enviar</option>
          <option value="PARTIAL">Parcial</option>
        </select>
      </div>

      {ordersLoading ? (
        <div className="loading-screen"><div className="loader" /></div>
      ) : (
        <div className="orders-layout">
          {/* ── Table Section ── */}
          <div className="orders-table-section">
            <div className="section">
              <table className="table">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Items</th><th>Total</th><th>Pagamento</th><th>Envio</th><th>Data</th></tr></thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={i} onClick={() => onSelectOrder(o.name)}
                      style={{ background: selectedOrderName === o.name ? 'var(--accent-bg)' : undefined }}
                    >
                      <td><span className="order-name">{o.name}</span></td>
                      <td>{o.customer}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.items?.map((i: any) => `${i.qty}x ${i.title}`).join(', ') || '-'}
                      </td>
                      <td>{parseFloat(o.total).toFixed(2)}€</td>
                      <td><span className={`status-tag ${(o.financial_status || '').toLowerCase()}`}>{o.financial_status || '-'}</span></td>
                      <td><span className={`status-tag ${(o.fulfillment_status || '').toLowerCase()}`}>{o.fulfillment_status || '-'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('pt-PT') : '-'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Nenhum pedido encontrado com esses filtros</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Order Detail Panel ── */}
          {selectedOrderName && (
            <OrderDetailPanel
              orderDetail={orderDetail}
              loading={orderDetailLoading}
              orderName={selectedOrderName}
              onClose={onCloseOrderPanel}
              onTalkToHermes={onTalkToHermes}
            />
          )}
        </div>
      )}
    </div>
  )
}
