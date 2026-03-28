import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Clock, FileText, MemoryStick, Terminal, TriangleAlert } from 'lucide-react'
import DiffViewer from '../components/DiffViewer'
import { ApprovalRecord, formatRelativeTime, relayFetch } from '../utils/relay'

interface Stats {
    pending: number
    approved: number
    rejected: number
}

export default function ApprovalQueue() {
    const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
    const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 })
    const [loading, setLoading] = useState(true)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [showReasonError, setShowReasonError] = useState(false)
    const [riskFilter, setRiskFilter] = useState('all')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [pending, all] = await Promise.all([
                    relayFetch<ApprovalRecord[]>('/approvals/pending'),
                    relayFetch<ApprovalRecord[]>('/approvals'),
                ])

                if (cancelled) return

                setApprovals(pending)
                setStats({
                    pending: pending.length,
                    approved: all.filter((approval) => approval.status === 'approved').length,
                    rejected: all.filter((approval) => approval.status === 'rejected').length,
                })
            } catch {
                if (!cancelled) {
                    setApprovals([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void load()
        const interval = window.setInterval(() => {
            void load()
        }, 8000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [])

    const filteredApprovals = useMemo(
        () => approvals.filter((approval) => riskFilter === 'all' || approval.risk_level.toLowerCase() === riskFilter),
        [approvals, riskFilter],
    )

    const decideApproval = async (id: string, decision: 'approved' | 'rejected', decisionReason: string) => {
        await relayFetch(`/approvals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                decision,
                decision_reason: decisionReason,
                decidedBy: 'dashboard-user',
            }),
        })

        setApprovals((current) => current.filter((approval) => approval.id !== id))
        setStats((current) => ({
            pending: Math.max(0, current.pending - 1),
            approved: decision === 'approved' ? current.approved + 1 : current.approved,
            rejected: decision === 'rejected' ? current.rejected + 1 : current.rejected,
        }))
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] py-2 lg:py-4">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Remote Intervention</p>
                        <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">Approval Queue</h1>
                        <div className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
                            <span className={`status-diamond ${stats.pending > 0 ? 'warning' : 'success'}`}></span>
                            <span>{stats.pending > 0 ? `${stats.pending} pending reviews require triage` : 'Queue is currently clear'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="focus-ring min-h-[44px] bg-surface-container px-4 py-3 text-sm text-on-surface">
                            <option value="all">All Risks</option>
                            <option value="high">High Risk</option>
                            <option value="medium">Medium Risk</option>
                            <option value="low">Low Risk</option>
                        </select>
                        <div className="surface-card-alt flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                            <span>Approved {stats.approved}</span>
                            <span>Rejected {stats.rejected}</span>
                        </div>
                    </div>
                </div>

                {filteredApprovals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center bg-surface-container text-success">
                            <Check size={34} />
                        </div>
                        <h3 className="font-headline text-2xl font-bold uppercase tracking-[-0.02em] text-on-surface">Triage Completed</h3>
                        <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">The queue is clear. All agent actions have been processed or deferred. System integrity remains stable.</p>
                        <button className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
                            View Activity Log <ChevronRight size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredApprovals.map((approval, index) => (
                            <ApprovalCard
                                key={approval.id}
                                approval={approval}
                                index={index}
                                onApprove={() => void decideApproval(approval.id, 'approved', 'Approved via dashboard')}
                                onRejectConfirm={() => {
                                    if (!rejectReason.trim()) {
                                        setShowReasonError(true)
                                        return
                                    }
                                    void decideApproval(approval.id, 'rejected', rejectReason.trim())
                                    setRejectingId(null)
                                    setRejectReason('')
                                    setShowReasonError(false)
                                }}
                                onRejectClick={() => {
                                    setRejectingId(approval.id)
                                    setRejectReason('')
                                    setShowReasonError(false)
                                }}
                                onRejectCancel={() => {
                                    setRejectingId(null)
                                    setRejectReason('')
                                    setShowReasonError(false)
                                }}
                                isRejecting={rejectingId === approval.id}
                                rejectReason={rejectReason}
                                setRejectReason={setRejectReason}
                                showReasonError={showReasonError}
                                setShowReasonError={setShowReasonError}
                            />
                        ))}
                    </div>
                )}
            </div>
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
    setShowReasonError,
}: {
    approval: ApprovalRecord
    index: number
    onApprove: () => void
    onRejectClick: () => void
    onRejectConfirm: () => void
    onRejectCancel: () => void
    isRejecting: boolean
    rejectReason: string
    setRejectReason: (reason: string) => void
    showReasonError: boolean
    setShowReasonError: (value: boolean) => void
}) {
    const { riskColor, riskBadgeClass, riskLabel, barClass, buttonClass, RiskIcon } = getRiskStyles(approval.risk_level)

    return (
        <div className={`relative overflow-hidden bg-surface-container transition-transform ${isRejecting ? 'ring-1 ring-error/40' : ''}`} style={{ animationFillMode: 'both', animationDuration: '250ms', animationName: 'fade-in', animationDelay: `${index * 40}ms` }}>
            <div className={`absolute left-0 top-0 h-full w-1 ${barClass}`}></div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center bg-surface-container-lowest text-on-surface-variant">
                            <RiskIcon size={18} className={riskColor} />
                        </div>

                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold uppercase text-on-surface">{approval.agent_id}</span>
                                <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${riskBadgeClass}`}>{riskLabel}</span>
                            </div>
                            <h3 className="font-headline text-[20px] font-semibold leading-7 text-on-surface">{approval.summary || approval.action_type}</h3>
                        </div>
                    </div>

                    <div className="font-mono text-[11px] text-primary">Object_{approval.id.substring(0, 6)}</div>
                </div>

                {approval.risk_reason ? (
                    <div className="mb-5 bg-surface-container-lowest px-4 py-4">
                        <div className="flex items-start gap-3">
                            <FileText size={16} className="mt-0.5 text-on-surface-variant" />
                            <div className="text-sm leading-6 text-on-surface-variant">
                                <span className="mr-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">Risk Context</span>
                                {approval.risk_reason}
                            </div>
                        </div>
                    </div>
                ) : null}

                {approval.diff ? (
                    <div className="mb-5 overflow-hidden bg-surface-container-lowest font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
                            <span className="text-[11px] text-on-surface-variant">{approval.is_new_file ? 'New File Creation' : 'Inline Diff Preview'}</span>
                            <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${riskColor}`}>{approval.action_type}</span>
                        </div>
                        <div className="custom-scrollbar overflow-x-auto px-4 py-4">
                            <DiffViewer diff={approval.diff} isNewFile={approval.is_new_file ?? false} />
                        </div>
                    </div>
                ) : approval.action_details && Object.keys(approval.action_details).length > 0 ? (
                    <div className="mb-5 overflow-hidden bg-surface-container-lowest font-mono text-xs">
                        <div className="border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Payload Data</span>
                        </div>
                        <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap px-4 py-4 text-[11px] leading-6 text-on-surface-variant">{JSON.stringify(approval.action_details, null, 2)}</pre>
                    </div>
                ) : null}

                <div className="flex flex-col gap-4 border-t border-outline-variant/20 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-4 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-2 font-headline uppercase tracking-[0.12em]"><Clock size={14} /> {formatRelativeTime(approval.requested_at)}</span>
                        <span className="flex items-center gap-2 font-headline uppercase tracking-[0.12em]"><Terminal size={14} /> {approval.action_type}</span>
                    </div>

                    {isRejecting ? (
                        <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[260px_auto_auto] lg:items-center">
                            <input
                                type="text"
                                value={rejectReason}
                                onChange={(event) => {
                                    setRejectReason(event.target.value)
                                    if (event.target.value) setShowReasonError(false)
                                }}
                                className={`focus-ring min-h-[44px] bg-surface-container-low px-4 py-3 text-sm text-on-surface ${showReasonError ? 'border border-error' : ''}`}
                                placeholder="Enter rejection reason"
                                autoFocus
                            />
                            <button onClick={onRejectCancel} className="shell-button shell-button-secondary focus-ring">Cancel</button>
                            <button onClick={onRejectConfirm} className="shell-button focus-ring bg-error text-white">Confirm Reject</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button onClick={onRejectClick} className="shell-button shell-button-secondary focus-ring">Reject</button>
                            <button onClick={onApprove} className={`shell-button focus-ring ${buttonClass}`}>{riskLabel === 'High Risk' ? 'Authorize Action' : 'Approve Changes'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function getRiskStyles(level: string) {
    const normalized = level?.toLowerCase() || ''

    if (normalized === 'critical' || normalized === 'high') {
        return {
            riskColor: 'text-error',
            riskBadgeClass: 'bg-error/12 px-2 py-1 text-error',
            riskLabel: 'High Risk',
            barClass: 'bg-error',
            buttonClass: 'bg-error text-white',
            RiskIcon: TriangleAlert,
        }
    }

    if (normalized === 'medium') {
        return {
            riskColor: 'text-warning',
            riskBadgeClass: 'bg-warning/12 px-2 py-1 text-warning',
            riskLabel: 'Medium Risk',
            barClass: 'bg-warning',
            buttonClass: 'shell-button-primary',
            RiskIcon: MemoryStick,
        }
    }

    return {
        riskColor: 'text-success',
        riskBadgeClass: 'bg-success/12 px-2 py-1 text-success',
        riskLabel: 'Low Risk',
        barClass: 'bg-success',
        buttonClass: 'shell-button-primary',
        RiskIcon: FileText,
    }
}
