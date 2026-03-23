import { useEffect, useState } from 'react'
import { Command } from 'lucide-react'
import { buildAuthHeaders, clearSession, loadSession, saveSession } from '../utils/authSession'

interface Team {
    id: string
    name: string
    role: string
}

interface Invitation {
    id: string
    email: string
    role: string
    status: string
}

interface ConnectorRecord {
    connector_id: string
    connector_name: string
    adapter_kind: string
    transport: string
    trust_status: string
    scopes: string[]
}

interface ConnectorEventRecord {
    id: string
    connector_id: string
    event_type: string
    created_at: string
    event_details: Record<string, unknown>
}

interface PlanCard {
    id: string
    name: string
    priceLabel: string
    audience: string
    badge?: string
    description: string
    features: string[]
    cta: string
    highlight?: boolean
}

const PLAN_CARDS: PlanCard[] = [
    {
        id: 'free',
        name: 'Free',
        priceLabel: '$0',
        audience: 'Early individual users',
        badge: 'Always available',
        description: 'Entry tier for trying Code Shepherd before upgrading into deeper agent supervision and parallel operations.',
        features: [
            'Single-user access',
            'Limited number of connected agents',
            'Basic inbox, approvals, and visibility flows',
            'Good for evaluating the product before moving to Pro',
        ],
        cta: 'Start Free',
    },
    {
        id: 'beta-pro',
        name: 'Beta Pro',
        priceLabel: '$19/mo',
        audience: 'Whitelisted beta users only',
        badge: '200-seat whitelist',
        description: 'Beta Pro access is granted from the website waitlist on a first-come, first-served basis until the 200-user whitelist is full.',
        features: [
            'Full Pro feature access during beta testing',
            'Website waitlist feeds the first 200 approved beta invitations',
            '50% off the first 2 months of Pro after public launch',
            'Priority product feedback loop during beta period',
        ],
        cta: 'Request Beta Pro Access',
        highlight: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        priceLabel: '$19/mo',
        audience: 'Individual power users',
        description: 'For solo developers who want always-on agent supervision, approvals, inbox access, and multi-agent control.',
        features: [
            'Unlimited connected agents',
            'Inbox, approvals, timeline, and coordination flows',
            'Mobile and desktop supervision',
            'Public-launch tier after beta ends',
        ],
        cta: 'Upgrade to Pro',
    },
    {
        id: 'max',
        name: 'Max',
        priceLabel: 'Planning',
        audience: 'Heavy B2C operator tier',
        badge: 'Coming next',
        description: 'For users running larger multi-agent workloads, deeper automation, and higher operational limits.',
        features: [
            'Planned higher concurrency and usage limits',
            'Planned deeper automation and premium governance tools',
            'Whitelisted beta users will get 20% off if they choose Max after launch',
            'Final pricing still to be locked before launch',
        ],
        cta: 'Join Max Waitlist',
    },
]

