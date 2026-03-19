import { useEffect, useMemo, useState } from 'react'

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

const COLUMNS: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done', 'Failed']

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'P2' as Task['priority'],
        labels: '',
        assigned_agent_id: '',
        blocked_by_task_id: '',
    })

    useEffect(() => {
        fetch('http://localhost:3000/tasks')
            .then(res => res.json())
            .then(data => {
                setTasks(data)
                return fetch('http://localhost:3000/agents')
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
                fetch('http://localhost:3000/tasks')
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        })

        if (res.ok) {
            const updated = await res.json()
            setTasks(current => current.map(task => task.id === taskId ? updated : task))
        }
    }

    const grouped = useMemo(() => {
        return COLUMNS.map((column) => ({
            column,
            tasks: tasks.filter((task) => task.status === column),
        }))
    }, [tasks])

    if (loading) {
        return <div className="glass rounded-xl p-8 text-[15px] text-[var(--text-secondary)]">Loading task board...</div>
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-xl p-6 md:p-8">
                <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[32px]">Operational task board</h2>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Phase 2 foundation for tracking agent work across queue, execution, blockers, and outcomes.</p>
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Task title"
                        className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white placeholder-[var(--text-muted)] focus:outline-none"
                    />
                    <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Description"
                        className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white placeholder-[var(--text-muted)] focus:outline-none"
                    />
                    <input
                        value={form.labels}
                        onChange={(e) => setForm({ ...form, labels: e.target.value })}
                        placeholder="Labels (comma separated)"
                        className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white placeholder-[var(--text-muted)] focus:outline-none"
                    />
                    <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                        className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white focus:outline-none"
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
                            className="surface-panel flex-1 rounded-lg px-4 py-3 text-[15px] text-white focus:outline-none"
                        >
                            <option value="">No dependency</option>
                            {tasks.map((task) => (
                                <option key={task.id} value={task.id}>{task.title}</option>
                            ))}
                        </select>
                        <select
                            value={form.assigned_agent_id}
                            onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value })}
                            className="surface-panel flex-1 rounded-lg px-4 py-3 text-[15px] text-white focus:outline-none"
                        >
                            <option value="">Unassigned</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <button onClick={() => void createTask()} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium whitespace-nowrap">Add Task</button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {grouped.map(({ column, tasks: columnTasks }) => (
                    <section key={column} className="glass rounded-xl p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{column}</h3>
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[13px] text-[var(--text-secondary)]">{columnTasks.length}</span>
                        </div>

                        <div className="space-y-3">
                            {columnTasks.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-white/10 p-4 text-[13px] text-[var(--text-muted)]">No tasks</div>
                            ) : (
                                columnTasks.map((task) => (
                                    <article key={task.id} className="surface-panel rounded-lg p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[15px] font-medium text-[var(--text-primary)]">{task.title}</h4>
                                            <select
                                                value={task.priority}
                                                onChange={(e) => void updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                                                className="rounded-full bg-blue-500/10 px-2 py-1 text-[13px] text-blue-300 border border-blue-500/20"
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
                                                <span key={label} className="rounded-full border border-white/8 bg-slate-950 px-2 py-1 text-[13px] text-[var(--text-secondary)]">{label}</span>
                                            ))}
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            <select
                                                value={task.blocked_by_task_id || ''}
                                                onChange={(e) => void updateTask(task.id, { blocked_by_task_id: e.target.value || null })}
                                                className="surface-panel rounded-lg px-3 py-2 text-[13px] text-white"
                                            >
                                                <option value="">No dependency</option>
                                                {tasks.filter((candidate) => candidate.id !== task.id).map((candidate) => (
                                                    <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={task.status}
                                                onChange={(e) => void updateTask(task.id, { status: e.target.value as TaskStatus })}
                                                className="surface-panel rounded-lg px-3 py-2 text-[13px] text-white"
                                            >
                                                {COLUMNS.map((status) => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                            <select
                                                value={task.assigned_agent_id || ''}
                                                onChange={(e) => void updateTask(task.id, { assigned_agent_id: e.target.value || null })}
                                                className="surface-panel rounded-lg px-3 py-2 text-[13px] text-white"
                                            >
                                                <option value="">Unassigned</option>
                                                {agents.map((agent) => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {task.blocked_by_task_id && (
                                            <div className="mt-3 text-[13px] text-amber-300">Blocked by: {tasks.find((candidate) => candidate.id === task.blocked_by_task_id)?.title || task.blocked_by_task_id}</div>
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
