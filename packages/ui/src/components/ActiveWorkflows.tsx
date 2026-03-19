import { useState, useEffect } from 'react'
import { Eye, Loader2, Pause } from 'lucide-react'

interface Workflow {
    workflowId: string;
    workflowType: string;
    status: 'running' | 'waiting' | 'pending';
    waitingSince?: string;
    agentId?: string;
    description: string;
}

export default function ActiveWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)
    const [resumingId, setResumingId] = useState<string | null>(null)

    useEffect(() => {
        fetch('http://localhost:3000/workflows')
            .then(res => res.json())
            .then(data => {
                setWorkflows(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleResume = async (workflowId: string): Promise<void> => {
        try {
            setResumingId(workflowId)
            await fetch(`http://localhost:3000/workflows/${workflowId}/resume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error) {
            console.error('Failed to resume workflow:', error)
        } finally {
            setResumingId(null)
        }
    }

    const getTimeAgo = (timestamp?: string): string => {
        if (!timestamp) return ''
        const now = new Date()
        const eventTime = new Date(timestamp)
        const diffMs = now.getTime() - eventTime.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)

        if (diffHours > 0) return `${diffHours}h ago`
        if (diffMins > 0) return `${diffMins}m ago`
        return 'Just now'
    }

    if (loading) {
        return (
            <div className="glass rounded-xl p-6 animate-pulse">
                <div className="h-5 w-40 rounded bg-white/8" />
                <div className="mt-4 h-20 rounded-xl bg-white/8" />
            </div>
        )
    }

    if (workflows.length === 0) {
        return (
            <div className="glass rounded-xl p-8 text-center border border-dashed border-white/10">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-amber-300">
                    <Pause size={18} />
                </div>
                <p className="text-[var(--text-primary)]">No active workflows</p>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">All workflows are complete or idle.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {workflows.map((workflow) => (
                <div key={workflow.workflowId} className="glass rounded-xl p-5 border border-white/8 transition-all duration-200 hover:-translate-y-[1px] hover:border-white/12">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <div className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
                                    {workflow.status === 'running' ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Pause size={16} className="text-amber-400" />}
                                    {workflow.workflowType}
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[13px] font-medium border ${workflow.status === 'running'
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    }`}>
                                    {workflow.status}
                                </span>
                            </div>

                            <p className="text-[15px] text-[var(--text-secondary)] mb-3">{workflow.description}</p>

                            <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--text-muted)]">
                                <span>ID: {workflow.workflowId}</span>
                                {workflow.agentId && <span>Agent: {workflow.agentId}</span>}
                                {workflow.waitingSince && <span>Waiting: {getTimeAgo(workflow.waitingSince)}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {workflow.status === 'waiting' && (
                                <button
                                    onClick={() => void handleResume(workflow.workflowId)}
                                    disabled={resumingId === workflow.workflowId}
                                    className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                                >
                                    {resumingId === workflow.workflowId ? 'Resuming...' : 'Resume'}
                                </button>
                            )}
                            <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
                                <Eye size={14} /> View
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
