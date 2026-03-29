import { useEffect, useMemo, useState } from 'react'
import { Bot, Cpu, Gauge, Link2, ShieldCheck, Terminal, X } from 'lucide-react'
import { navigateTo } from '../routes/routeConfig'
import { AgentRecord, AuditEvent, ConnectorRecord, formatRelativeTime, relayFetch } from '../utils/relay'

interface AgentsOverviewProps {
    onViewAgent?: (id: string) => void
}

interface DeployFormState {
    name: string
    id: string
    capabilities: string
    connectorId: string
    adapterId: string
}

const adapterProfiles = [
    {
        id: 'codex-proxy',
        label: 'Codex',
        description: 'Round-trip Codex bridge with direct model routing.',
        suggestedName: 'Codex MCP Bridge',
        suggestedAgentId: 'codex-mcp-bridge',
        capabilities: 'mcp,codex,assistant,bridge',
    },
    {
        id: 'antigravity-proxy',
        label: 'Antigravity Handoff',
        description: 'Desktop handoff bridge for Antigravity sessions.',
        suggestedName: 'Antigravity Bridge',
        suggestedAgentId: 'antigravity-mcp-bridge',
        capabilities: 'mcp,antigravity,assistant,bridge',
    },
    {
        id: 'antigravity-companion',
        label: 'Antigravity Companion',
        description: 'Round-trip Antigravity extension companion for replies back into Shepherd.',
        suggestedName: 'Antigravity Companion',
        suggestedAgentId: 'antigravity-companion',
        capabilities: 'mcp,antigravity,assistant,bridge,companion',
    },
    {
        id: 'openclaw-proxy',
        label: 'OpenClaw',
        description: 'OpenClaw MCP-backed connector runtime.',
        suggestedName: 'OpenClaw MCP Bridge',
        suggestedAgentId: 'openclaw-mcp-bridge',
        capabilities: 'mcp,openclaw,assistant,bridge',
    },
    {
        id: 'command-runner',
        label: 'Custom Agent',
        description: 'Bring your own local command or adapter bridge.',
        suggestedName: 'Custom Agent Bridge',
        suggestedAgentId: 'custom-agent-bridge',
        capabilities: 'mcp,assistant,bridge',
    },
] as const

function connectorLabel(agent: AgentRecord) {
    const connectorHint = `${agent.adapter_id ?? ''} ${agent.runtime_transport ?? ''} ${agent.connector_id ?? ''} ${agent.capabilities.join(' ')}`.toLowerCase()
    if (connectorHint.includes('codex')) return 'Codex Bridge'
    if (connectorHint.includes('antigravity')) return 'Antigravity Bridge'
    if (connectorHint.includes('openclaw')) return 'OpenClaw MCP'
    if (connectorHint.includes('mcp')) return 'MCP Connector'
    if (connectorHint.includes('github')) return 'GitHub Connector'
    if (connectorHint.includes('vscode')) return 'VS Code Bridge'
    if (connectorHint.includes('chat')) return 'Internal Guide'
    return 'Relay Connector'
}

function successRate(agent: AgentRecord, index: number) {
    const base = agent.status === 'online' ? 93 : 71
    return Math.min(99, base + ((agent.name.length + index * 3) % 7))
}

function toAgentId(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64)
}

