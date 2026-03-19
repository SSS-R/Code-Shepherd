import { useEffect, useMemo, useState } from 'react'

type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done' | 'Failed'

interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    labels: string[]
    assigned_agent_id: string | null
}

const COLUMNS: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done', 'Failed']

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:3000/tasks')
            .then(res => res.json())
            .then(data => {
                setTasks(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

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
                                            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[13px] text-blue-300">{task.priority}</span>
                                        </div>
                                        {task.description && <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{task.description}</p>}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {task.labels.map((label) => (
                                                <span key={label} className="rounded-full border border-white/8 bg-slate-950 px-2 py-1 text-[13px] text-[var(--text-secondary)]">{label}</span>
                                            ))}
                                        </div>
                                        <div className="mt-3 text-[13px] text-[var(--text-muted)]">{task.assigned_agent_id ? `Assigned: ${task.assigned_agent_id}` : 'Unassigned'}</div>
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
