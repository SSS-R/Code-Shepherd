import { useState, useEffect } from 'react';
import SessionTimeline from '../components/SessionTimeline';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline';
  capabilities: string[];
  last_heartbeat: string;
}

interface TimelineEvent {
  id: number;
  event_type: string;
  event_details: Record<string, unknown>;
  timestamp: string;
  icon: string;
  category: string;
  status: string;
}

interface AgentDetailProps {
  agentId: string;
  onBack: () => void;
}

export default function AgentDetail({ agentId, onBack }: AgentDetailProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3000/agents/${agentId}`).then(res => res.json()),
      fetch(`http://localhost:3000/audit-logs/${agentId}/timeline`).then(res => res.json())
    ]).then(([agentData, eventsData]) => {
      setAgent(agentData);
      setEvents(eventsData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="glass rounded-2xl p-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-xl font-semibold text-white mb-2">Agent not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 glass rounded-lg hover:bg-white/5 transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
          <p className="text-sm text-slate-400">ID: {agent.id}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
          agent.status === 'online'
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
        }`}>
          {agent.status}
        </div>
      </div>

      {/* Agent Info */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Agent Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <p className="text-white font-semibold">{agent.status}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Last Active</p>
            <p className="text-white font-semibold">{getTimeAgo(agent.last_heartbeat)}</p>
          </div>
        </div>
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">Capabilities</p>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Timeline */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Session Timeline</h2>
        <SessionTimeline events={events} agentId={agentId} limit={50} />
      </div>
    </div>
  );
}