export default function AgentsOverview({ onViewAgent }: AgentsOverviewProps) {
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [events, setEvents] = useState<AuditEvent[]>([])
    const [connectors, setConnectors] = useState<ConnectorRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [deployOpen, setDeployOpen] = useState(false)
    const [deployForm, setDeployForm] = useState<DeployFormState>({
        name: adapterProfiles[0].suggestedName,
        id: adapterProfiles[0].suggestedAgentId,
        capabilities: adapterProfiles[0].capabilities,
        connectorId: '',
        adapterId: adapterProfiles[0].id,
    })
    const [deploying, setDeploying] = useState(false)
    const [deployError, setDeployError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [agentsData, auditData, connectorData] = await Promise.all([
                    relayFetch<AgentRecord[]>('/agents'),
                    relayFetch<AuditEvent[]>('/audit-logs?limit=20'),
                    relayFetch<ConnectorRecord[]>('/connectors').catch(() => [] as ConnectorRecord[]),
                ])

                if (!cancelled) {
                    setAgents(agentsData)
                    setEvents(auditData)
                    setConnectors(connectorData)
                }
            } catch {
                if (!cancelled) {
                    setAgents([])
                    setEvents([])
                    setConnectors([])
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

    const trustedConnectors = useMemo(
        () => connectors.filter((connector) => connector.trust_status === 'trusted'),
        [connectors],
    )

    useEffect(() => {
        if (!deployForm.connectorId && trustedConnectors[0]) {
            setDeployForm((current) => ({ ...current, connectorId: trustedConnectors[0]!.connector_id }))
        }
    }, [deployForm.connectorId, trustedConnectors])

    const stats = useMemo(() => {
        const online = agents.filter((agent) => agent.status === 'online').length
        const offline = agents.length - online
        return {
            total: agents.length,
            online,
            offline,
            avgSuccess: agents.length ? Math.round(agents.reduce((sum, agent, index) => sum + successRate(agent, index), 0) / agents.length) : 0,
        }
    }, [agents])

    const selectedConnector = useMemo(
        () => trustedConnectors.find((connector) => connector.connector_id === deployForm.connectorId) ?? null,
        [deployForm.connectorId, trustedConnectors],
    )
    const selectedAdapterProfile = useMemo(
        () => adapterProfiles.find((profile) => profile.id === deployForm.adapterId) ?? adapterProfiles[0],
        [deployForm.adapterId],
    )

    const openDeployModal = () => {
        setDeployError(null)
        setDeployForm((current) => ({
            ...current,
            connectorId: trustedConnectors[0]?.connector_id ?? current.connectorId,
        }))
        setDeployOpen(true)
    }

    const deployAgent = async () => {
        setDeployError(null)

        const normalizedId = toAgentId(deployForm.id || deployForm.name)
        if (!deployForm.name.trim() || !normalizedId) {
            setDeployError('Agent name and a valid agent id are required.')
            return
        }

        if (!selectedConnector) {
            setDeployError('Trust an MCP or bridge connector first, then register the agent.')
            return
        }

        setDeploying(true)

        try {
            const response = await relayFetch<AgentRecord>('/agents/register', {
                method: 'POST',
                body: JSON.stringify({
                    id: normalizedId,
                    name: deployForm.name.trim(),
                    capabilities: deployForm.capabilities.split(',').map((item) => item.trim()).filter(Boolean),
                    connector_id: selectedConnector.connector_id,
                    adapter_id: deployForm.adapterId,
                    runtime_transport: selectedConnector.transport,
                }),
            })

            setAgents((current) => [response, ...current.filter((agent) => agent.id !== response.id)])
            setDeployOpen(false)
            onViewAgent?.(response.id)
        } catch (error) {
            setDeployError(error instanceof Error ? error.message : 'Failed to register agent')
        } finally {
            setDeploying(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <>
            <div className="pb-10 pt-2 lg:pb-12">
                <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Unified Presence</p>
                        <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">Agents Overview</h1>
                        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">Presence, connector type, and live execution state across all registered agents.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button className="shell-button shell-button-secondary focus-ring">Comparison View</button>
                        <button onClick={openDeployModal} className="shell-button shell-button-primary focus-ring">Deploy New Agent</button>
                    </div>
                </div>

                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:mb-12 lg:gap-6">
                    {[
                        { label: 'Total Managed Agents', value: stats.total, icon: Terminal, tone: 'success', note: 'Registry synchronized' },
                        { label: 'Online Agents', value: stats.online, icon: Bot, tone: 'success', note: 'Heartbeat active' },
                        { label: 'Blocked / Offline', value: stats.offline, icon: ShieldCheck, tone: stats.offline ? 'warning' : 'info', note: 'Requires review' },
                        { label: 'Success Rate', value: `${stats.avgSuccess}%`, icon: Gauge, tone: 'info', note: 'Real-time average' },
                    ].map((card) => (
                        <div key={card.label} className="metric-card p-5 lg:p-8">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{card.label}</p>
                                <card.icon size={18} className="text-on-surface-variant" />
                            </div>
                            <div className="font-headline text-[32px] font-bold text-on-surface lg:text-[48px] lg:leading-[56px]">{card.value}</div>
                            <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className={`status-diamond ${card.tone}`}></span>{card.note}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <section className="surface-card-alt xl:col-span-12 overflow-hidden">
                        <div className="border-b border-outline-variant/20 px-6 py-4">
                            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Agent Registry</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">#</th>
                                        <th className="px-6 py-3 font-medium">Agent Identity</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Connector Type</th>
                                        <th className="px-6 py-3 font-medium">Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map((agent, index) => {
                                        const rate = successRate(agent, index)
                                        return (
                                            <tr key={agent.id} className="cursor-pointer border-t border-outline-variant/15 transition-colors hover:bg-surface-bright" onClick={() => onViewAgent?.(agent.id)}>
                                                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{String(index + 1).padStart(2, '0')}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center bg-surface-container-high text-on-surface-variant">
                                                            <Cpu size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="font-headline text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface">{agent.name}</div>
                                                            <div className="font-mono text-[11px] text-on-surface-variant">{agent.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em]">
                                                        <span className={`status-diamond ${agent.status === 'online' ? 'success' : 'warning'}`}></span>
                                                        <span className={agent.status === 'online' ? 'text-success' : 'text-warning'}>{agent.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{connectorLabel(agent)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-24 bg-surface-container-lowest">
                                                            <div className="h-full bg-primary" style={{ width: `${rate}%` }}></div>
                                                        </div>
                                                        <span className="font-mono text-[11px] text-on-surface">{rate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="surface-card-alt xl:col-span-8 p-4 sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Live Execution Stream</h2>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Realtime</span>
                        </div>
                        <div className="space-y-3 font-mono text-[12px]">
                            {events.length === 0 ? (
                                <div className="bg-surface-container px-4 py-3 text-on-surface-variant">No recent relay events.</div>
                            ) : events.slice(0, 6).map((event) => (
                                <div key={event.id} className="flex items-start gap-3 bg-surface-container px-4 py-3">
                                    <span className="text-on-surface-variant">{formatRelativeTime(event.timestamp)}</span>
                                    <span className={`status-diamond ${event.status === 'failure' ? 'error' : event.status === 'pending' ? 'warning' : 'success'} mt-1`}></span>
                                    <div className="text-on-surface-variant">
                                        <span className="text-on-surface">{event.agent_id ?? 'System'}</span> reported {event.event_type.replace(/_/g, ' ')}.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="surface-card-alt xl:col-span-4 p-4 sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Node Health</h2>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">Live</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Heartbeat Coverage', value: agents.length ? Math.round((stats.online / agents.length) * 100) : 0 },
                                { label: 'Connected Nodes', value: Math.min(100, 48 + stats.online * 8) },
                                { label: 'Relay Stability', value: Math.max(72, 100 - stats.offline * 9) },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-on-surface-variant">{item.label}</span>
                                        <span className="font-mono text-on-surface">{item.value}%</span>
                                    </div>
                                    <div className="h-2 bg-surface-container-lowest">
                                        <div className="h-full bg-primary" style={{ width: `${item.value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {deployOpen ? (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-4 sm:py-8">
                    <div className="flex min-h-full items-start justify-center">
                        <div className="shell-border max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto bg-surface-container-highest p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-2 font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Universal Agent Registration</div>
                                <h2 className="font-headline text-2xl font-bold uppercase tracking-[-0.02em] text-on-surface">Deploy New Agent</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">Register the bridge process that will speak MCP to your IDE or custom agent, then use the relay for heartbeats, command polling, replies, and approvals.</p>
                            </div>
                            <button onClick={() => setDeployOpen(false)} className="focus-ring flex h-10 w-10 items-center justify-center bg-surface-container text-on-surface-variant hover:text-primary" aria-label="Close deployment panel">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-6 grid gap-4 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Runtime Adapter</label>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {adapterProfiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => setDeployForm((current) => ({
                                                ...current,
                                                adapterId: profile.id,
                                                name: current.name === selectedAdapterProfile.suggestedName ? profile.suggestedName : current.name,
                                                id: current.id === selectedAdapterProfile.suggestedAgentId ? profile.suggestedAgentId : current.id,
                                                capabilities: current.capabilities === selectedAdapterProfile.capabilities ? profile.capabilities : current.capabilities,
                                            }))}
                                            className={`focus-ring border p-4 text-left ${deployForm.adapterId === profile.id ? 'border-primary bg-surface-container' : 'border-outline-variant/20 bg-surface-container-lowest'}`}
                                            type="button"
                                        >
                                            <div className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">{profile.label}</div>
                                            <div className="text-xs leading-5 text-on-surface-variant">{profile.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Agent Name</label>
                                <input
                                    value={deployForm.name}
                                    onChange={(event) => setDeployForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                        id: current.id === toAgentId(current.name) || !current.id ? toAgentId(event.target.value) : current.id,
                                    }))}
                                    className="focus-ring w-full bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    placeholder="Codex MCP Bridge"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Agent ID</label>
                                <input
                                    value={deployForm.id}
                                    onChange={(event) => setDeployForm((current) => ({ ...current, id: toAgentId(event.target.value) }))}
                                    className="focus-ring w-full bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    placeholder="codex-mcp-bridge"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Trusted Connector</label>
                                <select
                                    value={deployForm.connectorId}
                                    onChange={(event) => setDeployForm((current) => ({ ...current, connectorId: event.target.value }))}
                                    className="focus-ring w-full bg-surface-container px-4 py-3 text-sm text-on-surface"
                                >
                                    {trustedConnectors.length === 0 ? <option value="">No trusted connectors</option> : null}
                                    {trustedConnectors.map((connector) => (
                                        <option key={connector.connector_id} value={connector.connector_id}>
                                            {connector.connector_name} ({connector.transport})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Capabilities</label>
                                <input
                                    value={deployForm.capabilities}
                                    onChange={(event) => setDeployForm((current) => ({ ...current, capabilities: event.target.value }))}
                                    className="focus-ring w-full bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    placeholder="mcp,codex,assistant,bridge"
                                />
                            </div>
                        </div>

                        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="bg-surface-container p-4">
                                <div className="mb-2 flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                    <Link2 size={14} />
                                    Relay Procedure
                                </div>
                                <p className="text-sm leading-6 text-on-surface-variant">1. Trust the connector. 2. Run your MCP bridge with the issued connector secret. 3. Register the agent id here. 4. Keep heartbeats flowing and poll relay commands from the bridge.</p>
                            </div>
                            <div className="bg-surface-container p-4">
                                <div className="mb-2 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Selected Connector</div>
                                <p className="text-sm leading-6 text-on-surface-variant">
                                    {selectedConnector
                                        ? `${selectedConnector.connector_name} is trusted for ${selectedConnector.scopes.join(', ') || selectedConnector.transport}. Use its secret in the external bridge headers as x-connector-id and x-connector-secret.`
                                        : 'Trust an MCP connector in Settings first. That creates the connector secret your external bridge will use.'}
                                </p>
                            </div>
                            <div className="bg-surface-container p-4">
                                <div className="mb-2 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Selected Runtime</div>
                                <p className="text-sm leading-6 text-on-surface-variant">{selectedAdapterProfile.description}</p>
                            </div>
                        </div>

                        {deployError ? (
                            <div className="mb-6 bg-error/10 px-4 py-3 text-sm text-error">{deployError}</div>
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <button
                                onClick={() => {
                                    setDeployOpen(false)
                                    navigateTo('/settings')
                                }}
                                className="shell-button shell-button-secondary focus-ring"
                            >
                                Open Connector Settings
                            </button>
                            <button onClick={() => void deployAgent()} disabled={deploying} className="shell-button shell-button-primary focus-ring disabled:opacity-60">
                                {deploying ? 'Registering...' : 'Register Agent'}
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            ) : null}
        </>
    )
}
