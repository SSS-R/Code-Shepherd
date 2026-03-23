import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight, Terminal, Bot, ArrowRight } from 'lucide-react'
import SessionTimeline, { TimelineEvent } from '../components/SessionTimeline'
import { buildAuthHeaders } from '../utils/authSession'

export default function ExecutionTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [query, setQuery] = useState('')
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(true)
    const [filterCategory, setFilterCategory] = useState<'all' | 'errors' | 'approvals' | 'agent_state'>('all')

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
        let docs = events

        if (filterCategory === 'errors') {
            docs = docs.filter(e => e.status === 'failure')
        } else if (filterCategory === 'approvals') {
            docs = docs.filter(e => e.category === 'approval')
        } else if (filterCategory === 'agent_state') {
            docs = docs.filter(e => e.event_type.includes('state') || e.event_type.includes('reconnect'))
        }

        if (query) {
            const normalized = query.toLowerCase()
            docs = docs.filter((event) => JSON.stringify(event).toLowerCase().includes(normalized))
        }

        return docs
    }, [events, query, filterCategory])

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'code-shepherd-timeline.json'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col xl:flex-row bg-surface text-on-surface min-h-[calc(100vh-7rem)] gap-6 xl:gap-0">
            {/* Main Content Canvas */}
            <main className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
                {/* Header Section */}
                <header className="mb-6 md:mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Audit Log</h1>
                        <p className="text-on-surface-variant font-body text-sm">Chronological sequence of system events and autonomous agent decisions.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 p-1 bg-surface-container-low rounded-lg border border-outline-variant/10">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${filterCategory === 'all' ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterCategory('errors')}
                            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${filterCategory === 'errors' ? 'bg-error/20 text-error shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            Errors Only
                        </button>
                        <button
                            onClick={() => setFilterCategory('approvals')}
                            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${filterCategory === 'approvals' ? 'bg-secondary/20 text-secondary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            Approvals
                        </button>
                        <button
                            onClick={() => setFilterCategory('agent_state')}
                            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${filterCategory === 'agent_state' ? 'bg-primary/20 text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            Agent State
                        </button>
                        <div className="hidden sm:block h-4 w-px bg-outline-variant/30 mx-2"></div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find logs..."
                            className="bg-transparent border-none focus:ring-1 focus:ring-primary/50 text-xs text-on-surface-variant w-32 outline-none"
                        />
                        <button onClick={exportJson} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs inline-flex items-center" title="Export JSON">
                            Export
                        </button>
                        <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors inline-flex items-center">
                            <Calendar size={18} />
                        </button>
                    </div>
                </header>

                {/* Timeline Container */}
                <section className="max-w-4xl space-y-4">
                    <SessionTimeline events={filtered} limit={limit} />
                </section>

                {/* Footer Pagination */}
                <footer className="mt-12 mb-20 max-w-4xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-outline font-body">Showing {filtered.length} of {events.length} fetched limits</span>
                    <div className="flex gap-2">
                        <button onClick={() => setLimit(Math.max(50, limit - 50))} className="px-4 py-2 bg-surface-container-low text-xs border border-outline-variant/10 rounded-sm hover:bg-surface-container-high text-on-surface transition-all">Less</button>
                        <button onClick={() => setLimit(limit + 50)} className="px-4 py-2 bg-primary-container/10 text-xs border border-primary/20 rounded-sm text-primary hover:bg-primary/20 transition-all font-semibold">Load More (+50)</button>
                    </div>
                </footer>
            </main>

            {/* Side Inspection Panel (Asymmetric Design Element) */}
            <aside className="hidden xl:flex w-80 shrink-0 bg-surface-container-low border-l border-outline-variant/15 flex-col p-6 overflow-y-auto">
                <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-[#58a6ff] mb-6">Live Heartbeat</h2>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-outline uppercase font-bold">Node Load</span>
                            <span className="text-[10px] text-secondary font-mono">NORMAL</span>
                        </div>
                        <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
                            <div className="h-full bg-secondary w-[42%]"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[10px] text-outline uppercase font-bold block">Active Agents</span>

                        <div className="flex items-center gap-3 p-2 rounded bg-surface-container/50 border border-outline-variant/5">
                            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(123,219,128,0.5)]"></div>
                            <span className="text-xs font-mono text-on-surface">CO-PILOT-01</span>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded bg-surface-container/50 border border-outline-variant/5">
                            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(123,219,128,0.5)]"></div>
                            <span className="text-xs font-mono text-on-surface">SECURITY-SENTRY</span>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded bg-surface-container/50 border border-outline-variant/5 opacity-50">
                            <div className="w-2 h-2 rounded-full bg-outline"></div>
                            <span className="text-xs font-mono text-on-surface">DATA-SCRAPER</span>
                        </div>
                    </div>

                    <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/10 mt-auto">
                        <span className="text-[10px] text-[#58a6ff] uppercase font-bold block mb-2">Audit Hash</span>
                        <p className="font-mono text-[10px] text-outline break-all leading-tight">
                            SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    )
}
