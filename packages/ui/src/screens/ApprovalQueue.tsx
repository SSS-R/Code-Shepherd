import { useState, useEffect } from 'react'

interface Approval {
  id: string
  agent_id: string
  action_type: string
  action_details: any
  risk_level: string
  risk_reason: string
  status: string
  requested_at: string
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = () => {
    fetch('http://localhost:3000/approvals/pending')
      .then(res => res.json())
      .then(data => {
        setApprovals(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:3000/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decision_reason: decision === 'approved' ? 'Approved via mobile dashboard' : 'Rejected via mobile dashboard',
          decidedBy: 'mobile-user'
        })
      })

      if (res.ok) {
        setApprovals(approvals.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Failed to submit decision:', error)
    }
  }

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'bg-danger/10 text-danger border-danger/20 dark:bg-danger/20 dark:text-danger-light dark:border-danger/30'
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30'
      case 'medium': return 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning-light dark:border-warning/30'
      default: return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-light dark:border-primary/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Approval Queue
        </h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {approvals.length} pending
        </div>
      </div>
      
      {approvals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-slide-up">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No pending approvals
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You're all caught up! New approvals will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval, index) => (
            <div
              key={approval.id}
              className="glass rounded-xl p-5 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">
                    {approval.action_type}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Agent: {approval.agent_id}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getRiskColor(approval.risk_level)}`}>
                  {approval.risk_level}
                </div>
              </div>
              
              {approval.risk_reason && (
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-3 glass p-3 rounded-lg">
                  <p className="font-semibold mb-1">Risk Assessment:</p>
                  {approval.risk_reason}
                </div>
              )}
              
              {approval.action_details && Object.keys(approval.action_details).length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <pre className="glass p-3 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(approval.action_details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(approval.id, 'approved')}
                  className="flex-1 bg-success hover:bg-success/90 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleDecision(approval.id, 'rejected')}
                  className="flex-1 bg-danger hover:bg-danger/90 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
