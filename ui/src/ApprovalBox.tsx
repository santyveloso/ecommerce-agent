interface ApprovalInfo {
  id: string
  intent: string
  summary: string
  status: 'pending' | 'approved' | 'rejected'
}

interface ApprovalBoxProps {
  approval: ApprovalInfo
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

export default function ApprovalBox({ approval, onApprove, onReject }: ApprovalBoxProps) {
  return (
    <div className={`approval-box ${approval.status}`}>
      <div className="approval-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="approval-intent">{approval.intent}</span>
      </div>
      <p className="approval-summary">{approval.summary}</p>
      {approval.status === 'pending' && onApprove && onReject && (
        <div className="approval-actions">
          <button className="approval-btn approve" onClick={() => onApprove(approval.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Approve
          </button>
          <button className="approval-btn reject" onClick={() => onReject(approval.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
        </div>
      )}
      {approval.status !== 'pending' && (
        <span className={`approval-status ${approval.status}`}>
          {approval.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
        </span>
      )}
    </div>
  )
}
