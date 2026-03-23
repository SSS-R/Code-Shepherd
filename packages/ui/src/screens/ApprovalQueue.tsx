import { useMemo, useState, useEffect, ReactNode } from 'react'
import { BellRing, Check, FilePenLine, Search, Shield, ShieldAlert, ShieldX, X, Bolt, MemoryStick, FileText, Link, MessageSquare, Clock, Terminal, Layers, Sparkles, Filter, ChevronRight } from 'lucide-react'
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
    const [riskFilter, setRiskFilter] = useState('all')

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

    const filteredApprovals = useMemo(() => {
        return approvals.filter((approval) => {
            return riskFilter === 'all' || approval.risk_level.toLowerCase() === riskFilter
        })
    }, [approvals, riskFilter])

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
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="py-4 md:py-8 min-h-[calc(100vh-7rem)]">
            <div className="max-w-5xl mx-auto">
                {/* Page Header */}
                <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface mb-2 uppercase">Approval Queue</h1>
                        <p className="text-on-surface-variant text-sm flex items-center gap-2">
                            {stats.pending > 0 ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(123,219,128,0.5)]"></span>
                                    {stats.pending} pending actions requiring immediate triage
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                                    Queue is currently empty
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <select
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            className="w-full sm:w-auto bg-surface-container border border-outline-variant/20 focus:border-primary/50 text-on-surface-variant text-xs rounded-sm px-3 py-2 outline-none"
                        >
                            <option value="all">All Risks</option>
                            <option value="high">High Risk</option>
                            <option value="medium">Medium Risk</option>
                            <option value="low">Low Risk</option>
                        </select>
                        <button className="w-full sm:w-auto bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-4 py-2 text-xs font-medium rounded-sm border border-outline-variant/10 transition-all">
                            Bulk Reject
                        </button>
                        <button className="w-full sm:w-auto bg-gradient-to-b from-primary-container to-primary text-on-primary-container px-4 py-2 text-xs font-bold rounded-sm shadow-[0_4px_14px_0_rgba(88,166,255,0.1)] active:scale-95 transition-all">
                            Approve All (Safe)
                        </button>
                    </div>
                </div>

                {/* Central Feed of Approval Cards */}
                {filteredApprovals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(162,201,255,0.05)]">
                            <Check className="text-secondary text-4xl" size={32} />
                        </div>
                        <h3 className="text-2xl font-headline font-bold text-on-surface mb-2 uppercase tracking-tight">Triage Completed</h3>
                        <p className="text-on-surface-variant max-w-xs mx-auto text-sm leading-relaxed">
                            The queue is clear. All agent actions have been processed or deferred. System operating at peak efficiency.
                        </p>
                        <button className="mt-8 text-primary font-mono text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
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
    setShowReasonError: (v: boolean) => void
}) {
    const { riskClass, riskColor, riskLabel, RiskIcon, borderClass, bgClass, glowClass } = getRiskStyles(approval.risk_level)
    const timeAgo = getTimeAgo(approval.requested_at)

    return (
        <div className={`bg-surface-container rounded-md overflow-hidden relative group transition-all duration-300 ${isRejecting ? 'ring-1 ring-error/50 scale-[1.01]' : ''}`} style={{ animationFillMode: 'both', animationDuration: '400ms', animationName: 'fadeInUp', animationDelay: `${index * 50}ms` }}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${bgClass}`}></div>
            <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-surface-container-lowest rounded-sm flex items-center justify-center border border-outline-variant/15`}>
                            <RiskIcon className={`${riskColor}`} size={18} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono font-bold text-on-surface uppercase">{approval.agent_id}</span>
                                <span className={`px-2 py-0.5 rounded-full ${riskClass} text-[10px] font-bold uppercase tracking-widest`}>{riskLabel}</span>
                            </div>
                            <p className="text-on-surface-variant text-sm font-medium">{approval.summary || approval.action_type}</p>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-primary flex items-center gap-1 hover:underline cursor-pointer Shrink-0">
                        <Link size={12} />
                        Object_{approval.id.substring(0, 6)}
                    </div>
                </div>

                {/* Risk Reason Context */}
                {approval.risk_reason && (
                    <div className="bg-surface-container-lowest p-4 rounded-sm border border-outline-variant/10 mb-4 sm:mb-5">
                        <div className="flex items-start gap-3">
                            <FileText size={16} className="text-outline shrink-0 mt-0.5" />
                            <div className="text-xs text-on-surface-variant leading-relaxed">
                                <span className="text-on-surface font-semibold mr-2">Risk Context:</span>
                                {approval.risk_reason}
                            </div>
                        </div>
                    </div>
                )}

                {/* Code Diff Preview */}
                {approval.diff && (
                    <div className={`bg-surface-container-lowest rounded-sm border border-outline-variant/10 font-mono text-xs overflow-hidden mb-5`}>
                        <div className="bg-surface-container-low px-3 py-1.5 border-b border-outline-variant/10 flex justify-between items-center">
                            <span className="text-outline text-[10px]">{approval.is_new_file ? 'New File Creation' : 'File Modification'}</span>
                            <span className={`${riskColor} text-[10px] uppercase`}>{approval.action_type}</span>
                        </div>
                        <div className="p-3 bg-[#0a0e14] code-diff-bg overflow-x-auto">
                            <DiffViewer diff={approval.diff} isNewFile={approval.is_new_file ?? false} />
                        </div>
                    </div>
                )}

                {approval.action_details && Object.keys(approval.action_details).length > 0 && !approval.diff && (
                    <div className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 font-mono text-xs overflow-hidden mb-5">
                        <div className="bg-surface-container-low px-3 py-1.5 border-b border-outline-variant/10">
                            <span className="text-outline text-[10px] uppercase">Payload Data</span>
                        </div>
                        <pre className="p-3 text-[11px] text-outline overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(approval.action_details, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Action Area */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-2">
                    <div className="flex flex-wrap gap-4 text-outline text-[11px] font-medium uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Clock size={14} /> {timeAgo}</span>
                        <span className="flex items-center gap-1"><Terminal size={14} /> Type: {approval.action_type}</span>
                    </div>

                    {isRejecting ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 p-3 sm:p-0 bg-surface-container-lowest sm:bg-transparent rounded border border-error/20 sm:border-transparent">
                            <div className="w-full sm:w-64">
                                <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => {
                                        setRejectReason(e.target.value)
                                        if (e.target.value) setShowReasonError(false)
                                    }}
                                    className={`w-full bg-surface-container border ${showReasonError ? 'border-error' : 'border-outline-variant/30'} text-xs focus:ring-1 focus:ring-error focus:border-error text-on-surface rounded-sm px-3 py-2 outline-none placeholder:text-outline`}
                                    placeholder="Enter rejection reason..."
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={onRejectCancel} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-outline border border-outline-variant/30 hover:bg-surface-container-high transition-colors rounded-sm">
                                    Cancel
                                </button>
                                <button onClick={() => onRejectConfirm(approval.id)} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-error text-on-error hover:brightness-110 active:scale-95 transition-all rounded-sm uppercase tracking-wide">
                                    Confirm
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button onClick={() => onRejectClick(approval.id)} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold ${riskColor} border ${borderClass} hover:bg-surface-container-high transition-colors rounded-sm`}>
                                Reject
                            </button>
                            <button onClick={() => onRejectClick(approval.id)} className="hidden sm:flex px-3 py-2 text-xs font-bold text-outline border border-outline-variant/30 hover:bg-surface-container-high transition-colors rounded-sm items-center gap-1">
                                <MessageSquare size={14} /> Reason
                            </button>
                            <button onClick={() => onApprove(approval.id)} className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold ${bgClass} ${riskColor === 'text-error' ? 'text-on-error' : 'text-surface-container-lowest'} shadow-lg hover:brightness-110 active:scale-95 transition-all rounded-sm uppercase tracking-wide`}>
                                {riskLabel === 'High Risk' || riskLabel === 'Critical' ? 'Authorize' : 'Approve'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function getRiskStyles(level: string) {
    const l = level?.toLowerCase() || ''
    if (l === 'critical' || l === 'high') {
        return {
            riskClass: 'bg-error/10 text-error',
            riskColor: 'text-error',
            bgClass: 'bg-error',
            borderClass: 'border-error/20',
            glowClass: 'shadow-[0_0_8px_#ffb4ab]',
            riskLabel: l === 'critical' ? 'Critical' : 'High Risk',
            RiskIcon: Bolt
        }
    }
    if (l === 'medium') {
        return {
            riskClass: 'bg-tertiary/10 text-tertiary',
            riskColor: 'text-tertiary',
            bgClass: 'bg-tertiary',
            borderClass: 'border-tertiary/20',
            glowClass: 'shadow-[0_0_8px_#fabc45]',
            riskLabel: 'Medium Risk',
            RiskIcon: MemoryStick
        }
    }
    return {
        riskClass: 'bg-secondary/10 text-secondary',
        riskColor: 'text-secondary',
        bgClass: 'bg-secondary',
        borderClass: 'border-secondary/20',
        glowClass: 'shadow-[0_0_8px_#7bdb80]',
        riskLabel: 'Low Risk',
        RiskIcon: FileText
    }
}

function getTimeAgo(dateString: string) {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 60) return `${diffSecs}s ago`

    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
}
