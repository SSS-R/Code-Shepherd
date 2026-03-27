import { useEffect, useState } from 'react'
import { BellRing, Link as LinkIcon, Server, ShieldCheck } from 'lucide-react'
import { buildAuthHeaders } from '../utils/authSession'

interface ConnectorRecord {
    connector_id: string
    connector_name: string
    adapter_kind: string
    transport: string
    trust_status: string
    scopes: string[]
}

export default function Settings() {
    const [connectors, setConnectors] = useState<ConnectorRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') || 'dark')
    const [autoScale, setAutoScale] = useState(true)
    const [desktopNotifications, setDesktopNotifications] = useState(true)

    useEffect(() => {
        fetch('http://localhost:3000/connectors', { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then((data) => {
                setConnectors(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        document.documentElement.dataset.theme = themeMode
        window.localStorage.setItem('code-shepherd-theme', themeMode)
    }, [themeMode])

    const featuredConnector = connectors[0] || {
        connector_id: 'github-enterprise',
        connector_name: 'GitHub Connector',
        adapter_kind: 'repo-sync',
        transport: 'https',
        trust_status: 'connected',
        scopes: ['repo sync', 'PR automation'],
    }

    const sideConnectors = connectors.slice(1, 3).length
        ? connectors.slice(1, 3)
        : [
            { connector_id: 'vscode-extension', connector_name: 'VS Code Extension', adapter_kind: 'ide-link', transport: 'websocket', trust_status: 'connected', scopes: ['live orchestration'] },
            { connector_id: 'slack-relay', connector_name: 'Slack Relay', adapter_kind: 'chat-ops', transport: 'http', trust_status: 'warning', scopes: ['notifications'] },
        ]

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl animate-fade-in pb-16">
            <div className="mb-10">
                <div className="mb-2 flex items-center gap-2">
                    <Server size={14} className="text-primary" />
                    <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Configuration</span>
                </div>
                <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">System Configuration</h1>
                <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Manage connectors, relay infrastructure, interface behavior, and platform-wide operating rules.</p>
            </div>

            <div className="space-y-6">
                <section className="surface-card-alt p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Adapter Connectors</h2>
                        <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Add New Connector</button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                        <div className="surface-card severity-marker-secondary p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center bg-surface-container-lowest text-primary">
                                        <LinkIcon size={18} />
                                    </div>
                                    <div>
                                        <div className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{featuredConnector.connector_name}</div>
                                        <div className="text-xs text-on-surface-variant">{featuredConnector.scopes.join(' · ') || featuredConnector.adapter_kind}</div>
                                    </div>
                                </div>
                                <span className="bg-success/12 px-2 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">Connected</span>
                            </div>
                            <p className="mb-5 text-sm leading-6 text-on-surface-variant">Featured connector is healthy and authorized for repository sync, PR automation, and command relay.</p>
                            <div className="flex flex-wrap gap-3">
                                <button className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2">Reconfigure</button>
                                <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Logs</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {sideConnectors.map((connector) => (
                                <div key={connector.connector_id} className={`surface-card p-5 ${connector.trust_status === 'connected' ? 'severity-marker-secondary' : 'severity-marker-tertiary'}`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{connector.connector_name}</div>
                                        <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${connector.trust_status === 'connected' ? 'text-success' : 'text-warning'}`}>{connector.trust_status}</span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant">{connector.adapter_kind} · {connector.transport}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="surface-card-alt p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-2">
                        <Server size={16} className="text-primary" />
                        <h2 className="font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Relay &amp; Server</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Relay Endpoint URL</label>
                            <input value="https://relay.codeshepherd.internal" readOnly className="w-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none" />
                        </div>
                        <div>
                            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Protocol Buffer Version</label>
                            <select className="w-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none">
                                <option>v2.4 Stable</option>
                                <option>v2.5 Preview</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="surface-card-alt p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" />
                        <h2 className="font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Interface &amp; Theme</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'dark', label: 'Obsidian', previewClass: 'bg-[#131313]' },
                            { key: 'light', label: 'Platinum', previewClass: 'bg-[#f5f5f3]' },
                        ].map((option) => (
                            <button key={option.key} onClick={() => setThemeMode(option.key as 'dark' | 'light')} className={`focus-ring border p-4 text-left ${themeMode === option.key ? 'border-primary' : 'border-outline-variant/20'}`}>
                                <div className={`mb-4 h-28 w-full ${option.previewClass}`}></div>
                                <div className="flex items-center justify-between">
                                    <span className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{option.label}</span>
                                    {themeMode === option.key ? <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Active</span> : null}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="surface-card-alt p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-2">
                        <BellRing size={16} className="text-primary" />
                        <h2 className="font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Toggles</h2>
                    </div>

                    <div className="space-y-4">
                        <ToggleRow label="Auto-Scale Workers" description="Adjust worker capacity based on workload pressure." checked={autoScale} onToggle={() => setAutoScale((value) => !value)} />
                        <ToggleRow label="Desktop Notifications" description="Enable high-signal desktop alerts for approvals and failures." checked={desktopNotifications} onToggle={() => setDesktopNotifications((value) => !value)} />
                    </div>
                </section>
            </div>
        </div>
    )
}

function ToggleRow({
    label,
    description,
    checked,
    onToggle,
}: {
    label: string
    description: string
    checked: boolean
    onToggle: () => void
}) {
    return (
        <div className="flex items-center justify-between gap-4 bg-surface-container p-4">
            <div>
                <div className="font-body text-sm font-semibold text-on-surface">{label}</div>
                <div className="text-xs text-on-surface-variant">{description}</div>
            </div>
            <button onClick={onToggle} className={`focus-ring relative h-6 w-11 ${checked ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                <span className={`absolute top-1 h-4 w-4 bg-on-primary transition-all ${checked ? 'right-1' : 'left-1 bg-outline'}`}></span>
            </button>
        </div>
    )
}
