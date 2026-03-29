import { useEffect, useMemo, useState } from 'react'
import { BellRing, Copy, Link as LinkIcon, PlugZap, RotateCw, Server, ShieldCheck } from 'lucide-react'
import { useOperator } from '../context/OperatorContext'
import { AgentRecord, ConnectorRecord, PairingSessionResponse, relayFetch } from '../utils/relay'

const connectorPresets = [
    {
        key: 'openclaw',
        title: 'OpenClaw MCP',
        description: 'Recommended preset for your OpenClaw MCP-backed bridge.',
        connector_id: 'openclaw-mcp',
        connector_name: 'OpenClaw MCP',
        adapter_kind: 'mcp',
        transport: 'mcp',
        scopes: 'messages,approvals',
    },
    {
        key: 'universal-mcp',
        title: 'Universal MCP Bridge',
        description: 'Generic MCP connector for Codex, Claude agents, and custom MCP-capable runtimes.',
        connector_id: 'universal-mcp',
        connector_name: 'Universal MCP Bridge',
        adapter_kind: 'mcp',
        transport: 'mcp',
        scopes: 'messages,approvals',
    },
    {
        key: 'local-bridge',
        title: 'Local Agent Bridge',
        description: 'Local desktop bridge preset for CLI or IDE-connected agent runtimes.',
        connector_id: 'local-agent-bridge',
        connector_name: 'Local Agent Bridge',
        adapter_kind: 'bridge',
        transport: 'local',
        scopes: 'messages,approvals',
    },
] as const

const openClawPreset = connectorPresets[0]

