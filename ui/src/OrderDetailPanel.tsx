/* ── Order Detail Panel ──────────────────────── */
import { Icons } from './Icons'

interface Props {
  orderDetail: any
  loading: boolean
  orderName: string
  onClose: () => void
  onTalkToHermes: (order: any) => void
}

export default function OrderDetailPanel({
  orderDetail,
  loading,
  orderName,
  onClose,
  onTalkToHermes,
}: Props) {
  return (
    <div className="order-detail-panel">
      <div className="order-detail-header">
        <h3>{orderDetail?.name || orderName}</h3>
        <button className="quick-btn" onClick={onClose}
          style={{ width: 'auto', padding: '6px 10px', fontSize: 11 }}>
          ✕
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: 200 }}><div className="loader" /></div>
      ) : orderDetail ? (
        <>
          {/* Status */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <span className={`status-tag ${(orderDetail.status || '').toLowerCase()}`}>
              {orderDetail.status || '-'}
            </span>
            <span className={`status-tag ${(orderDetail.fulfillment || '').toLowerCase()}`}>
              {orderDetail.fulfillment || '-'}
            </span>
          </div>

          {/* Cliente */}
          <div className="order-detail-section">
            <div className="order-detail-label">Cliente</div>
            <div className="order-detail-value">{orderDetail.customer}</div>
            {orderDetail.email && (
              <div className="order-detail-value" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {orderDetail.email}
              </div>
            )}
            {orderDetail.phone && (
              <div className="order-detail-value" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {orderDetail.phone}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="order-detail-section">
            <div className="order-detail-label">Total</div>
            <div className="order-detail-value" style={{ fontSize: 16, fontWeight: 700 }}>
              {parseFloat(orderDetail.total).toFixed(2)}{orderDetail.currency || '€'}
            </div>
          </div>

          {/* Data */}
          <div className="order-detail-section">
            <div className="order-detail-label">Data</div>
            <div className="order-detail-value">
              {orderDetail.created_at ? new Date(orderDetail.created_at).toLocaleString('pt-PT') : '-'}
            </div>
          </div>

          {/* Morada */}
          {orderDetail.address && orderDetail.address !== 'N/A' && (
            <div className="order-detail-section">
              <div className="order-detail-label">Morada de Envio</div>
              <div className="order-detail-value">{orderDetail.address}</div>
            </div>
          )}

          {/* Items */}
          <div className="order-detail-section">
            <div className="order-detail-label">Items ({orderDetail.items?.length || 0})</div>
            {(orderDetail.items || []).map((item: any, i: number) => (
              <div key={i} className="order-detail-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: 12 }}>{item.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.price ? `${item.price}${orderDetail.currency || '€'}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  Qty: {item.qty}{item.sku ? ` | SKU: ${item.sku}` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          {orderDetail.note && (
            <div className="order-detail-section">
              <div className="order-detail-label">Nota</div>
              <div className="order-detail-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 11 }}>
                {orderDetail.note}
              </div>
            </div>
          )}

          {/* Cancel reason */}
          {orderDetail.cancel_reason && (
            <div className="order-detail-section">
              <div className="order-detail-label">Motivo de Cancelamento</div>
              <div className="order-detail-value" style={{ color: 'var(--danger)' }}>
                {orderDetail.cancel_reason}
              </div>
            </div>
          )}

          {/* Transactions */}
          {orderDetail.transactions && orderDetail.transactions.length > 0 && (
            <div className="order-detail-section">
              <div className="order-detail-label">Transacoes</div>
              {orderDetail.transactions.slice(0, 3).map((tx: any, i: number) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {tx.kind} — {tx.amount}{orderDetail.currency || '€'}
                  {tx.gateway ? ` (${tx.gateway})` : ''}
                  {tx.date ? ` — ${new Date(tx.date).toLocaleDateString('pt-PT')}` : ''}
                </div>
              ))}
            </div>
          )}

          {/* ── Falar com Hermes ── */}
          <button className="order-hermes-btn" onClick={() => onTalkToHermes(orderDetail)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Falar com Hermes Agent
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Nao foi possivel carregar os detalhes da encomenda.
        </div>
      )}
    </div>
  )
}
