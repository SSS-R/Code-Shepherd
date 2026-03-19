import { useState, useEffect } from 'react'

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
    <div className="space-y-6 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="⏳"
          color="from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon="✓"
          color="from-green-500/20 to-emerald-500/20 border-green-500/30"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon="✕"
          color="from-red-500/20 to-rose-500/20 border-red-500/30"
        />
      </div>

      {/* Approvals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Approval Queue
          </h2>
          <div className="text-sm text-slate-400">
            {approvals.length} pending
          </div>
        </div>
        
        {approvals.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center animate-slide-up">
            <div className="text-7xl mb-6">✅</div>
            <p className="text-xl font-semibold text-white mb-3">
              No pending approvals
            </p>
            <p className="text-slate-400 max-w-md mx-auto">
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
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${color} animate-fade-in`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
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
      className={`glass rounded-xl p-5 border-l-4 ${riskBorder} transition-all duration-300 hover:scale-[1.02] animate-slide-up`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">
            {approval.summary || approval.action_type}
          </h3>
          <p className="text-sm text-slate-400">
            Agent: {approval.agent_id}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border ${riskBadge}`}>
          {approval.risk_level}
        </div>
      </div>
      
      {approval.risk_reason && (
        <div className="text-sm text-slate-300 mb-4 glass p-3 rounded-lg">
          <p className="font-semibold mb-1 text-slate-200">Risk Assessment:</p>
          {approval.risk_reason}
        </div>
      )}
      
      {approval.action_details && Object.keys(approval.action_details).length > 0 && (
        <div className="text-xs text-slate-400 mb-4">
          <pre className="glass p-3 rounded-lg overflow-auto text-xs bg-black/20">
            {JSON.stringify(approval.action_details, null, 2)}
          </pre>
        </div>
      )}
      
      {isRejecting ? (
        <div className="space-y-3 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Why are you rejecting this?
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full glass bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
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
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200"
            >
              Confirm Reject
            </button>
            <button
              onClick={onRejectCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(approval.id)}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onRejectClick(approval.id)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  )
}
