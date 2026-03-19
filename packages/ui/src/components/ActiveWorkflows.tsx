import { useState, useEffect } from 'react'

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
      .catch(() => {
        setLoading(false)
      })
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
    if (!timestamp) return '';
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'waiting': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-slate-400">No active workflows</p>
        <p className="text-sm text-slate-500 mt-1">All workflows are complete or idle</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <div
          key={workflow.workflowId}
          className="glass rounded-xl p-4 border-l-4 border-blue-500 transition-all duration-200 hover:scale-[1.01]"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${workflow.status === 'running' ? 'bg-green-500 animate-pulse' :
                      workflow.status === 'waiting' ? 'bg-yellow-500 animate-pulse' :
                        'bg-blue-500'
                    }`} />
                  <span className="text-sm font-semibold text-white">
                    {workflow.workflowType}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-2">
                {workflow.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>ID: {workflow.workflowId}</span>
                {workflow.agentId && (
                  <span>Agent: {workflow.agentId}</span>
                )}
                {workflow.waitingSince && (
                  <span>Waiting: {getTimeAgo(workflow.waitingSince)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {workflow.status === 'waiting' && (
                <button
                  onClick={() => void handleResume(workflow.workflowId)}
                  disabled={resumingId === workflow.workflowId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {resumingId === workflow.workflowId ? 'Resuming...' : 'Resume'}
                </button>
              )}
              <button className="px-4 py-2 glass hover:bg-white/5 text-white rounded-lg text-sm font-medium transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
