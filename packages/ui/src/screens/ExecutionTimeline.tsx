import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, Calendar, ChevronRight, Search, ShieldCheck, Terminal } from 'lucide-react'
import SessionTimeline, { TimelineEvent } from '../components/SessionTimeline'
import { relayFetch } from '../utils/relay'

export default function ExecutionTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [query, setQuery] = useState('')
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(true)
    const [filterCategory, setFilterCategory] = useState<'all' | 'errors' | 'approvals' | 'agent_state'>('all')

    useEffect(() => {
        relayFetch<TimelineEvent[]>(`/audit-logs?limit=${limit}`)
            .then((data) => {
                setEvents(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [limit])

    const filtered = useMemo(() => {
        let docs = events

        if (filterCategory === 'errors') {
            docs = docs.filter((event) => event.status === 'failure')
        } else if (filterCategory === 'approvals') {
            docs = docs.filter((event) => event.category === 'approval')
        } else if (filterCategory === 'agent_state') {
            docs = docs.filter((event) => event.event_type.includes('state') || event.event_type.includes('reconnect'))
        }

        if (query) {
            const normalized = query.toLowerCase()
            docs = docs.filter((event) => JSON.stringify(event).toLowerCase().includes(normalized))
        }

        return docs
    }, [events, query, filterCategory])

    const successCount = filtered.filter((event) => event.status === 'success').length
    const failureCount = filtered.filter((event) => event.status === 'failure').length
    const approvalCount = filtered.filter((event) => event.category === 'approval').length

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
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <main className="min-w-0">
                <header className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Terminal size={14} className="text-primary" />
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Auditability</span>
                        </div>
                        <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">Timeline / Audit Log</h1>
                        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">Chronological visibility across approvals, failures, reconnects, and operator interventions.</p>
                    </div>

                    <div className="surface-card-alt flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'errors', label: 'Failures' },
                            { key: 'approvals', label: 'Approvals' },
                            { key: 'agent_state', label: 'Agent State' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setFilterCategory(item.key as typeof filterCategory)}
                                className={`focus-ring min-h-[40px] px-4 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${filterCategory === item.key ? 'bg-surface-container-high text-primary' : 'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                            >
                                {item.label}
                            </button>
                        ))}

                        <label className="relative block min-w-[180px] flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Filter by agent or event"
                                className="focus-ring w-full bg-surface-container-lowest py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant"
                            />
                        </label>

                        <button className="focus-ring flex h-10 w-10 items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary">
                            <Calendar size={16} />
                        </button>

                        <button onClick={exportJson} className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Export</button>
                    </div>
                </header>

                <section className="max-w-5xl">
                    <SessionTimeline events={filtered} limit={limit} />
                </section>

                <footer className="mt-10 flex flex-col gap-4 border-t border-outline-variant/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-on-surface-variant">Showing {filtered.length} of {events.length} loaded events</span>
                    <div className="flex gap-3">
                        <button onClick={() => setLimit(Math.max(50, limit - 50))} className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Less</button>
                        <button onClick={() => setLimit(limit + 50)} className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2">Load More</button>
                    </div>
                </footer>
            </main>

            <aside className="surface-card-alt hidden xl:flex xl:flex-col xl:p-6">
                <div className="mb-6 flex items-center gap-2">
                    <span className="status-diamond success"></span>
                    <h2 className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Event Analytics</h2>
                </div>

                <div className="space-y-5">
                    <div className="surface-card px-4 py-4">
                        <p className="mb-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Success Distribution</p>
                        <div className="font-headline text-[32px] font-bold text-on-surface">{events.length ? Math.round((successCount / events.length) * 100) : 0}%</div>
                        <div className="mt-3 h-2 bg-surface-container-lowest">
                            <div className="h-full bg-success" style={{ width: `${events.length ? (successCount / events.length) * 100 : 0}%` }}></div>
                        </div>
                    </div>

                    <div className="surface-card px-4 py-4">
                        <p className="mb-3 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Signal Integrity</p>
                        <div className="grid grid-cols-12 items-end gap-1 h-24">
                            {[32, 46, 40, 61, 58, 70, 66, 75, 72, 80, 76, 84].map((value, index) => (
                                <div key={index} className="bg-primary/65" style={{ height: `${value}%` }}></div>
                            ))}
                        </div>
                    </div>

                    <div className="surface-card px-4 py-4">
                        <p className="mb-3 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Live Counters</p>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between"><span className="text-on-surface-variant">Approvals</span><span className="font-headline text-on-surface">{approvalCount}</span></div>
                            <div className="flex items-center justify-between"><span className="text-on-surface-variant">Failures</span><span className="font-headline text-error">{failureCount}</span></div>
                            <div className="flex items-center justify-between"><span className="text-on-surface-variant">Successes</span><span className="font-headline text-success">{successCount}</span></div>
                        </div>
                    </div>

                    <div className="surface-card px-4 py-4">
                        <p className="mb-3 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Active Filters</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-surface-container-high px-3 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{filterCategory}</span>
                            {query ? <span className="bg-surface-container-high px-3 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface">search</span> : null}
                        </div>
                    </div>

                    <div className="surface-card px-4 py-4">
                        <div className="mb-3 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" />
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Registry Hash</span>
                        </div>
                        <p className="font-mono text-[11px] leading-6 text-on-surface-variant break-all">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</p>
                        <button className="mt-4 flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                            View Logs <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    )
}