export default function Settings() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [teamName, setTeamName] = useState('')
    const [userId, setUserId] = useState('')
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('Developer')
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [connectors, setConnectors] = useState<ConnectorRecord[]>([])
    const [connectorEvents, setConnectorEvents] = useState<ConnectorEventRecord[]>([])
    const [connectorForm, setConnectorForm] = useState({ connector_id: '', connector_name: '', adapter_kind: 'bridge', transport: 'http', scopes: 'messages,approvals' })
    const [sessionLabel, setSessionLabel] = useState('No session yet')
    const [jsonOutputMode, setJsonOutputMode] = useState(true)
    const [extendedLogging, setExtendedLogging] = useState(false)
    const [alertPrefs, setAlertPrefs] = useState({ failures: true, queue: true, marketing: false })
    const activeRole = teams.find((team) => team.id === selectedTeamId)?.role || loadSession()?.role || 'Developer'

    useEffect(() => {
        const session = loadSession()
        if (session) {
            setUserId(session.userId)
            setSelectedTeamId(session.teamId ?? '')
            setSessionLabel(`Signed in as ${session.name || session.userId}`)
        }
    }, [])

    useEffect(() => {
        void loadConnectors()
        if (selectedTeamId) {
            void loadInvitations()
        }
    }, [selectedTeamId])

    const signUp = async () => {
        const res = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({ email, password, name, teamName }),
        })

        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setSessionLabel(`Signed in as ${data.user.name}`)
            if (data.team) {
                setTeams([data.team])
                setSelectedTeamId(data.team.id)
                saveSession({ userId: data.user.id, teamId: data.team.id, role: data.team.role, name: data.user.name, email: data.user.email })
            } else {
                saveSession({ userId: data.user.id, teamId: null, role: 'Developer', name: data.user.name, email: data.user.email })
            }
        }
    }

    const login = async () => {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({ email, password }),
        })

        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setSessionLabel(`Signed in as ${data.user.name}`)
            setTeams(data.teams || [])
            if (data.teams?.[0]?.id) {
                setSelectedTeamId(data.teams[0].id)
                saveSession({ userId: data.user.id, teamId: data.teams[0].id, role: data.teams[0].role, name: data.user.name, email: data.user.email })
            } else {
                saveSession({ userId: data.user.id, teamId: null, role: 'Developer', name: data.user.name, email: data.user.email })
            }
        }
    }

    const seedDemo = async () => {
        const res = await fetch('http://localhost:3000/demo/seed', { method: 'POST', headers: buildAuthHeaders() })
        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setTeams([data.team])
            setSelectedTeamId(data.team.id)
            setSessionLabel(`Demo loaded for ${data.user.name}`)
            saveSession({ userId: data.user.id, teamId: data.team.id, role: data.team.role, name: data.user.name, email: data.user.email })
        }
    }

    const loadTeams = async () => {
        if (!userId) return
        const res = await fetch(`http://localhost:3000/auth/teams?userId=${userId}`, { headers: buildAuthHeaders() })
        if (res.ok) {
            const data = await res.json()
            setTeams(data)
            if (data[0]?.id) setSelectedTeamId(data[0].id)
        }
    }

    const loadInvitations = async () => {
        if (!selectedTeamId) return
        const res = await fetch(`http://localhost:3000/auth/teams/${selectedTeamId}/invitations`, { headers: buildAuthHeaders() })
        if (res.ok) setInvitations(await res.json())
    }

    const createInvitation = async () => {
        if (!selectedTeamId || !inviteEmail) return
        const res = await fetch(`http://localhost:3000/auth/teams/${selectedTeamId}/invitations`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        })
        if (res.ok) {
            setInviteEmail('')
            void loadInvitations()
        }
    }

    const acceptInvitation = async (invitationId: string) => {
        if (!userId) return
        const res = await fetch(`http://localhost:3000/auth/invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({ userId }),
        })
        if (res.ok) {
            void loadInvitations()
            void loadTeams()
        }
    }

    const signOut = () => {
        clearSession()
        setUserId('')
        setTeams([])
        setSelectedTeamId('')
        setInvitations([])
        setSessionLabel('No session yet')
    }

    const loadConnectors = async () => {
        const res = await fetch('http://localhost:3000/connectors', { headers: buildAuthHeaders() })
        if (res.ok) setConnectors(await res.json())

        const eventsRes = await fetch('http://localhost:3000/connectors/events', { headers: buildAuthHeaders() })
        if (eventsRes.ok) setConnectorEvents(await eventsRes.json())
    }

    const trustConnector = async () => {
        const res = await fetch('http://localhost:3000/connectors', {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({
                ...connectorForm,
                scopes: connectorForm.scopes.split(',').map((scope) => scope.trim()).filter(Boolean),
            }),
        })

        if (res.ok) {
            setConnectorForm({ connector_id: '', connector_name: '', adapter_kind: 'bridge', transport: 'http', scopes: 'messages,approvals' })
            void loadConnectors()
        }
    }

    const revokeConnector = async (connectorId: string) => {
        const res = await fetch(`http://localhost:3000/connectors/${connectorId}/revoke`, {
            method: 'POST',
            headers: buildAuthHeaders(),
        })

        if (res.ok) {
            void loadConnectors()
        }
    }

    return (
        <div className="space-y-6">
            <section className="stitch-panel p-8">
                <div className="mb-10">
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-[var(--text-primary)]">Configuration</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Manage global system parameters, external integrations, and team access.</p>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <section className="col-span-12">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-headline text-lg font-medium text-[var(--text-primary)]">Adapter Connectors</h3>
                            <button onClick={() => void trustConnector()} disabled={activeRole !== 'Admin'} className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--accent-primary-strong)] disabled:opacity-50">
                                Register_New_Mcp
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {(connectors.length > 0 ? connectors.slice(0, 3) : [
                                { connector_id: 'github-enterprise', connector_name: 'GitHub Enterprise', adapter_kind: 'repo-sync', transport: 'https', trust_status: 'connected', scopes: ['repo sync', 'pr automation'] },
                                { connector_id: 'vscode-extension', connector_name: 'VS Code Extension', adapter_kind: 'ide-link', transport: 'websocket', trust_status: 'connected', scopes: ['live ide orchestration'] },
                                { connector_id: 'slack-relay', connector_name: 'Slack Relay', adapter_kind: 'chat-ops', transport: 'http', trust_status: 'warning', scopes: ['notifications', 'control'] },
                            ]).map((connector, index) => {
                                const warning = connector.trust_status !== 'connected'
                                const accentClass = warning ? 'border-l-[var(--accent-warning)]' : 'border-l-[var(--accent-success)]'

                                return (
                                    <div key={connector.connector_id} className={`stitch-card border-l-2 p-4 ${accentClass}`}>
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--bg-base)] text-[var(--accent-primary-strong)]">
                                                <Command size={16} />
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${warning ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]' : 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'}`}>
                                                {warning ? 'warning' : 'connected'}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-[var(--text-primary)]">{connector.connector_name}</h4>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">{connector.scopes.join(' & ') || connector.adapter_kind}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-mono italic text-[var(--text-muted)]">{warning ? 'rate_limited' : index === 1 ? 'active_sessions: 12' : 'latency: 42ms'}</span>
                                            <button onClick={() => activeRole === 'Admin' && !warning && void revokeConnector(connector.connector_id)} className="text-xs text-[var(--accent-primary-strong)]">
                                                Configure
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="stitch-card flex flex-col items-center justify-center border border-dashed border-[var(--border-subtle)] p-4 text-center opacity-70">
                                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
                                    <Command size={16} />
                                </div>
                                <span className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">Add_Custom_Mcp</span>
                            </div>
                        </div>
                    </section>

                    <section className="col-span-12 space-y-6 lg:col-span-7">
                        <div className="stitch-card p-6">
                            <h3 className="mb-6 flex items-center gap-2 font-headline text-lg font-medium text-[var(--text-primary)]">Relay &amp; Server Settings</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">Internal_Relay_Host</label>
                                    <input value={connectorForm.connector_name || 'relay-alpha.shepherd.internal'} onChange={(e) => setConnectorForm({ ...connectorForm, connector_name: e.target.value })} className="stitch-input" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">Daemon_Port</label>
                                    <input value={connectorForm.transport || '9090'} onChange={(e) => setConnectorForm({ ...connectorForm, transport: e.target.value })} className="stitch-input" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">Telemetry_Endpoint</label>
                                    <input value="https://telemetry.codeshepherd.io/v1/ingest" readOnly className="stitch-input" />
                                </div>
                            </div>

                            <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
                                <h4 className="mb-4 text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">Developer Preferences</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-[var(--text-primary)]">JSON Output Mode</div>
                                            <div className="text-xs text-[var(--text-muted)]">Force all terminal responses to strict JSON.</div>
                                        </div>
                                        <button type="button" data-on={jsonOutputMode} onClick={() => setJsonOutputMode((value) => !value)} className="stitch-toggle" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-[var(--text-primary)]">Extended Logging</div>
                                            <div className="text-xs text-[var(--text-muted)]">Increase verbosity to 'DEBUG' level.</div>
                                        </div>
                                        <button type="button" data-on={extendedLogging} onClick={() => setExtendedLogging((value) => !value)} className="stitch-toggle" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stitch-card p-6">
                            <h3 className="mb-6 flex items-center gap-2 font-headline text-lg font-medium text-[var(--text-primary)]">Local Authentication</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-l-2 border-[var(--accent-success)] bg-[var(--bg-surface)] px-4 py-3">
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">Session Token: active</div>
                                        <div className="text-[10px] font-mono text-[var(--text-muted)]">{sessionLabel}</div>
                                    </div>
                                    <button onClick={signOut} className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--accent-danger)]">Revoke</button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <button onClick={() => void login()} className="btn-secondary rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-[0.16em]">Update Password</button>
                                    <button onClick={() => void seedDemo()} className="btn-secondary rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-[0.16em]">Manage API Keys</button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="stitch-input" />
                                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="stitch-input" />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="stitch-input" />
                                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="stitch-input" />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => void signUp()} className="btn-primary rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-[0.16em]">Create Account</button>
                                    <button onClick={() => void login()} className="btn-secondary rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-[0.16em]">Login</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="col-span-12 space-y-6 lg:col-span-5">
                        <div className="stitch-card p-6">
                            <h3 className="mb-6 flex items-center gap-2 font-headline text-lg font-medium text-[var(--text-primary)]">Notifications</h3>
                            <div className="space-y-4">
                                <label className="flex items-start gap-4 bg-[var(--bg-surface)] p-3">
                                    <input checked={alertPrefs.failures} onChange={() => setAlertPrefs((current) => ({ ...current, failures: !current.failures }))} className="mt-1" type="checkbox" />
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">Agent Failure Alerts</div>
                                        <div className="text-xs text-[var(--text-muted)]">Notify immediately if an agent process terminates unexpectedly.</div>
                                    </div>
                                </label>
                                <label className="flex items-start gap-4 bg-[var(--bg-surface)] p-3">
                                    <input checked={alertPrefs.queue} onChange={() => setAlertPrefs((current) => ({ ...current, queue: !current.queue }))} className="mt-1" type="checkbox" />
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">Pipeline Queue Updates</div>
                                        <div className="text-xs text-[var(--text-muted)]">Summary of approval queue status every 4 hours.</div>
                                    </div>
                                </label>
                                <label className="flex items-start gap-4 bg-[var(--bg-surface)] p-3">
                                    <input checked={alertPrefs.marketing} onChange={() => setAlertPrefs((current) => ({ ...current, marketing: !current.marketing }))} className="mt-1" type="checkbox" />
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">Marketing &amp; Insights</div>
                                        <div className="text-xs text-[var(--text-muted)]">Optional updates about new Shepherd capabilities.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="stitch-card p-6">
                            <h3 className="mb-6 flex items-center gap-2 font-headline text-lg font-medium text-[var(--text-primary)]">Team Members</h3>
                            <div className="space-y-3">
                                {(teams.length > 0 ? teams : [{ id: 'default-team', name: 'alex_dev_ops', role: 'Administrator' }, { id: 'operator-team', name: 'sarah_codes', role: 'Operator' }]).map((team) => (
                                    <div key={team.id} className="flex items-center justify-between rounded-sm p-2 transition-colors hover:bg-[var(--bg-surface)]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-xs font-semibold text-[var(--accent-primary-strong)]">
                                                {team.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-[var(--text-primary)]">{team.name}</div>
                                                <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Role: {team.role}</div>
                                            </div>
                                        </div>
                                        <button className="text-xs text-[var(--text-muted)]">⋮</button>
                                    </div>
                                ))}

                                <div className="space-y-3 pt-3">
                                    <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="stitch-input">
                                        <option value="">Select team</option>
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" className="stitch-input" />
                                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="stitch-input">
                                        <option value="Developer">Developer</option>
                                        <option value="Viewer">Viewer</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    <button onClick={() => void createInvitation()} disabled={activeRole === 'Viewer'} className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-3 text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-primary)] disabled:opacity-50">
                                        Send_Invitation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {connectorEvents.length > 0 && (
                    <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-headline text-lg font-medium text-[var(--text-primary)]">Connector Event History</h3>
                            <button onClick={() => void loadConnectors()} className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">Refresh</button>
                        </div>
                        <div className="space-y-3">
                            {connectorEvents.slice(0, 4).map((event) => (
                                <div key={event.id} className="stitch-card p-4">
                                    <div className="text-sm font-medium text-[var(--text-primary)]">{event.connector_id}</div>
                                    <div className="mt-1 text-xs text-[var(--text-muted)]">{event.event_type} · {new Date(event.created_at).toLocaleString()}</div>
                                    <div className="mt-2 text-xs text-[var(--text-secondary)]">{JSON.stringify(event.event_details)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-end gap-4 border-t border-[var(--border-subtle)] pt-8">
                    <button onClick={() => void loadTeams()} className="px-6 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">Discard Changes</button>
                    <button onClick={() => void loadConnectors()} className="btn-primary rounded-sm px-8 py-2 text-sm font-semibold">Commit Settings</button>
                </div>
            </section>

            <div className="fixed bottom-6 right-6 z-20 hidden items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-4 py-2 backdrop-blur md:flex">
                <div className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-primary)]">CTRL</kbd>
                    <span className="text-xs text-[var(--text-muted)]">+</span>
                    <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-primary)]">K</kbd>
                </div>
                <div className="h-4 w-px bg-[var(--border-subtle)]" />
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Command Search</div>
            </div>
        </div>
    )
}
