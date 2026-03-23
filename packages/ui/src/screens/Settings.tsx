import { useEffect, useState } from 'react'
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
    const activeRole = teams.find((team) => team.id === selectedTeamId)?.role || loadSession()?.role || 'Developer'

    useEffect(() => {
        const session = loadSession()
        if (session) {
            setUserId(session.userId)
            setSelectedTeamId(session.teamId ?? '')
            setSessionLabel(`Signed in as ${session.name || session.userId}`)
        }
    }, [])

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
            <section className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-headline text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[36px]">Connectors and governance</h2>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Phase 3 adds account setup, teams, invitations, and role-aware operational control.</p>
                <div className="mt-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[13px] font-medium text-violet-300">
                    Active role: {activeRole}
                </div>
            </section>

            <section className="space-y-4">
                <div className="glass rounded-2xl p-6 md:p-8">
                    <h3 className="font-headline text-[24px] font-bold tracking-tight text-[var(--text-primary)]">Plans and beta pricing</h3>
                    <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
                        Beta access is managed from the website waitlist. The first 200 approved users get Beta Pro before launch, then keep launch discounts afterward.
                    </p>
                    <div className="mt-6 grid gap-4 xl:grid-cols-3">
                        {PLAN_CARDS.map((plan) => (
                            <article
                                key={plan.id}
                                className={`rounded-2xl border p-5 ${plan.highlight ? 'border-blue-500/30 bg-blue-500/10' : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[20px] font-semibold text-[var(--text-primary)]">{plan.name}</div>
                                        <div className="mt-1 text-[13px] text-[var(--text-secondary)]">{plan.audience}</div>
                                    </div>
                                    {plan.badge && (
                                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[12px] font-medium text-[var(--accent-info)]">{plan.badge}</span>
                                    )}
                                </div>

                                <div className="mt-5 text-3xl font-bold text-[var(--text-primary)]">{plan.priceLabel}</div>
                                <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">{plan.description}</p>

                                <ul className="mt-5 space-y-2 text-[14px] text-[var(--text-secondary)]">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-info)]" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                                    {plan.cta}
                                </button>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="glass rounded-2xl p-5">
                        <h4 className="text-[18px] font-semibold text-[var(--text-primary)]">Beta launch policy</h4>
                        <ul className="mt-4 space-y-2 text-[14px] text-[var(--text-secondary)]">
                            <li>The website waitlist is first-come, first-served until 200 users are invited.</li>
                            <li>Those invited users get full Beta Pro access while the app remains private.</li>
                            <li>After launch, those 200 users receive 50% off the first 2 months of Pro.</li>
                            <li>If they choose Max after launch, they receive 20% off that plan.</li>
                        </ul>
                    </div>

                    <div className="glass rounded-2xl p-5">
                        <h4 className="text-[18px] font-semibold text-[var(--text-primary)]">Remaining non-security beta gaps</h4>
                        <ul className="mt-4 space-y-2 text-[14px] text-[var(--text-secondary)]">
                            <li>Real bridge adapters still need to be connected to external tools, not just the relay scaffolding.</li>
                            <li>Billing logic is not wired yet; this pricing surface is UI-first and product-definition level.</li>
                            <li>Whitelist issuance, coupon handling, and post-launch entitlement rules still need backend implementation.</li>
                            <li>Beta onboarding, support flow, and usage analytics should be tightened before public beta starts.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-2xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Create account / login</h3>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="app-input px-4" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="app-input px-4" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="app-input px-4" />
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="app-input px-4" />
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={() => void signUp()} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium">Sign Up</button>
                        <button onClick={() => void login()} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Login</button>
                        <button onClick={() => void seedDemo()} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Load Demo</button>
                        <button onClick={signOut} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Sign Out</button>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">{sessionLabel}</p>
                </div>

                <div className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Your teams</h3>
                        <button onClick={() => void loadTeams()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh</button>
                    </div>
                    {teams.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-[13px] text-[var(--text-muted)]">No teams loaded yet.</div>
                    ) : (
                        teams.map((team) => (
                            <div key={team.id} className="surface-panel rounded-lg p-4">
                                <div className="text-[15px] font-medium text-[var(--text-primary)]">{team.name}</div>
                                <div className="mt-1 text-[13px] text-[var(--text-secondary)]">Role: {team.role}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Invite teammate</h3>
                        <button onClick={() => void loadInvitations()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh invites</button>
                    </div>
                    <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="app-input px-4">
                        <option value="">Select team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" className="app-input px-4" />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="app-input px-4">
                        <option value="Developer">Developer</option>
                        <option value="Viewer">Viewer</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <button onClick={() => void createInvitation()} disabled={activeRole === 'Viewer'} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50">Create invitation</button>
                </div>

                <div className="glass rounded-2xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Invitations</h3>
                    {invitations.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-[13px] text-[var(--text-muted)]">No invitations loaded.</div>
                    ) : (
                        invitations.map((invite) => (
                            <div key={invite.id} className="surface-panel rounded-lg p-4">
                                <div className="text-[15px] font-medium text-[var(--text-primary)]">{invite.email}</div>
                                <div className="mt-1 text-[13px] text-[var(--text-secondary)]">Role: {invite.role} · Status: {invite.status}</div>
                                {invite.status === 'pending' && (
                                    <button onClick={() => void acceptInvitation(invite.id)} className="btn-secondary mt-3 rounded-lg px-3 py-2 text-sm font-medium">Accept as current user</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Trusted connectors</h3>
                        <button onClick={() => void loadConnectors()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh</button>
                    </div>
                    <input value={connectorForm.connector_id} onChange={(e) => setConnectorForm({ ...connectorForm, connector_id: e.target.value })} placeholder="Connector ID" className="app-input px-4" />
                    <input value={connectorForm.connector_name} onChange={(e) => setConnectorForm({ ...connectorForm, connector_name: e.target.value })} placeholder="Connector name" className="app-input px-4" />
                    <div className="grid gap-3 md:grid-cols-2">
                        <input value={connectorForm.adapter_kind} onChange={(e) => setConnectorForm({ ...connectorForm, adapter_kind: e.target.value })} placeholder="Adapter kind" className="app-input px-4" />
                        <input value={connectorForm.transport} onChange={(e) => setConnectorForm({ ...connectorForm, transport: e.target.value })} placeholder="Transport" className="app-input px-4" />
                    </div>
                    <input value={connectorForm.scopes} onChange={(e) => setConnectorForm({ ...connectorForm, scopes: e.target.value })} placeholder="Scopes (comma separated)" className="app-input px-4" />
                    <button onClick={() => void trustConnector()} disabled={activeRole !== 'Admin'} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50">Trust connector</button>
                </div>

                <div className="glass rounded-2xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Connector governance</h3>
                    {connectors.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-[13px] text-[var(--text-muted)]">No connectors registered yet.</div>
                    ) : connectors.map((connector) => (
                        <div key={connector.connector_id} className="surface-panel rounded-lg p-4">
                            <div className="text-[15px] font-medium text-[var(--text-primary)]">{connector.connector_name}</div>
                            <div className="mt-1 text-[13px] text-[var(--text-secondary)]">{connector.connector_id} · {connector.adapter_kind} · {connector.transport}</div>
                            <div className="mt-2 text-[13px] text-[var(--text-secondary)]">Scopes: {connector.scopes.join(', ') || 'none'}</div>
                            <div className="mt-2 text-[13px] text-[var(--text-secondary)]">Status: {connector.trust_status}</div>
                            <button onClick={() => void revokeConnector(connector.connector_id)} disabled={activeRole !== 'Admin' || connector.trust_status === 'revoked'} className="btn-secondary mt-3 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">Revoke connector</button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Connector event history</h3>
                    <button onClick={() => void loadConnectors()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh history</button>
                </div>
                {connectorEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-[13px] text-[var(--text-muted)]">No connector events recorded yet.</div>
                ) : connectorEvents.map((event) => (
                    <div key={event.id} className="surface-panel rounded-lg p-4">
                        <div className="text-[15px] font-medium text-[var(--text-primary)]">{event.connector_id}</div>
                        <div className="mt-1 text-[13px] text-[var(--text-secondary)]">{event.event_type} · {new Date(event.created_at).toLocaleString()}</div>
                        <div className="mt-2 text-[13px] text-[var(--text-secondary)]">{JSON.stringify(event.event_details)}</div>
                    </div>
                ))}
            </section>
        </div>
    )
}
