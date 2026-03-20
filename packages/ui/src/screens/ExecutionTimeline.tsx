import { useEffect, useMemo, useState } from 'react'
import SessionTimeline, { TimelineEvent } from '../components/SessionTimeline'
import { buildAuthHeaders } from '../utils/authSession'

export default function ExecutionTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [query, setQuery] = useState('')
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`http://localhost:3000/audit-logs?limit=${limit}`, { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then((data) => {
                setEvents(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [limit])

    const filtered = useMemo(() => {
        const normalized = query.toLowerCase()
        return events.filter((event) => JSON.stringify(event).toLowerCase().includes(normalized))
    }, [events, query])

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'agentops-timeline.json'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return <div className="glass rounded-xl p-8 text-[15px] text-[var(--text-secondary)]">Loading timeline...</div>
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-xl p-6 md:p-8">
                <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[32px]">Execution Timeline</h2>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Search and export timeline data across approvals, tools, and system activity.</p>
                <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_160px]">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by action, agent, or event text"
                        className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white placeholder-[var(--text-muted)] focus:outline-none"
                    />
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white">
                        <option value={50}>50 events</option>
                        <option value={100}>100 events</option>
                        <option value={250}>250 events</option>
                    </select>
                    <button onClick={exportJson} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium">Export JSON</button>
                </div>
            </section>

            <SessionTimeline events={filtered} limit={limit} />
        </div>
    )
}
