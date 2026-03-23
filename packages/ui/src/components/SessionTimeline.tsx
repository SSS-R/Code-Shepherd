import { useMemo, useState } from 'react'
import { ChevronRight, Verified, AlertTriangle, Code, Play, RefreshCw, Server, CheckCircle2, XCircle, Info, Hash, Bot } from 'lucide-react'

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

export default function SessionTimeline({ events, limit = 50 }: SessionTimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const sortedEvents = useMemo(() => [...events].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, limit), [events, limit]);

  const handleEventClick = (eventId: number) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (events.length === 0) {
    return (
      <div className="flex-col flex items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(162,201,255,0.05)] text-outline">
            <RefreshCw size={32} />
        </div>
        <h3 className="text-2xl font-headline font-bold text-on-surface mb-2 uppercase tracking-tight">No Activity Logged</h3>
        <p className="text-on-surface-variant max-w-xs mx-auto text-sm leading-relaxed">
            The timeline is clear. Agent activities, system events, and tool executions will appear here.
        </p>
      </div>
    );
  }

  // Group events by day to show date dividers
  const groupedEvents: { [dateOrLabel: string]: TimelineEvent[] } = {};
  
  sortedEvents.forEach(event => {
      const d = new Date(event.timestamp)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      let label = ''
      if (diffDays === 0 && d.getDate() === now.getDate()) label = `Today — ${formatDateHeader(d)}`
      else if (diffDays <= 1 || (diffDays === 0 && d.getDate() !== now.getDate())) label = `Yesterday — ${formatDateHeader(d)}`
      else label = formatDateHeader(d)

      if (!groupedEvents[label]) groupedEvents[label] = []
      groupedEvents[label].push(event)
  });

  return (
    <div className="space-y-4">
      {Object.entries(groupedEvents).map(([dateLabel, eventsForDate], dateIndex) => (
         <div key={dateLabel} className="space-y-4">
            
            {/* Date Divider */}
            {dateIndex > 0 && (
                <div className="py-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-outline-variant/10"></div>
                    <span className="font-headline text-[10px] font-bold text-outline uppercase tracking-[0.2em]">{dateLabel}</span>
                    <div className="h-px flex-1 bg-outline-variant/10"></div>
                </div>
            )}
            
            {eventsForDate.map(event => {
                 const isExpanded = expandedEvent === event.id;
                 const ui = getEventUI(event);
                 
                 return (
                    <article 
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className={`group bg-surface-container border-l-2 ${ui.lineColorClass} p-4 rounded-md transition-all hover:bg-surface-container-high cursor-pointer overflow-hidden relative block`}
                    >
                        {event.status === 'failure' && <div className="absolute inset-0 bg-error/5 pointer-events-none"></div>}
                        
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full ${ui.bgClass} flex items-center justify-center ${ui.textColorClass}`}>
                                    <ui.Icon size={16} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                    <h3 className={`font-headline font-semibold ${ui.titleColorClass} truncate`}>
                                        {formatEventType(event.event_type)}
                                    </h3>
                                    <span className="font-mono text-[10px] text-outline bg-surface-container-lowest px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                                        {new Date(event.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs mb-3">
                                    <span className="flex items-center gap-1.5 text-primary">
                                        {event.agent_id ? <Bot size={14} /> : <Server size={14} />}
                                        {event.agent_id || 'System Orchestrator'}
                                    </span>
                                    {event.status === 'failure' ? (
                                        <>
                                            <span className="text-outline-variant">/</span>
                                            <span className="text-error font-mono">STATUS: {event.status.toUpperCase()}</span>
                                        </>
                                    ) : event.status === 'pending' ? (
                                        <>
                                            <span className="text-outline-variant">/</span>
                                            <span className="text-tertiary font-mono">STATUS: {event.status.toUpperCase()}</span>
                                        </>
                                    ) : null}
                                </div>
                                
                                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-2">
                                    {getEventPreview(event.event_type, event.event_details)}
                                </p>

                                {/* Event specifics preview */}
                                {!isExpanded && event.category === 'tool' && ((event.event_details as any).command || (event.event_details as any).path) && (
                                     <div className="bg-surface-container-lowest p-2 md:p-3 rounded font-mono text-xs text-secondary/80 border border-outline-variant/10 overflow-x-auto">
                                        $ {((event.event_details as any).command || (event.event_details as any).path) as string}
                                     </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 self-center hidden sm:block">
                                <span className={`text-xs font-medium text-primary flex items-center gap-1 ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                    {isExpanded ? 'Hide Details' : 'View Details'} 
                                    <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </span>
                            </div>
                        </div>

                        {/* Expanded details */}
                        <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] mt-0 opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-sm">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="space-y-2 flex-1 min-w-0 font-mono">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-outline uppercase w-16">ID:</span>
                                                <span className="text-[10px] text-primary break-all">{event.id}</span>
                                            </div>
                                            {event.approval_id && (
                                                 <div className="flex gap-2">
                                                    <span className="text-[10px] text-outline uppercase w-16">Approval:</span>
                                                    <span className="text-[10px] text-secondary break-all">{event.approval_id}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-outline uppercase w-16">Metrics:</span>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    Category: {event.category.toUpperCase()} | Status: {event.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <span className="text-[10px] text-outline uppercase mb-2 block font-mono">Raw Payload</span>
                                        <pre className="mt-1 overflow-x-auto rounded border border-outline-variant/10 bg-[#0a0e14] p-3 text-[11px] text-outline-variant leading-relaxed custom-scrollbar font-mono">
                                            {JSON.stringify(event.event_details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                 )
            })}
         </div>
      ))}
    </div>
  );
}

function formatDateHeader(d: Date): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function getEventUI(event: TimelineEvent) {
    // Default system/generic state
    let ui = {
        lineColorClass: 'border-outline-variant',
        bgClass: 'bg-outline-variant/10',
        textColorClass: 'text-outline',
        titleColorClass: 'text-on-surface',
        Icon: Info
    }

    if (event.status === 'failure') {
        ui = {
            lineColorClass: 'border-error',
            bgClass: 'bg-error/10',
            textColorClass: 'text-error',
            titleColorClass: 'text-error',
            Icon: XCircle
        }
    } else if (event.category === 'approval') {
        ui = {
            lineColorClass: 'border-secondary',
            bgClass: 'bg-secondary/10',
            textColorClass: 'text-secondary',
            titleColorClass: 'text-on-surface',
            Icon: Verified
        }
    } else if (event.category === 'tool' || event.event_type.includes('write') || event.event_type.includes('execute')) {
        ui = {
            lineColorClass: 'border-tertiary',
            bgClass: 'bg-tertiary/10',
            textColorClass: 'text-tertiary',
            titleColorClass: 'text-on-surface',
            Icon: Code
        }
    } else if (event.event_type.includes('reconnect') || event.event_type.includes('start')) {
        ui = {
            lineColorClass: 'border-primary',
            bgClass: 'bg-primary/10',
            textColorClass: 'text-primary',
            titleColorClass: 'text-on-surface',
            Icon: RefreshCw
        }
    }

    return ui;
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getEventPreview(eventType: string, details: Record<string, unknown>): string {
  if (eventType === 'approval_requested') {
    return (details as { action_type?: string })?.action_type 
        ? `Agent requested authorization for action '${(details as { action_type?: string })?.action_type}'.`
        : 'Agent requested authorization for a restricted action.';
  }
  if (eventType === 'approval_decided') {
    const decision = (details as { decision?: string })?.decision;
    return `Approval request was manually ${decision || 'resolved'} by an operator.`;
  }
  if (eventType === 'file_write') {
    return `Agent successfully modified project file ${(details as { path?: string })?.path || 'unknown file'}.`;
  }
  if (eventType === 'file_read') {
    return `Agent analyzed contents of ${(details as { path?: string })?.path || 'file'}.`;
  }
  if (eventType === 'command_execute') {
    return `Agent executed terminal subprocess. See raw payload for full command stdout.`;
  }
  return 'A system event was securely logged in the execution timeline.';
}