export default function Settings() {
    const [connectors, setConnectors] = useState<ConnectorRecord[]>([])
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [secretNotice, setSecretNotice] = useState<string | null>(null)
    const [pairingSession, setPairingSession] = useState<PairingSessionResponse | null>(null)
    const [pairingNotice, setPairingNotice] = useState<string | null>(null)
    const [pairingBusy, setPairingBusy] = useState(false)
    const [selectedPresetKey, setSelectedPresetKey] = useState<(typeof connectorPresets)[number]['key']>(openClawPreset.key)
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null)
    const [selectedPairingAgentId, setSelectedPairingAgentId] = useState<string | null>(null)
    const [form, setForm] = useState(openClawPreset)
    const { preferences, updatePreferences } = useOperator()

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [connectorData, agentData] = await Promise.all([
                    relayFetch<ConnectorRecord[]>('/connectors'),
                    relayFetch<AgentRecord[]>('/agents').catch(() => [] as AgentRecord[]),
                ])
                if (!cancelled) {
                    setConnectors(connectorData)
                    setAgents(agentData)
                }
            } catch {
                if (!cancelled) {
                    setConnectors([])
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
        }, 12000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [])

    const selectedPreset = useMemo(
        () => connectorPresets.find((preset) => preset.key === selectedPresetKey) ?? openClawPreset,
        [selectedPresetKey],
    )
    const featuredConnector = useMemo(() => {
        if (selectedConnectorId) {
            return connectors.find((connector) => connector.connector_id === selectedConnectorId) ?? connectors[0] ?? null
        }

        return connectors[0] ?? null
    }, [connectors, selectedConnectorId])

    useEffect(() => {
        if (!connectors.length) {
            if (selectedConnectorId !== null) {
                setSelectedConnectorId(null)
            }
            return
        }

        if (!selectedConnectorId || !connectors.some((connector) => connector.connector_id === selectedConnectorId)) {
            setSelectedConnectorId(connectors[0].connector_id)
        }
    }, [connectors, selectedConnectorId])

    const pairingCandidates = useMemo(() => {
        if (!featuredConnector) {
            return agents
        }

        return agents.filter((agent) => !agent.connector_id || agent.connector_id === featuredConnector.connector_id)
    }, [agents, featuredConnector])

    useEffect(() => {
        if (!pairingCandidates.length) {
            if (selectedPairingAgentId !== null) {
                setSelectedPairingAgentId(null)
            }
            return
        }

        if (!selectedPairingAgentId || !pairingCandidates.some((agent) => agent.id === selectedPairingAgentId)) {
            setSelectedPairingAgentId(pairingCandidates[0].id)
        }
    }, [pairingCandidates, selectedPairingAgentId])

    const createConnector = async () => {
        const response = await relayFetch<ConnectorRecord>('/connectors', {
            method: 'POST',
            body: JSON.stringify({
                connector_id: form.connector_id,
                connector_name: form.connector_name,
                adapter_kind: form.adapter_kind,
                transport: form.transport,
                scopes: form.scopes.split(',').map((item) => item.trim()).filter(Boolean),
            }),
        })

        setConnectors((current) => [response, ...current.filter((connector) => connector.connector_id !== response.connector_id)])
        setSelectedConnectorId(response.connector_id)
        setSecretNotice(response.connector_secret ? `Connector secret generated for ${response.connector_name}: ${response.connector_secret}` : null)
        setPairingSession(null)
        setPairingNotice(`${response.connector_name} is now the active connector profile.`)
    }

    const revokeConnector = async (connectorId: string) => {
        await relayFetch(`/connectors/${connectorId}/revoke`, { method: 'POST' })
        setConnectors((current) => current.map((connector) => connector.connector_id === connectorId ? { ...connector, trust_status: 'revoked' } : connector))
        setPairingSession(null)
        setPairingNotice(`Connector ${connectorId} is now revoked.`)
    }

    const rotateSecret = async (connectorId: string) => {
        const response = await relayFetch<{ connector_secret: string }>(`/connectors/${connectorId}/rotate-secret`, { method: 'POST' })
        setSecretNotice(`Rotated secret for ${connectorId}: ${response.connector_secret}`)
    }

    const createPairingSession = async (connectorId: string) => {
        setPairingBusy(true)
        setPairingNotice(null)

        try {
            const selectedAgent = pairingCandidates.find((agent) => agent.id === selectedPairingAgentId)
            const response = await relayFetch<PairingSessionResponse>(`/connectors/${connectorId}/pairing-sessions`, {
                method: 'POST',
                body: JSON.stringify({
                    agent_id: selectedAgent?.id,
                    agent_name: selectedAgent?.name,
                    adapter_id: selectedAgent?.adapter_id,
                    agent_capabilities: selectedAgent?.capabilities,
                    expires_in_minutes: 10,
                }),
            })
            setPairingSession(response)
        } catch (error) {
            setPairingNotice(error instanceof Error ? error.message : 'Failed to create pairing session')
        } finally {
            setPairingBusy(false)
        }
    }

    const copyPairingCommand = async () => {
        if (!pairingSession) return

        try {
            await navigator.clipboard.writeText(pairingSession.launch_command)
            setPairingNotice(`Pairing command copied. Run it on the PC that hosts ${pairingSession.agent_name}.`)
        } catch {
            setPairingNotice('Copy failed. Select and copy the command manually.')
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
                        <button onClick={() => {
                            setSelectedPresetKey(openClawPreset.key)
                            setForm(openClawPreset)
                            setSelectedConnectorId(openClawPreset.connector_id)
                        }} className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Use OpenClaw MCP Preset</button>
                    </div>

                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        {connectorPresets.map((preset) => (
                            <button
                                key={preset.key}
                                onClick={() => {
                                    setSelectedPresetKey(preset.key)
                                    setForm(preset)
                                    setSelectedConnectorId(preset.connector_id)
                                }}
                                className={`focus-ring border p-4 text-left ${selectedPresetKey === preset.key ? 'border-primary bg-surface-container' : 'border-outline-variant/20 bg-surface-container-lowest'}`}
                            >
                                <div className="mb-2 font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{preset.title}</div>
                                <div className="text-xs leading-5 text-on-surface-variant">{preset.description}</div>
                                <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">{preset.adapter_kind} · {preset.transport}</div>
                            </button>
                        ))}
                    </div>

                    <div className="mb-6 grid gap-4 lg:grid-cols-5">
                        <ReadOnlyConfig label="Connector Name" value={selectedPreset.connector_name} />
                        <ReadOnlyConfig label="Connector ID" value={selectedPreset.connector_id} />
                        <ReadOnlyConfig label="Adapter Kind" value={selectedPreset.adapter_kind} />
                        <ReadOnlyConfig label="Transport" value={selectedPreset.transport} />
                        <ReadOnlyConfig label="Scopes" value={selectedPreset.scopes} />
                    </div>

                    <div className="mb-6 flex gap-3">
                        <button onClick={() => void createConnector()} className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2">Trust Connector</button>
                        <span className="text-sm text-on-surface-variant">{selectedPreset.description}</span>
                    </div>

                    {secretNotice ? (
                        <div className="mb-6 bg-surface-container px-4 py-4 text-sm text-on-surface-variant">
                            {secretNotice}
                        </div>
                    ) : null}

                    {pairingSession ? (
                        <div className="mb-6 bg-surface-container px-4 py-4 text-sm text-on-surface-variant">
                            <div className="mb-3 flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                                <PlugZap size={14} />
                                Local Pairing Ready
                            </div>
                            <p className="mb-3 leading-6">Run this one-time command on the computer that hosts {pairingSession.agent_name}. It will exchange the pairing code, store the local gateway session, and connect the helper without exposing the master connector secret.</p>
                            <div className="mb-3 bg-surface-container-lowest px-3 py-3 font-mono text-[12px] text-on-surface break-all">{pairingSession.launch_command}</div>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <span>Pairing code: <strong>{pairingSession.pairing_code}</strong></span>
                                <span>Expires: {new Date(pairingSession.expires_at).toLocaleTimeString()}</span>
                                {pairingSession.session_file ? <span>Session file: <strong>{pairingSession.session_file}</strong></span> : null}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button onClick={() => void copyPairingCommand()} className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2">
                                    <Copy size={14} />
                                    Copy Command
                                </button>
                                <button onClick={() => setPairingSession(null)} className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Clear</button>
                            </div>
                        </div>
                    ) : null}

                    {pairingNotice ? (
                        <div className="mb-6 bg-surface-container px-4 py-4 text-sm text-on-surface-variant">
                            {pairingNotice}
                        </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                        <div className="surface-card severity-marker-secondary p-6">
                            {featuredConnector ? (
                                <>
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
                                        <span className={`px-2 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${featuredConnector.trust_status === 'trusted' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'}`}>{featuredConnector.trust_status}</span>
                                    </div>
                                    <p className="mb-5 text-sm leading-6 text-on-surface-variant">Featured connector is healthy and authorized for relay orchestration, approvals, and conversation polling.</p>
                                    <div className="mb-5">
                                        <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Pair To Deployed Agent</label>
                                        <select
                                            value={selectedPairingAgentId ?? ''}
                                            onChange={(event) => setSelectedPairingAgentId(event.target.value || null)}
                                            className="focus-ring w-full bg-surface-container px-4 py-3 text-sm text-on-surface"
                                        >
                                            {pairingCandidates.length === 0 ? <option value="">Deploy an agent first</option> : null}
                                            {pairingCandidates.map((agent) => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name} ({agent.adapter_id ?? agent.runtime_transport ?? 'bridge'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={() => void rotateSecret(featuredConnector.connector_id)} className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2"><RotateCw size={14} /> Rotate Secret</button>
                                        <button onClick={() => void createPairingSession(featuredConnector.connector_id)} disabled={pairingBusy || pairingCandidates.length === 0} className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2 disabled:opacity-60"><PlugZap size={14} /> {pairingBusy ? 'Preparing...' : 'Generate Pairing'}</button>
                                        <button onClick={() => void revokeConnector(featuredConnector.connector_id)} className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Revoke</button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-on-surface-variant">No trusted connectors yet.</div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {connectors.slice(1).map((connector) => (
                                <div key={connector.connector_id} className={`surface-card p-5 ${connector.trust_status === 'trusted' ? 'severity-marker-secondary' : 'severity-marker-tertiary'}`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{connector.connector_name}</div>
                                        <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${connector.trust_status === 'trusted' ? 'text-success' : 'text-warning'}`}>{connector.trust_status}</span>
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
                            <input value="http://localhost:3000" readOnly className="w-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none" />
                        </div>
                        <div>
                            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Connector Strategy</label>
                            <input value="MCP-backed bridge for OpenClaw" readOnly className="w-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none" />
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
                            <button key={option.key} onClick={() => void updatePreferences({ theme_mode: option.key as 'dark' | 'light' })} className={`focus-ring border p-4 text-left ${preferences.theme_mode === option.key ? 'border-primary' : 'border-outline-variant/20'}`}>
                                <div className={`mb-4 h-28 w-full ${option.previewClass}`}></div>
                                <div className="flex items-center justify-between">
                                    <span className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-on-surface">{option.label}</span>
                                    {preferences.theme_mode === option.key ? <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Active</span> : null}
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
                        <ToggleRow label="Auto-Scale Workers" description="Adjust worker capacity based on workload pressure." checked={preferences.auto_scale_workers} onToggle={() => void updatePreferences({ auto_scale_workers: !preferences.auto_scale_workers })} />
                        <ToggleRow label="Desktop Notifications" description="Enable high-signal desktop alerts for approvals and failures." checked={preferences.desktop_notifications} onToggle={() => void updatePreferences({ desktop_notifications: !preferences.desktop_notifications })} />
                    </div>
                </section>
            </div>
        </div>
    )
}

function ReadOnlyConfig({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</label>
            <div className="bg-surface-container px-4 py-3 text-sm text-on-surface">{value}</div>
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
