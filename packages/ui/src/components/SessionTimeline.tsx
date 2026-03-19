import { useState } from 'react'

export interface TimelineEvent {
  id: number;
  event_type: string;
  event_details: Record<string, unknown>;
  agent_id: string | null;
  approval_id: string | null;
  timestamp: string;
  icon: string;
  category: 'tool' | 'approval' | 'system';
  status: 'success' | 'failure' | 'pending';
}

interface SessionTimelineProps {
  events: TimelineEvent[];
  agentId?: string;
  limit?: number;
}

export default function SessionTimeline({ events, agentId, limit = 50 }: SessionTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, limit);

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

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'approval': return 'border-blue-500 bg-blue-500/10';
      case 'tool': return 'border-purple-500 bg-purple-500/10';
      default: return 'border-slate-500 bg-slate-500/10';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success': return '✅';
      case 'failure': return '❌';
      default: return '⏳';
    }
  };

  const handleEventClick = (eventId: number) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (events.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">📜</div>
        <p className="text-slate-400">No session events yet</p>
        <p className="text-sm text-slate-500 mt-1">Agent activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline Line */}
          {index < sortedEvents.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent" />
          )}

          {/* Event Card */}
          <div
            className={`glass rounded-xl p-4 border-l-4 ${getCategoryColor(event.category)} transition-all duration-200 hover:scale-[1.01] cursor-pointer`}
            onClick={() => handleEventClick(event.id)}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full glass flex items-center justify-center text-2xl">
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {getTimeAgo(event.timestamp)}
                  </span>
                  <span className="text-xs">
                    {getStatusIcon(event.status)}
                  </span>
                </div>

                {/* Preview */}
                <div className="text-sm text-slate-400 truncate">
                  {getEventPreview(event.event_type, event.event_details)}
                </div>

                {/* Expanded Details */}
                {expandedEvent === event.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                    <div className="text-xs text-slate-300">
                      <div className="mb-2">
                        <span className="font-semibold">Event Type:</span> {event.event_type}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Time:</span> {new Date(event.timestamp).toLocaleString()}
                      </div>
                      {event.agent_id && (
                        <div className="mb-2">
                          <span className="font-semibold">Agent:</span> {event.agent_id}
                        </div>
                      )}
                      {event.approval_id && (
                        <div className="mb-2">
                          <span className="font-semibold">Approval:</span> {event.approval_id}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Details:</span>
                        <pre className="mt-1 p-2 glass rounded bg-black/20 text-xs overflow-auto">
                          {JSON.stringify(event.event_details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Format event type for display
 */
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get preview text for event
 */
function getEventPreview(eventType: string, details: Record<string, unknown>): string {
  if (eventType === 'approval_requested') {
    return (details as { action_type?: string })?.action_type || 'Approval requested';
  }
  if (eventType === 'approval_decided') {
    const decision = (details as { decision?: string })?.decision;
    return `Approval ${decision || 'decided'}`;
  }
  if (eventType === 'file_write') {
    return `Write to ${(details as { path?: string })?.path || 'file'}`;
  }
  if (eventType === 'file_read') {
    return `Read ${(details as { path?: string })?.path || 'file'}`;
  }
  if (eventType === 'command_execute') {
    return `Run ${(details as { command?: string })?.command || 'command'}`;
  }
  return 'Event occurred';
}
