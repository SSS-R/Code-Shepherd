import { useState, useEffect, ReactNode } from 'react'
import { BellRing, Check, FilePenLine, Shield, ShieldAlert, ShieldX, X } from 'lucide-react'
import DiffViewer from '../components/DiffViewer'
import { buildAuthHeaders } from '../utils/authSession'

interface Approval {
    id: string
    agent_id: string
    action_type: string
    summary: string
    action_details: Record<string, unknown>
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
        fetch('http://localhost:3000/approvals/pending', { headers: buildAuthHeaders() })
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
                headers: buildAuthHeaders(),
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
                headers: buildAuthHeaders(),
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

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="glass rounded-xl p-8">
                    <div className="h-4 w-28 rounded bg-white/8" />
                    <div className="mt-4 h-8 w-3/4 rounded bg-white/8" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => <div key={index} className="glass h-28 rounded-xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <section className="glass rounded-xl p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[13px] font-medium text-blue-300">
                            <BellRing size={14} /> Approvals
                        </div>
                        <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[32px]">
                            Every risky action should be readable before it is approved.
                        </h2>
                        <p className="text-[15px] leading-7 text-[var(--text-secondary)]">
                            Review cards are designed for quick human judgment: clear risk level, readable summaries, diff visibility, and decisive approve or reject actions.
                        </p>
                    </div>

                    <div className="surface-panel rounded-xl p-5 min-w-0 lg:min-w-72">
                        <div className="text-[13px] font-medium text-[var(--text-secondary)]">Queue health</div>
                        <div className="mt-3 flex items-end justify-between gap-4">
                            <div>
                                <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.pending}</div>
                                <div className="text-[13px] text-[var(--text-muted)]">pending decisions</div>
                            </div>
                            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[13px] font-medium text-blue-300">
                                {stats.approved + stats.rejected} resolved this session
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Pending" value={stats.pending} icon={<BellRing size={18} />} borderClass="border-amber-500/20" />
                <StatCard label="Approved" value={stats.approved} icon={<Check size={18} />} borderClass="border-green-500/20" />
                <StatCard label="Rejected" value={stats.rejected} icon={<X size={18} />} borderClass="border-red-500/20" />
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Approval Queue</h3>
                    <div className="text-[13px] text-[var(--text-secondary)]">{approvals.length} pending</div>
                </div>

                {approvals.length === 0 ? (
                    <div className="glass rounded-xl border border-dashed border-white/10 p-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-green-400">
                            <Check size={28} />
                        </div>
                        <p className="text-[18px] font-semibold text-[var(--text-primary)]">No pending approvals</p>
                        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">You&apos;re all caught up.</p>
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
                                onRejectCancel={() => {
                                    setRejectingId(null)
                                    setRejectReason('')
                                    setShowReasonError(false)
                                }}
                                isRejecting={rejectingId === approval.id}
                                rejectReason={rejectReason}
                                setRejectReason={setRejectReason}
                                showReasonError={showReasonError}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function StatCard({ label, value, icon, borderClass }: { label: string; value: number; icon: ReactNode; borderClass: string }) {
    return (
        <div className={`glass rounded-xl border ${borderClass} p-5`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-blue-300">{icon}</div>
                <div className="text-[13px] text-[var(--text-muted)]">State</div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="mt-1 text-[13px] text-[var(--text-secondary)]">{label}</div>
        </div>
    )
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
}: {
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
}) {
    const riskBadge = getRiskBadge(approval.risk_level)

    return (
        <div className="glass rounded-xl border border-white/8 p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-white/12" style={{ animationDelay: `${index * 40}ms` }}>
            <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-blue-300">
                        <FilePenLine size={18} />
                    </div>
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                            {getRiskIcon(approval.risk_level)}
                            <span>{approval.action_type}</span>
                        </div>
                        <h4 className="text-[18px] font-semibold text-[var(--text-primary)]">{approval.summary || approval.action_type}</h4>
                        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Agent: {approval.agent_id}</p>
                    </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[13px] font-medium ${riskBadge}`}>{approval.risk_level}</div>
            </div>

            {approval.risk_reason && (
                <div className="surface-panel mb-4 rounded-xl p-4 text-[15px] text-[var(--text-secondary)]">
                    <p className="mb-1 font-medium text-[var(--text-primary)]">Risk Assessment</p>
                    {approval.risk_reason}
                </div>
            )}

            {approval.diff && (
                <div className="mb-4 code-surface rounded-xl p-3">
                    <DiffViewer diff={approval.diff} isNewFile={approval.is_new_file ?? false} />
                </div>
            )}

            {approval.action_details && Object.keys(approval.action_details).length > 0 && !approval.diff && (
                <pre className="code-surface mb-4 overflow-auto rounded-xl p-3 text-[13px] text-[var(--text-secondary)]">
                    {JSON.stringify(approval.action_details, null, 2)}
                </pre>
            )}

            {isRejecting ? (
                <div className="space-y-3">
                    <div>
                        <label className="mb-2 block text-[15px] font-medium text-[var(--text-primary)]">Why are you rejecting this?</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="surface-panel w-full rounded-xl p-3 text-[15px] text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                            rows={3}
                            placeholder="Explain the rejection reason"
                            autoFocus
                        />
                        {showReasonError && <p className="mt-1 text-[13px] text-red-400">Rejection reason is required.</p>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onRejectConfirm(approval.id)} className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-3 text-sm font-medium text-red-400">Confirm Reject</button>
                        <button onClick={onRejectCancel} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button onClick={() => onRejectClick(approval.id)} className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-3 text-sm font-medium text-red-400 inline-flex items-center gap-2"><X size={16} /> Reject</button>
                    <button onClick={() => onApprove(approval.id)} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium inline-flex items-center gap-2"><Check size={16} /> Approve</button>
                </div>
            )}
        </div>
    )
}

function getRiskBadge(level: string): string {
    switch (level) {
        case 'critical':
            return 'bg-red-500/10 text-red-300 border-red-500/20'
        case 'high':
            return 'bg-red-500/10 text-red-300 border-red-500/20'
        case 'medium':
            return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
        default:
            return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    }
}

function getRiskIcon(level: string) {
    switch (level) {
        case 'critical':
        case 'high':
            return <ShieldX size={16} className="text-red-400" />
        case 'medium':
            return <ShieldAlert size={16} className="text-amber-400" />
        default:
            return <Shield size={16} className="text-blue-400" />
    }
}
