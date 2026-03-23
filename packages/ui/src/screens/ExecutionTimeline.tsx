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
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_22rem] bg-surface text-on-surface min-h-[calc(100vh-7rem)]">
            {/* Main Content Canvas */}
            <main className="overflow-y-auto custom-scrollbar min-w-0 px-4 md:px-6 lg:px-10 py-8">
                {/* Header Section */}
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-2 animate-slide-up">
                        <div className="flex items-center gap-2 mb-1">
                            <Terminal size={14} className="text-primary" />
                            <span className="font-mono text-[10px] text-outline tracking-[0.2em] uppercase font-bold">System Ledger</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface uppercase">Audit Log</h1>
                        <p className="text-outline font-body text-sm max-w-xl">Chronological sequence of system events and autonomous agent decisions.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-container/50 backdrop-blur-md rounded-xl border border-outline-variant/10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterCategory === 'all' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterCategory('errors')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterCategory === 'errors' ? 'bg-error text-on-error shadow-lg shadow-error/20' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            Errors
                        </button>
                        <button
                            onClick={() => setFilterCategory('approvals')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterCategory === 'approvals' ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20' : 'text-on-surface-variant hover:bg-surface-container'}`}
                        >
                            Approvals
                        </button>
                        <div className="hidden sm:block h-6 w-px bg-outline-variant/30 mx-2"></div>
                        <div className="relative">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search logs..."
                                className="bg-surface-container-lowest/50 border border-outline-variant/20 focus:border-primary/50 text-xs px-3 py-2 rounded-lg w-40 outline-none transition-all placeholder:text-outline/50"
                            />
                        </div>
                        <button onClick={exportJson} className="px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
                            <ArrowRight size={12} className="rotate-90" /> Export
                        </button>
                    </div>
                </header>

                {/* Timeline Container */}
                <section className="max-w-5xl space-y-4">
                    <SessionTimeline events={filtered} limit={limit} />
                </section>

                {/* Footer Pagination */}
                <footer className="mt-12 mb-20 max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-outline font-body">Showing {filtered.length} of {events.length} fetched limits</span>
                    <div className="flex gap-2">
                        <button onClick={() => setLimit(Math.max(50, limit - 50))} className="px-4 py-2 bg-surface-container-low text-xs border border-outline-variant/10 rounded-sm hover:bg-surface-container-high text-on-surface transition-all">Less</button>
                        <button onClick={() => setLimit(limit + 50)} className="px-4 py-2 bg-primary-container/10 text-xs border border-primary/20 rounded-sm text-primary hover:bg-primary/20 transition-all font-semibold">Load More (+50)</button>
                    </div>
                </footer>
            </main>

            {/* Side Inspection Panel */}
            <aside className="hidden 2xl:flex bg-surface-container/30 backdrop-blur-xl border-l border-outline-variant/10 flex-col p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#7bdb80]"></span>
                    <h2 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-on-surface/70">Live Heartbeat</h2>
                </div>

                <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-outline uppercase font-bold tracking-widest">Node Load</span>
                            <span className="text-[10px] text-secondary font-mono font-bold">NORMAL</span>
                        </div>
                        <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                            <div className="h-full bg-secondary shadow-[0_0_10px_#7bdb80] w-[42%] transition-all duration-1000"></div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <span className="text-[10px] text-outline uppercase font-bold tracking-widest block">Active Agents</span>

                        {[
                            { name: 'CO-PILOT-01', status: 'online' },
                            { name: 'SECURITY-SENTRY', status: 'online' },
                            { name: 'DATA-SCRAPER', status: 'offline' }
                        ].map((agent, i) => (
                            <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border border-outline-variant/10 transition-all ${agent.status === 'online' ? 'bg-surface-container/50' : 'bg-surface-container-lowest/30 opacity-40'}`}>
                                <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-secondary shadow-[0_0_8px_#7bdb80]' : 'bg-outline'}`}></div>
                                <span className="text-xs font-mono font-bold text-on-surface tracking-tight">{agent.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="premium-card p-5 rounded-xl border border-outline-variant/10 mt-10">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-3">Audit Registry</span>
                        <div className="space-y-2">
                            <span className="text-[9px] text-outline font-mono block">SHA-256 HASH</span>
                            <p className="font-mono text-[10px] text-on-surface-variant break-all leading-relaxed bg-black/20 p-2 rounded">
                                7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}
