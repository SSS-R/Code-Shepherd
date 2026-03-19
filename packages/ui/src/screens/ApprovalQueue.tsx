import { useState, useEffect } from 'react'
import DiffViewer from '../components/DiffViewer'

interface Approval {
  id: string
  agent_id: string
  action_type: string
  summary: string
  action_details: any
  risk_level: string
  risk_reason: string
  status: string
  requested_at: string
  diff?: string | null
  is_new_file?: boolean
}

interface Stats {
  pending: number
  approved: number
  rejected: number
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 })
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReasonError, setShowReasonError] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3000/approvals/pending')
      .then(res => res.json())
      .then(data => {
        setApprovals(data)
        setStats(prev => ({ ...prev, pending: data.length }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approved',
          decision_reason: 'Approved via dashboard',
          decidedBy: 'dashboard-user'
        })
      })

      if (res.ok) {
        setApprovals(approvals.filter(a => a.id !== id))
        setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }))
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleRejectClick = (id: string) => {
    setRejectingId(id)
    setRejectReason('')
    setShowReasonError(false)
  }

  const handleRejectConfirm = async (id: string) => {
    if (!rejectReason.trim()) {
      setShowReasonError(true)
      return
    }

    try {
      const res = await fetch(`http://localhost:3000/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'rejected',
          decision_reason: rejectReason.trim(),
          decidedBy: 'dashboard-user'
        })
      })

      if (res.ok) {
        setApprovals(approvals.filter(a => a.id !== id))
        setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }))
        setRejectingId(null)
        setRejectReason('')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const handleRejectCancel = () => {
    setRejectingId(null)
    setRejectReason('')
    setShowReasonError(false)
  }

  const getRiskBorder = (level: string): string => {
    switch (level) {
      case 'critical': return 'border-red-500'
      case 'high': return 'border-orange-500'
      case 'medium': return 'border-yellow-500'
      default: return 'border-blue-500'
    }
  }

  const getRiskBadge = (level: string): string => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="glass-glow rounded-[20px] px-6 py-7 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4f9e97]/20 bg-[#4f9e97]/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#6ee1c9]">
              HUMAN REVIEW
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Review risky actions with <span className="text-gradient-primary">clarity, context, and confidence</span>
            </h2>
            <p className="text-sm leading-7 text-neutral-400 md:text-base">
              Every approval card is now a premium glass surface with risk badges, diffs, context, and decisive action controls tuned for mobile-first review.
            </p>
          </div>
          <div className="surface-panel rounded-2xl px-5 py-4 md:min-w-64">
            <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">Queue health</div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{stats.pending}</div>
                <div className="text-sm text-neutral-500">pending decisions</div>
              </div>
              <div className="rounded-full bg-[#4f9e97]/10 border border-[#4f9e97]/20 px-3 py-1 text-xs font-semibold text-[#6ee1c9]">
                {stats.approved + stats.rejected} resolved this session
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="PN"
          color="from-yellow-500/14 to-transparent border-yellow-500/20"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon="OK"
          color="from-[#4f9e97]/12 to-[#6ee1c9]/6 border-[#4f9e97]/20"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon="RJ"
          color="from-red-500/12 to-transparent border-red-500/20"
        />
      </div>

      {/* Approvals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Approval Queue
          </h2>
          <div className="text-sm text-neutral-500">
            {approvals.length} pending
          </div>
        </div>

        {approvals.length === 0 ? (
          <div className="glass rounded-[20px] p-16 text-center animate-slide-up border border-dashed border-white/10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#4f9e97]/20 bg-[#4f9e97]/10 text-lg font-bold tracking-[0.3em] text-[#6ee1c9]">OK</div>
            <p className="text-xl font-semibold text-white mb-3">
              No pending approvals
            </p>
            <p className="text-neutral-400 max-w-md mx-auto">
              You're all caught up! New approval requests will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {approvals.map((approval, index) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                index={index}
                onApprove={handleApprove}
                onRejectClick={handleRejectClick}
                onRejectConfirm={handleRejectConfirm}
                onRejectCancel={handleRejectCancel}
                isRejecting={rejectingId === approval.id}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                showReasonError={showReasonError}
                riskBorder={getRiskBorder(approval.risk_level)}
                riskBadge={getRiskBadge(approval.risk_level)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: string
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`glass rounded-[20px] p-5 bg-gradient-to-br ${color} animate-fade-in`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs font-bold tracking-[0.25em] text-[#6ee1c9]">{icon}</div>
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">State</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-neutral-500">{label}</div>
    </div>
  )
}

interface ApprovalCardProps {
  approval: Approval
  index: number
  onApprove: (id: string) => void
  onRejectClick: (id: string) => void
  onRejectConfirm: (id: string) => void
  onRejectCancel: () => void
  isRejecting: boolean
  rejectReason: string
  setRejectReason: (reason: string) => void
  showReasonError: boolean
  riskBorder: string
  riskBadge: string
}

function ApprovalCard({
  approval,
  index,
  onApprove,
  onRejectClick,
  onRejectConfirm,
  onRejectCancel,
  isRejecting,
  rejectReason,
  setRejectReason,
  showReasonError,
  riskBorder,
  riskBadge
}: ApprovalCardProps) {
  return (
    <div
      className={`glass rounded-[20px] p-5 border ${riskBorder} transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(79,158,151,0.08)] animate-slide-up`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-1 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-black/40 text-xs font-bold tracking-[0.25em] text-[#6ee1c9]">
            {approval.action_type.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              {approval.summary || approval.action_type}
            </h3>
            <p className="text-sm text-neutral-500">
              Agent: {approval.agent_id}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.22em] border ${riskBadge}`}>
          {approval.risk_level}
        </div>
      </div>

      {approval.risk_reason && (
        <div className="text-sm text-neutral-300 mb-4 surface-panel p-4 rounded-2xl">
          <p className="font-semibold mb-1 text-white">Risk Assessment</p>
          {approval.risk_reason}
        </div>
      )}

      {approval.diff && (
        <div className="mb-4">
          <DiffViewer diff={approval.diff} isNewFile={approval.is_new_file ?? false} />
        </div>
      )}

      {approval.action_details && Object.keys(approval.action_details).length > 0 && !approval.diff && (
        <div className="text-xs text-neutral-400 mb-4">
          <pre className="surface-panel p-3 rounded-2xl overflow-auto text-xs bg-black/20">
            {JSON.stringify(approval.action_details, null, 2)}
          </pre>
        </div>
      )}

      {isRejecting ? (
        <div className="space-y-3 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Why are you rejecting this?
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full surface-panel rounded-2xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#4f9e97]/50"
              rows={3}
              placeholder="Explain why this action should be rejected..."
              autoFocus
            />
            {showReasonError && (
              <p className="text-xs text-red-400 mt-1">Rejection reason is required</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onRejectConfirm(approval.id)}
              className="flex-1 bg-red-600/90 hover:bg-red-500 text-white py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200"
            >
              Confirm Reject
            </button>
            <button
              onClick={onRejectCancel}
              className="flex-1 btn-secondary py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(approval.id)}
            className="flex-1 btn-primary py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onRejectClick(approval.id)}
            className="flex-1 bg-red-600/90 hover:bg-red-500 text-white py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  )
}
