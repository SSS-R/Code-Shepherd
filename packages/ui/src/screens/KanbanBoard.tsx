import { useEffect, useMemo, useState } from 'react'
import { Filter, Plus, MoreVertical, Lock, Check, X, Code, AlertCircle, Bot, Zap, Play, CheckCircle2, ShieldAlert } from 'lucide-react'
import { buildAuthHeaders } from '../utils/authSession'

type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done' | 'Failed'

interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    labels: string[]
    blocked_by_task_id?: string | null
    assigned_agent_id: string | null
    assignments?: Array<{ agent_id: string; role: string; conversation_id?: string | null }>
    runtime?: TaskRuntime | null
}

interface TaskRuntime {
    task_id: string
    worktree_path: string
    terminal_session_id: string
    terminal_status: 'idle' | 'ready' | 'active'
}

interface Agent {
    id: string
    name: string
}

const COLUMNS: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done', 'Failed']

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [runtimeByTask, setRuntimeByTask] = useState<Record<string, TaskRuntime>>({})
    const [selectedAgentsByTask, setSelectedAgentsByTask] = useState<Record<string, string[]>>({})
    const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all')

    const [showNewTaskForm, setShowNewTaskForm] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'P2' as Task['priority'],
        labels: '',
        assigned_agent_id: '',
        blocked_by_task_id: '',
    })

    useEffect(() => {
        fetch('http://localhost:3000/tasks', { headers: buildAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setTasks(data)
                return fetch('http://localhost:3000/agents', { headers: buildAuthHeaders() })
            })
            .then(res => res?.json?.())
            .then(agentData => {
                if (agentData) setAgents(agentData)
                setLoading(false)
            })
            .catch(() => setLoading(false))

        const socket = new WebSocket('ws://localhost:3000/realtime')
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data) as { type?: string }
            if (message.type === 'tasks.updated') {
                fetch('http://localhost:3000/tasks', { headers: buildAuthHeaders() })
                    .then(res => res.json())
                    .then(data => setTasks(data))
                    .catch(() => undefined)
            }
        }

        return () => socket.close()
    }, [])

    const createTask = async () => {
        if (!form.title.trim()) return

        const payload = {
            id: `task-${Date.now()}`,
            title: form.title.trim(),
            description: form.description.trim() || null,
            priority: form.priority,
            status: 'Queued',
            labels: form.labels.split(',').map(label => label.trim()).filter(Boolean),
            blocked_by_task_id: form.blocked_by_task_id || null,
            assigned_agent_id: form.assigned_agent_id || null,
        }

        const res = await fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify(payload),
        })

        if (res.ok) {
            const created = await res.json()
            setTasks([created, ...tasks])
            setForm({ title: '', description: '', priority: 'P2', labels: '', assigned_agent_id: '', blocked_by_task_id: '' })
            setShowNewTaskForm(false)
        }
    }

    const updateTask = async (taskId: string, patch: Partial<Task>) => {
        const res = await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'PATCH',
            headers: buildAuthHeaders(),
            body: JSON.stringify(patch),
        })

        if (res.ok) {
            const updated = await res.json()
            setTasks(current => current.map(task => task.id === taskId ? updated : task))
        }
    }

    const provisionRuntime = async (taskId: string) => {
        const res = await fetch(`http://localhost:3000/operations/tasks/${taskId}/provision`, { method: 'POST', headers: buildAuthHeaders() })
        if (res.ok) {
            const runtime = await res.json()
            setRuntimeByTask((current) => ({ ...current, [taskId]: runtime }))
        }
    }

    const activateTerminal = async (taskId: string) => {
        const res = await fetch(`http://localhost:3000/operations/tasks/${taskId}/terminal/activate`, { method: 'POST', headers: buildAuthHeaders() })
        if (res.ok) {
            setRuntimeByTask((current) => current[taskId]
                ? { ...current, [taskId]: { ...current[taskId], terminal_status: 'active' } }
                : current)
        }
    }

    const assignTaskToAgents = async (taskId: string) => {
        const agentIds = selectedAgentsByTask[taskId] || []
        if (agentIds.length === 0) return

        const res = await fetch(`http://localhost:3000/tasks/${taskId}/assignments`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({ agent_ids: agentIds, role: 'executor' }),
        })

        if (res.ok) {
            const overviewRes = await fetch('http://localhost:3000/tasks/coordination/overview', { headers: buildAuthHeaders() })
            if (overviewRes.ok) {
                const overview = await overviewRes.json()
                setTasks(overview)
            }
        }
    }

    const filteredTasks = useMemo(() => {
        if (priorityFilter === 'all') return tasks
        return tasks.filter((task) => task.priority === priorityFilter)
    }, [priorityFilter, tasks])

    const getColumnConfig = (status: TaskStatus) => {
        switch (status) {
            case 'Queued': return { index: '01', title: 'Ready for Queue', colorClass: 'text-outline', bgClass: 'bg-surface-container', lineClass: 'bg-outline' }
            case 'In Progress': return { index: '02', title: 'Active Operations', colorClass: 'text-primary', bgClass: 'bg-primary/10', lineClass: 'bg-secondary' }
            case 'Blocked': return { index: '03', title: 'Validation Gate', colorClass: 'text-tertiary', bgClass: 'bg-tertiary/10', lineClass: 'bg-tertiary' }
            case 'Failed': return { index: '04', title: 'Action Required', colorClass: 'text-error', bgClass: 'bg-error/10', lineClass: 'bg-error' }
            case 'Done': return { index: '05', title: 'Completed Artifacts', colorClass: 'text-outline', bgClass: 'bg-surface-container/50', lineClass: 'bg-outline-variant', fade: true }
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
        <div className="flex flex-col bg-surface overflow-hidden min-h-[calc(100vh-7rem)]">
            {/* Board Header */}
            <header className="px-4 md:px-6 lg:px-10 py-6 flex flex-col xl:flex-row justify-between xl:items-end shrink-0 gap-6">
                <div className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(123,219,128,0.5)] animate-pulse"></span>
                        <span className="font-mono text-[10px] text-secondary tracking-[0.2em] uppercase font-bold">Orchestration Active</span>
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface uppercase">Mission Kanban</h1>
                    <p className="text-outline text-sm mt-1.5 max-w-lg font-body">Real-time task distribution across autonomous agent clusters.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full xl:w-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="relative min-w-[180px]">
                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'all' | Task['priority'])} className="w-full appearance-none px-4 py-2.5 bg-surface-container-high/50 text-on-surface text-xs font-bold uppercase tracking-wider rounded border border-outline-variant/20 focus:ring-2 focus:ring-primary/40 outline-none transition-all cursor-pointer">
                            <option value="all">Priority: All</option>
                            <option value="P0">P0 - Critical</option>
                            <option value="P1">P1 - High</option>
                            <option value="P2">P2 - Medium</option>
                            <option value="P3">P3 - Low</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                            <Filter size={14} />
                        </div>
                    </div>
                    <button onClick={() => setShowNewTaskForm(!showNewTaskForm)} className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-container to-primary text-on-primary-container text-xs font-bold uppercase tracking-[0.15em] rounded shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Plus size={16} strokeWidth={3} /> Deploy New Task
                    </button>
                </div>
            </header>

            {/* New Task Inline Form */}
            {showNewTaskForm && (
                <div className="px-4 md:px-8 mb-6 shrink-0 animate-fade-in">
                    <div className="bg-surface-container rounded-md p-4 border border-outline-variant/20 grid gap-3 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 items-end relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

                        <div className="flex flex-col gap-1 lg:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-outline tracking-wider">Task Title</label>
                            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Optimize dependency graph" className="bg-surface-container-lowest border border-outline-variant/20 text-xs px-3 py-2 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-outline tracking-wider">Priority</label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })} className="bg-surface-container-lowest border border-outline-variant/20 text-xs px-3 py-2 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface">
                                <option value="P0">P0 - Critical</option>
                                <option value="P1">P1 - High</option>
                                <option value="P2">P2 - Medium</option>
                                <option value="P3">P3 - Low</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-outline tracking-wider">Labels</label>
                            <input value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} placeholder="core, api, ui" className="bg-surface-container-lowest border border-outline-variant/20 text-xs px-3 py-2 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface" />
                        </div>

                        <div className="flex flex-col gap-1 lg:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-outline tracking-wider">Assigned Agent</label>
                            <div className="flex gap-2">
                                <select value={form.assigned_agent_id} onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value })} className="bg-surface-container-lowest border border-outline-variant/20 text-xs px-3 py-2 rounded focus:ring-1 focus:ring-primary outline-none text-on-surface flex-1">
                                    <option value="">Unassigned</option>
                                    {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                </select>
                                <button onClick={() => void createTask()} className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded text-xs font-bold transition-colors uppercase tracking-wider">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-10 pb-10 flex gap-6 custom-scrollbar animate-fade-in">

                {COLUMNS.map((column) => {
                    const columnTasks = filteredTasks.filter(t => t.status === column)
                    const config = getColumnConfig(column)

                    return (
                        <div key={column} className="flex flex-col w-[280px] sm:w-[320px] md:w-[350px] shrink-0 h-full">
                            <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-mono ${config.colorClass} font-bold tracking-tighter ${config.bgClass} px-2 py-0.5 rounded`}>{config.index}</span>
                                    <h3 className={`font-headline font-semibold text-sm uppercase tracking-wider ${config.fade ? 'text-on-surface-variant/50' : 'text-on-surface-variant'}`}>{config.title}</h3>
                                </div>
                                <span className={`text-[10px] font-mono ${config.colorClass}`}>{columnTasks.length} {columnTasks.length === 1 ? 'TASK' : 'TASKS'}</span>
                            </div>

                             <div className={`flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-6 ${config.fade ? 'opacity-50' : ''}`}>
                                {columnTasks.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-outline-variant/20 p-8 text-center text-[10px] text-outline/40 uppercase tracking-[0.25em] font-mono bg-white/[0.02]">Empty Dropzone</div>
                                ) : (
                                    columnTasks.map((task) => (
                                        <div key={task.id} className={`premium-card rounded-lg p-5 relative group ring-primary/0 hover:ring-primary/20 transition-all cursor-pointer ${task.status === 'In Progress' ? 'ring-1 ring-primary/20 bg-gradient-to-br from-surface-container to-surface-container-high shadow-xl shadow-primary/5' : ''}`}>
                                            <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${config.lineClass} ${task.status === 'In Progress' ? 'shadow-[0_0_12px_rgba(123,219,128,0.8)]' : ''}`}></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`font-mono text-[10px] ${task.status === 'In Progress' ? 'text-secondary' : task.status === 'Failed' ? 'text-error' : task.status === 'Blocked' ? 'text-tertiary' : 'text-outline'} truncate max-w-[150px]`}>
                                                    REF: {task.id.slice(0, 8).toUpperCase()}
                                                </span>

                                                {task.status === 'In Progress' && (
                                                    <div className="flex items-center gap-1 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                        <span className="text-[9px] font-mono text-secondary">RUNNING</span>
                                                    </div>
                                                )}
                                                {task.status === 'Blocked' && <Lock size={14} className="text-tertiary" />}
                                                {task.status === 'Failed' && <ShieldAlert size={14} className="text-error" />}
                                                {task.status === 'Done' && <CheckCircle2 size={14} className="text-secondary" />}
                                                {task.status === 'Queued' && <MoreVertical size={14} className="text-outline hidden group-hover:block transition-all" />}
                                            </div>

                                            <h4 className={`text-sm font-medium ${task.status === 'Done' ? 'text-on-surface/80 line-through' : 'text-on-surface'} mb-4 leading-snug`}>{task.title}</h4>

                                            {task.labels && task.labels.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {task.labels.map(l => (
                                                        <span key={l} className="bg-surface-container-lowest border border-outline-variant/10 px-2 py-0.5 rounded text-[10px] text-primary flex items-center gap-1">
                                                            <Code size={10} /> {l}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {task.status === 'In Progress' && (
                                                <div className="h-1 w-full bg-surface-container-lowest rounded-full mb-4 overflow-hidden">
                                                    <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_10px_rgba(162,201,255,0.4)] animate-pulse"></div>
                                                </div>
                                            )}

                                            {task.status === 'Blocked' && task.blocked_by_task_id && (
                                                <div className="p-2 bg-error/5 rounded text-[10px] font-mono text-error border border-error/10 mb-4 line-clamp-2" title={`Blocked by: ${task.blocked_by_task_id}`}>
                                                    ERR: Needs completion of REF: {task.blocked_by_task_id.slice(0, 8).toUpperCase()}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center mt-2">
                                                {task.assigned_agent_id || task.status === 'Done' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full border border-surface bg-surface-container-high flex items-center justify-center overflow-hidden ${task.status === 'Done' ? 'opacity-80' : ''}`}>
                                                            <Bot size={12} className="text-primary" />
                                                        </div>
                                                        <span className={`text-[10px] font-mono ${task.status === 'Done' ? 'text-outline' : 'text-on-surface-variant'}`}>{agents.find(a => a.id === task.assigned_agent_id)?.name || 'AGENT'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-outline">UNASSIGNED</span>
                                                )}

                                                {task.status === 'Queued' && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">{task.priority}</span>
                                                    </div>
                                                )}

                                                {task.status === 'Done' && (
                                                    <span className="text-[10px] font-mono text-outline">TERMINATED_SUCCESS</span>
                                                )}

                                                {task.status === 'In Progress' && (
                                                    <span className="text-[10px] font-mono text-on-surface-variant">OPS-LOG: ACTIVE</span>
                                                )}

                                                {task.status === 'Blocked' && (
                                                    <button onClick={() => updateTask(task.id, { status: 'Queued' })} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">Queue Task</button>
                                                )}
                                                {task.status === 'Failed' && (
                                                    <button onClick={() => updateTask(task.id, { status: 'Queued' })} className="text-[10px] font-bold text-error hover:underline uppercase tracking-tighter">Retry Task</button>
                                                )}
                                            </div>

                                            {/* Action quick menu on hover if not done */}
                                            {task.status !== 'Done' && task.status !== 'In Progress' && (
                                                <div className="absolute top-2 right-2 flex gap-1 bg-surface-container-high/90 backdrop-blur rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-outline-variant/20 shadow-lg">
                                                    <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'In Progress' }) }} title="Start Task" className="w-6 h-6 rounded flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                                                        <Play size={12} fill="currentColor" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'Done' }) }} title="Mark Done" className="w-6 h-6 rounded flex items-center justify-center text-secondary hover:bg-secondary/20 transition-colors">
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            )}

                                            {task.status === 'In Progress' && (
                                                <div className="mt-4 pt-3 border-t border-outline-variant/10 flex flex-wrap gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); provisionRuntime(task.id) }} className="bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded text-primary transition-colors">Provision</button>
                                                    <button onClick={(e) => { e.stopPropagation(); activateTerminal(task.id) }} className="bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded text-primary transition-colors">Terminal</button>
                                                    <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'Done' }) }} className="bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded text-secondary transition-colors">Complete</button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Column: Analytics / Realtime Insight (Bento style) */}
                <div className="hidden 2xl:flex flex-col w-64 xl:w-80 shrink-0 ml-4 h-full border-l border-outline-variant/10 pl-8 overflow-y-auto custom-scrollbar pb-8">
                    <div className="mb-4">
                        <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-primary">Operational Metrics</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-surface-container p-4 rounded-md border border-outline-variant/5">
                            <span className="text-[10px] font-mono text-outline uppercase tracking-widest block mb-2">Throughput / H</span>
                            <div className="flex items-end gap-1 h-12">
                                <div className="w-full bg-primary/20 h-[40%] rounded-t-sm hover:h-[45%] transition-all"></div>
                                <div className="w-full bg-primary/20 h-[60%] rounded-t-sm hover:h-[65%] transition-all"></div>
                                <div className="w-full bg-primary/20 h-[30%] rounded-t-sm hover:h-[35%] transition-all"></div>
                                <div className="w-full bg-primary h-[90%] rounded-t-sm hover:h-[95%] transition-all"></div>
                                <div className="w-full bg-primary/20 h-[50%] rounded-t-sm hover:h-[55%] transition-all"></div>
                                <div className="w-full bg-primary/20 h-[45%] rounded-t-sm hover:h-[50%] transition-all"></div>
                                <div className="w-full bg-primary/20 h-[70%] rounded-t-sm hover:h-[75%] transition-all"></div>
                            </div>
                            <div className="flex justify-between mt-2 font-mono text-[9px] text-outline">
                                <span>00:00</span>
                                <span>NOW</span>
                            </div>
                        </div>
                        <div className="bg-surface-container p-4 rounded-md border border-outline-variant/5 text-center">
                            <span className="text-[10px] font-mono text-outline uppercase block mb-1">Health</span>
                            <span className="text-2xl font-headline font-bold text-secondary">99.8%</span>
                        </div>
                        <div className="bg-surface-container p-4 rounded-md border border-outline-variant/5 text-center">
                            <span className="text-[10px] font-mono text-outline uppercase block mb-1">Load</span>
                            <span className="text-2xl font-headline font-bold text-tertiary">14.2</span>
                        </div>
                        <div className="col-span-2 bg-primary/5 p-4 rounded-md border border-primary/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="text-primary" size={16} />
                                <span className="text-xs font-bold text-primary tracking-wide">ACTIVE CLUSTERS</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-on-surface">Alpha_Region_EU</span>
                                    <span className="text-[10px] font-mono text-secondary">STABLE</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-on-surface">Lambda_Compute</span>
                                    <span className="text-[10px] font-mono text-primary animate-pulse">SCALING</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-4 space-y-3">
                            <span className="text-[10px] text-outline uppercase font-bold tracking-widest block font-mono">Terminal Sessions</span>
                            {Object.entries(runtimeByTask).map(([taskId, runtime]) => (
                                <div key={taskId} className="bg-surface-container rounded border border-outline-variant/10 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-mono text-primary truncate max-w-[120px]">{taskId}</span>
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${runtime.terminal_status === 'active' ? 'bg-secondary/20 text-secondary' : 'bg-outline-variant/20 text-outline'}`}>
                                            {runtime.terminal_status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-[9px] font-mono text-outline-variant truncate" title={runtime.worktree_path}>
                                        {runtime.worktree_path.split('/').pop() || runtime.worktree_path}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(runtimeByTask).length === 0 && (
                                <div className="text-[10px] text-outline-variant font-mono">No active terminal runtimes.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
