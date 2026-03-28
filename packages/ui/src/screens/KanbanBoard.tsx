import { useEffect, useMemo, useState } from 'react'
import { Bot, Filter, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { createClientId, AgentRecord, relayFetch, TaskPriority, TaskRecord, TaskStatus } from '../utils/relay'

const COLUMNS: Array<{ key: TaskStatus; title: string }> = [
    { key: 'Queued', title: 'Ready for Queue' },
    { key: 'In Progress', title: 'Active Operations' },
    { key: 'Blocked', title: 'Validation' },
    { key: 'Done', title: 'Completed' },
    { key: 'Failed', title: 'Action Required' },
]

function getPriorityTone(priority: TaskPriority) {
    if (priority === 'P0') return { bar: 'bg-error', label: 'Critical', text: 'text-error' }
    if (priority === 'P1') return { bar: 'bg-warning', label: 'High', text: 'text-warning' }
    if (priority === 'P2') return { bar: 'bg-primary', label: 'Medium', text: 'text-primary' }
    return { bar: 'bg-success', label: 'Low', text: 'text-success' }
}

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<TaskRecord[]>([])
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
    const [createOpen, setCreateOpen] = useState(false)
    const [draftTitle, setDraftTitle] = useState('')
    const [draftDescription, setDraftDescription] = useState('')
    const [draftPriority, setDraftPriority] = useState<TaskPriority>('P2')
    const [draftAgentId, setDraftAgentId] = useState('')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [taskData, agentData] = await Promise.all([
                    relayFetch<TaskRecord[]>('/tasks'),
                    relayFetch<AgentRecord[]>('/agents'),
                ])

                if (!cancelled) {
                    setTasks(taskData)
                    setAgents(agentData)
                }
            } catch {
                if (!cancelled) {
                    setTasks([])
                    setAgents([])
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
        }, 10000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [])

    const filteredTasks = useMemo(() => {
        if (priorityFilter === 'all') return tasks
        return tasks.filter((task) => task.priority === priorityFilter)
    }, [priorityFilter, tasks])

    const updateTask = async (taskId: string, patch: Partial<TaskRecord>) => {
        const updated = await relayFetch<TaskRecord>(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })

        setTasks((current) => current.map((task) => task.id === taskId ? updated : task))
    }

    const createTask = async () => {
        if (!draftTitle.trim()) return

        const created = await relayFetch<TaskRecord>('/tasks', {
            method: 'POST',
            body: JSON.stringify({
                id: createClientId('task'),
                title: draftTitle.trim(),
                description: draftDescription.trim() || null,
                status: 'Queued',
                priority: draftPriority,
                labels: [],
                assigned_agent_id: draftAgentId || null,
            }),
        })

        setTasks((current) => [created, ...current])
        setDraftTitle('')
        setDraftDescription('')
        setDraftPriority('P2')
        setDraftAgentId('')
        setCreateOpen(false)
    }

    const deleteTask = async (taskId: string) => {
        await relayFetch(`/tasks/${taskId}`, {
            method: 'DELETE',
        })

        setTasks((current) => current.filter((task) => task.id !== taskId))
    }

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
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)} className="focus-ring min-h-[44px] bg-surface-container pl-10 pr-4 text-sm text-on-surface">
                            <option value="all">All Priorities</option>
                            <option value="P0">P0</option>
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                        </select>
                    </div>
                    <button className="shell-button shell-button-primary focus-ring" onClick={() => setCreateOpen((value) => !value)}>
                        <Plus size={16} />
                        Deploy New Task
                    </button>
                </div>
            </header>

            {createOpen ? (
                <section className="surface-card-alt mb-8 p-6">
                    <div className="grid gap-4 lg:grid-cols-4">
                        <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="focus-ring bg-surface-container px-4 py-3 text-sm text-on-surface" placeholder="Task title" />
                        <input value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} className="focus-ring bg-surface-container px-4 py-3 text-sm text-on-surface" placeholder="Description" />
                        <select value={draftPriority} onChange={(event) => setDraftPriority(event.target.value as TaskPriority)} className="focus-ring bg-surface-container px-4 py-3 text-sm text-on-surface">
                            <option value="P0">P0</option>
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                        </select>
                        <select value={draftAgentId} onChange={(event) => setDraftAgentId(event.target.value)} className="focus-ring bg-surface-container px-4 py-3 text-sm text-on-surface">
                            <option value="">Unassigned</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={() => void createTask()} className="shell-button shell-button-primary focus-ring">Create Task</button>
                        <button onClick={() => setCreateOpen(false)} className="shell-button shell-button-secondary focus-ring">Cancel</button>
                    </div>
                </section>
            ) : null}

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

                            <div className={columnTasks.length === 0 ? 'flex' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
                                {columnTasks.length === 0 ? (
                                    <div className="surface-card-alt w-full p-8 text-center font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Empty Dropzone</div>
                                ) : columnTasks.map((task) => {
                                    const priority = getPriorityTone(task.priority)
                                    const assignedAgent = agents.find((agent) => agent.id === task.assigned_agent_id)

                                    return (
                                        <article key={task.id} className="surface-card relative overflow-hidden p-5">
                                            <div className={`absolute left-0 top-5 h-[calc(100%-40px)] w-1 ${priority.bar}`}></div>

                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <span className="bg-surface-container-high px-2 py-1 font-mono text-[10px] text-on-surface-variant">{task.id.slice(0, 8).toUpperCase()}</span>
                                                <button onClick={() => void deleteTask(task.id)} className="focus-ring text-on-surface-variant hover:text-error">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <h3 className="mb-3 font-headline text-[22px] font-semibold leading-7 text-on-surface">{task.title}</h3>
                                            <p className="mb-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">{task.description || 'No additional mission context provided.'}</p>

                                            <div className="mb-4 grid gap-3">
                                                <select value={task.status} onChange={(event) => void updateTask(task.id, { status: event.target.value as TaskStatus })} className="focus-ring bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
                                                    {COLUMNS.map((statusOption) => (
                                                        <option key={statusOption.key} value={statusOption.key}>{statusOption.key}</option>
                                                    ))}
                                                </select>
                                                <select value={task.assigned_agent_id ?? ''} onChange={(event) => void updateTask(task.id, { assigned_agent_id: event.target.value || null })} className="focus-ring bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
                                                    <option value="">Unassigned</option>
                                                    {agents.map((agent) => (
                                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                    ))}
                                                </select>
                                            </div>

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
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
