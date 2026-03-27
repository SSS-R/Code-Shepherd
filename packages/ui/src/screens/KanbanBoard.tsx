import { useEffect, useMemo, useState } from 'react'
import { Bot, Filter, MoreVertical, Plus, SlidersHorizontal } from 'lucide-react'
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
}

interface Agent {
    id: string
    name: string
}

const COLUMNS: Array<{ key: TaskStatus; title: string }> = [
    { key: 'Queued', title: 'Ready for Queue' },
    { key: 'In Progress', title: 'Active Operations' },
    { key: 'Blocked', title: 'Validation' },
    { key: 'Done', title: 'Completed' },
    { key: 'Failed', title: 'Action Required' },
]

function getPriorityTone(priority: Task['priority']) {
    if (priority === 'P0') return { bar: 'bg-error', label: 'Critical', text: 'text-error' }
    if (priority === 'P1') return { bar: 'bg-warning', label: 'High', text: 'text-warning' }
    if (priority === 'P2') return { bar: 'bg-primary', label: 'Medium', text: 'text-primary' }
    return { bar: 'bg-success', label: 'Low', text: 'text-success' }
}

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all')

    useEffect(() => {
        fetch('http://localhost:3000/tasks', { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then((data) => {
                setTasks(data)
                return fetch('http://localhost:3000/agents', { headers: buildAuthHeaders() })
            })
            .then((res) => res?.json?.())
            .then((agentData) => {
                if (agentData) setAgents(agentData)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const filteredTasks = useMemo(() => {
        if (priorityFilter === 'all') return tasks
        return tasks.filter((task) => task.priority === priorityFilter)
    }, [priorityFilter, tasks])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] overflow-hidden">
            <header className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="status-diamond success"></span>
                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Operational Status: Optimal</span>
                    </div>
                    <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.03em] text-on-surface sm:text-[36px]">Mission Control</h1>
                    <p className="mt-2 text-sm text-on-surface-variant">Horizontal coordination surface for queued, active, validation, and recovery flows.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="surface-card-alt flex items-center gap-2 p-1">
                        <button className="bg-surface-container px-4 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Board</button>
                        <button className="px-4 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">List</button>
                    </div>
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'all' | Task['priority'])} className="focus-ring min-h-[44px] bg-surface-container pl-10 pr-4 text-sm text-on-surface">
                            <option value="all">All Priorities</option>
                            <option value="P0">P0</option>
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                        </select>
                    </div>
                    <button className="shell-button shell-button-primary focus-ring">
                        <Plus size={16} />
                        Deploy New Task
                    </button>
                </div>
            </header>

            <div className="flex flex-col gap-10 pb-6">
                {COLUMNS.map((column) => {
                    const columnTasks = filteredTasks.filter((task) => task.status === column.key)

                    return (
                        <section key={column.key} className="w-full">
                            <div className="mb-4 flex items-center justify-between border-b border-outline-variant/20 pb-3">
                                <div className="flex items-center gap-3">
                                    <span className="status-diamond info"></span>
                                    <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">{column.title}</h2>
                                    <span className="bg-surface-container-high px-2 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{columnTasks.length}</span>
                                </div>
                                <button className="focus-ring flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <div className={columnTasks.length === 0 ? "flex" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
                                {columnTasks.length === 0 ? (
                                    <div className="surface-card-alt w-full p-8 text-center font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Empty Dropzone</div>
                                ) : (
                                    columnTasks.map((task) => {
                                        const priority = getPriorityTone(task.priority)
                                        const assignedAgent = agents.find((agent) => agent.id === task.assigned_agent_id)

                                        return (
                                            <article key={task.id} className="surface-card relative overflow-hidden p-5 transition-transform hover:-translate-y-1">
                                                <div className={`absolute left-0 top-5 h-[calc(100%-40px)] w-1 ${priority.bar}`}></div>

                                                <div className="mb-4 flex items-start justify-between gap-3">
                                                    <span className="bg-surface-container-high px-2 py-1 font-mono text-[10px] text-on-surface-variant">{task.id.slice(0, 8).toUpperCase()}</span>
                                                    <div className="flex gap-1">
                                                        <span className={`h-3 w-1 ${priority.bar}`}></span>
                                                        <span className={`h-3 w-1 ${priority.bar}`}></span>
                                                        <span className={`h-3 w-1 ${priority.bar}`}></span>
                                                    </div>
                                                </div>

                                                <h3 className="mb-3 font-headline text-[22px] font-semibold leading-7 text-on-surface">{task.title}</h3>
                                                <p className="mb-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">{task.description || 'No additional mission context provided.'}</p>

                                                {task.labels?.length ? (
                                                    <div className="mb-4 flex flex-wrap gap-2">
                                                        {task.labels.map((label) => (
                                                            <span key={label} className="bg-surface-container-lowest px-2 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{label}</span>
                                                        ))}
                                                    </div>
                                                ) : null}

                                                <div className="mb-4 flex items-center justify-between text-[11px]">
                                                    <span className="text-on-surface-variant">Priority</span>
                                                    <span className={`font-headline font-semibold uppercase tracking-[0.14em] ${priority.text}`}>{priority.label}</span>
                                                </div>

                                                <div className="mb-4 h-1.5 bg-surface-container-lowest">
                                                    <div className={`${priority.bar} h-full`} style={{ width: column.key === 'Done' ? '100%' : column.key === 'In Progress' ? '68%' : column.key === 'Blocked' ? '22%' : '12%' }}></div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center bg-surface-container-high text-primary">
                                                            <Bot size={12} />
                                                        </div>
                                                        <span className="font-mono text-[11px] text-on-surface-variant">{assignedAgent?.name || 'Unassigned'}</span>
                                                    </div>
                                                    {task.priority === 'P0' ? <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-error">Critical</span> : null}
                                                </div>
                                            </article>
                                        )
                                    })
                                )}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
