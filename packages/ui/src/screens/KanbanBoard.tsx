import { useEffect, useMemo, useState } from 'react'
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

    const grouped = useMemo(() => {
        return COLUMNS.map((column) => ({
            column,
            tasks: filteredTasks.filter((task) => task.status === column),
        }))
    }, [filteredTasks])

    if (loading) {
        return <div className="glass rounded-2xl p-8 text-[15px] text-[var(--text-secondary)]">Loading task board...</div>
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-2xl p-6 md:p-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="font-headline text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[36px]">Mission Kanban</h2>
                        <p className="mt-2 max-w-2xl text-[15px] text-[var(--text-secondary)]">Track queue, execution, blockers, and completion with a Stitch-inspired operations board for multi-agent coordination.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary rounded-xl px-4 py-3 text-sm font-medium">Filter</button>
                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'all' | Task['priority'])} className="app-input px-4">
                            <option value="all">All priorities</option>
                            <option value="P0">P0</option>
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Task title"
                        className="app-input px-4"
                    />
                    <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Description"
                        className="app-input px-4"
                    />
                    <input
                        value={form.labels}
                        onChange={(e) => setForm({ ...form, labels: e.target.value })}
                        placeholder="Labels (comma separated)"
                        className="app-input px-4"
                    />
                    <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                        className="app-input px-4"
                    >
                        <option value="P0">P0</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                    </select>
                    <div className="flex gap-3">
                        <select
                            value={form.blocked_by_task_id}
                            onChange={(e) => setForm({ ...form, blocked_by_task_id: e.target.value })}
                            className="app-input flex-1 px-4"
                        >
                            <option value="">No dependency</option>
                            {tasks.map((task) => (
                                <option key={task.id} value={task.id}>{task.title}</option>
                            ))}
                        </select>
                        <select
                            value={form.assigned_agent_id}
                            onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value })}
                            className="app-input flex-1 px-4"
                        >
                            <option value="">Unassigned</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <button onClick={() => void createTask()} className="btn-primary rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap">Add Task</button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {grouped.map(({ column, tasks: columnTasks }) => (
                    <section key={column} className="glass rounded-2xl p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-headline text-[15px] font-semibold text-[var(--text-primary)]">{column}</h3>
                            <span className="rounded-full bg-[var(--border-subtle)] px-2 py-1 text-[13px] text-[var(--text-secondary)]">{columnTasks.length}</span>
                        </div>

                        <div className="space-y-3">
                            {columnTasks.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-[13px] text-[var(--text-muted)]">No tasks</div>
                            ) : (
                                columnTasks.map((task) => (
                                    <article key={task.id} className="surface-panel rounded-2xl p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[15px] font-medium text-[var(--text-primary)]">{task.title}</h4>
                                            <select
                                                value={task.priority}
                                                onChange={(e) => void updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                                                className="rounded-full bg-blue-500/10 px-2 py-1 text-[13px] text-[var(--accent-info)] border border-blue-500/20"
                                            >
                                                <option value="P0">P0</option>
                                                <option value="P1">P1</option>
                                                <option value="P2">P2</option>
                                                <option value="P3">P3</option>
                                            </select>
                                        </div>
                                        {task.description && <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{task.description}</p>}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {task.labels.map((label) => (
                                                <span key={label} className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[13px] text-[var(--text-secondary)]">{label}</span>
                                            ))}
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            <select
                                                value={task.blocked_by_task_id || ''}
                                                onChange={(e) => void updateTask(task.id, { blocked_by_task_id: e.target.value || null })}
                                                className="app-input rounded-xl px-3"
                                            >
                                                <option value="">No dependency</option>
                                                {tasks.filter((candidate) => candidate.id !== task.id).map((candidate) => (
                                                    <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={task.status}
                                                onChange={(e) => void updateTask(task.id, { status: e.target.value as TaskStatus })}
                                                className="app-input rounded-xl px-3"
                                            >
                                                {COLUMNS.map((status) => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                            <select
                                                value={task.assigned_agent_id || ''}
                                                onChange={(e) => void updateTask(task.id, { assigned_agent_id: e.target.value || null })}
                                                className="app-input rounded-xl px-3"
                                            >
                                                <option value="">Unassigned</option>
                                                {agents.map((agent) => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                multiple
                                                value={selectedAgentsByTask[task.id] || []}
                                                onChange={(e) => setSelectedAgentsByTask((current) => ({
                                                    ...current,
                                                    [task.id]: Array.from(e.target.selectedOptions).map((option) => option.value),
                                                }))}
                                                className="app-input rounded-xl px-3 min-h-[110px]"
                                            >
                                                {agents.map((agent) => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {task.blocked_by_task_id && (
                                            <div className="mt-3 text-[13px] text-[var(--accent-warning)]">Blocked by: {tasks.find((candidate) => candidate.id === task.blocked_by_task_id)?.title || task.blocked_by_task_id}</div>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button onClick={() => void provisionRuntime(task.id)} className="btn-secondary rounded-xl px-3 py-2 text-[13px] font-medium">Provision Worktree</button>
                                            <button onClick={() => void activateTerminal(task.id)} className="btn-primary rounded-xl px-3 py-2 text-[13px] font-medium">Activate Terminal</button>
                                            <button onClick={() => void assignTaskToAgents(task.id)} className="btn-secondary rounded-xl px-3 py-2 text-[13px] font-medium">Assign Multiple Agents</button>
                                        </div>
                                        {task.assignments && task.assignments.length > 0 && (
                                            <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3 text-[13px] text-[var(--text-secondary)]">
                                                <div className="mb-2 font-medium text-[var(--text-primary)]">Parallel Sessions</div>
                                                <div className="space-y-1">
                                                    {task.assignments.map((assignment) => (
                                                        <div key={`${task.id}-${assignment.agent_id}`}>{assignment.agent_id} · {assignment.role} · conversation {assignment.conversation_id || 'n/a'}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {runtimeByTask[task.id] && (
                                            <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3 text-[13px] text-[var(--text-secondary)]">
                                                <div>Worktree: {runtimeByTask[task.id].worktree_path}</div>
                                                <div>Terminal: {runtimeByTask[task.id].terminal_session_id}</div>
                                                <div>Status: {runtimeByTask[task.id].terminal_status}</div>
                                            </div>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
