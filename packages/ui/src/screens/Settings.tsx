import { useEffect, useState } from 'react'
import { Command, Server, ShieldCheck, BellRing, Users, Link } from 'lucide-react'
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
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 px-4 md:px-0">
      {/* Page Header */}
      <div className="mb-10 animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
            <Server size={14} className="text-primary" />
            <span className="font-mono text-[10px] text-outline tracking-[0.2em] uppercase font-bold">Infrastructure</span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface uppercase font-bold">Configuration</h1>
        <p className="text-outline text-sm mt-1.5 max-w-xl font-body">Manage global system parameters, external integrations, and team access.</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Connector Management (High Signal Action Cards) */}
        <section className="col-span-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-medium">Adapter Connectors</h2>
            <button onClick={() => void trustConnector()} disabled={activeRole !== 'Admin'} className="text-xs font-mono text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
              <span className="text-sm">+</span> REGISTER_NEW_MCP
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {(connectors.length > 0 ? connectors.slice(0, 3) : [
              { connector_id: 'github-enterprise', connector_name: 'GitHub Enterprise', adapter_kind: 'repo-sync', transport: 'https', trust_status: 'connected', scopes: ['repo sync', 'pr automation'] },
              { connector_id: 'vscode-extension', connector_name: 'VS Code Extension', adapter_kind: 'ide-link', transport: 'websocket', trust_status: 'connected', scopes: ['live ide orchestration'] },
              { connector_id: 'slack-relay', connector_name: 'Slack Relay', adapter_kind: 'chat-ops', transport: 'http', trust_status: 'warning', scopes: ['notifications', 'control'] },
            ]).map((connector, index) => {
              const warning = connector.trust_status !== 'connected'
              const severityClass = warning ? 'severity-marker-tertiary' : 'severity-marker-secondary'

              return (
                <div key={connector.connector_id} className={`premium-card p-5 rounded-xl ${severityClass} group hover:scale-[1.02] transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest/50 backdrop-blur rounded-lg border border-outline-variant/10">
                      <Command className={`${warning ? 'text-tertiary' : 'text-primary'} text-xl`} size={20} />
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold tracking-tighter ${warning ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                      {warning ? 'WARNING' : 'STABLE'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface tracking-tight">{connector.connector_name}</h3>
                  <p className="text-[11px] text-outline mt-1 mb-5 line-clamp-1">{connector.scopes.join(' & ') || connector.adapter_kind}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-outline-variant/5">
                    <span className={`text-[9px] font-mono font-bold ${warning ? 'text-error' : 'text-outline/60'}`}>
                      {warning ? 'RATE_LIMITED' : index === 1 ? 'SESSIONS: 12' : 'LATENCY: 42ms'}
                    </span>
                    <button onClick={() => activeRole === 'Admin' && !warning && void revokeConnector(connector.connector_id)} className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Configure
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="bg-surface-container p-4 rounded-md border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity min-h-[140px]">
              <Link size={24} className="text-outline mb-2" />
              <span className="text-xs font-mono">ADD_CUSTOM_MCP</span>
            </div>
          </div>
        </section>

        {/* Server Settings */}
        <section className="col-span-12 xl:col-span-7 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="font-headline text-lg font-medium mb-6 flex items-center gap-2">
              <Server className="text-primary" size={20} /> Relay &amp; Server Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-outline">Internal_Relay_Host</label>
                <input value={connectorForm.connector_name || 'relay-alpha.shepherd.internal'} onChange={(e) => setConnectorForm({ ...connectorForm, connector_name: e.target.value })} className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono text-primary-fixed focus:ring-1 focus:ring-primary outline-none transition-shadow" type="text" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-outline">Daemon_Port</label>
                <input value={connectorForm.transport || '9090'} onChange={(e) => setConnectorForm({ ...connectorForm, transport: e.target.value })} className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono text-primary-fixed focus:ring-1 focus:ring-primary outline-none transition-shadow" type="text" />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-outline">Telemetry_Endpoint</label>
                <input value="https://telemetry.codeshepherd.io/v1/ingest" readOnly className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono text-primary-fixed opacity-70 cursor-not-allowed" type="text" />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <h3 className="text-xs font-mono uppercase tracking-wider text-outline mb-4">Developer Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">JSON Output Mode</div>
                    <div className="text-xs text-outline">Force all terminal responses to strict JSON.</div>
                  </div>
                  <div onClick={() => setJsonOutputMode(!jsonOutputMode)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${jsonOutputMode ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${jsonOutputMode ? 'right-1 bg-on-primary-container' : 'left-1 bg-outline'}`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Extended Logging</div>
                    <div className="text-xs text-outline">Increase verbosity to 'DEBUG' level.</div>
                  </div>
                  <div onClick={() => setExtendedLogging(!extendedLogging)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${extendedLogging ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${extendedLogging ? 'right-1 bg-on-primary-container' : 'left-1 bg-outline'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Section */}
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="font-headline text-lg font-medium mb-6 flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} /> Local Authentication
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-container rounded-sm border-l-2 border-secondary">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-secondary" />
                  <div>
                    <div className="text-sm font-medium">Session Token: active</div>
                    <div className="text-[10px] font-mono text-outline">ID: {sessionLabel}</div>
                  </div>
                </div>
                <button onClick={signOut} className="text-xs font-mono text-error hover:bg-error/10 px-3 py-1 rounded-sm transition-colors">REVOKE</button>
              </div>

              {/* Embedded Login fields for prototype */}
              {!userId && (
                <div className="pt-2 border-t border-outline-variant/10">
                  <div className="grid gap-3 md:grid-cols-2 mb-3">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 mb-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none" />
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => void signUp()} className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition-colors">Create Account</button>
                    <button onClick={() => void login()} className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition-colors">Login</button>
                  </div>
                </div>
              )}
              {userId && (
                <div className="flex gap-4">
                  <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-2 text-xs font-mono tracking-widest uppercase border border-outline-variant/20 rounded-sm transition-colors">Update Password</button>
                  <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-2 text-xs font-mono tracking-widest uppercase border border-outline-variant/20 rounded-sm transition-colors">Manage API Keys</button>
                  <button onClick={() => void seedDemo()} className="flex-1 bg-surface-container hover:bg-surface-container-high py-2 text-xs font-mono tracking-widest uppercase border border-outline-variant/20 rounded-sm transition-colors">Seed Demo Data</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Team & Notification Section */}
        <section className="col-span-12 space-y-6 xl:col-span-5">
          {/* Notifications */}
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="font-headline text-lg font-medium mb-6 flex items-center gap-2">
              <BellRing className="text-primary" size={20} /> Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-surface-container rounded-sm">
                <input checked={alertPrefs.failures} onChange={() => setAlertPrefs(c => ({ ...c, failures: !c.failures }))} className="mt-1 rounded-sm bg-surface-container-lowest border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" type="checkbox" />
                <div>
                  <div className="text-sm font-medium">Agent Failure Alerts</div>
                  <div className="text-xs text-outline">Notify immediately if an agent process terminates unexpectedly.</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-surface-container rounded-sm">
                <input checked={alertPrefs.queue} onChange={() => setAlertPrefs(c => ({ ...c, queue: !c.queue }))} className="mt-1 rounded-sm bg-surface-container-lowest border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" type="checkbox" />
                <div>
                  <div className="text-sm font-medium">Pipeline Queue Updates</div>
                  <div className="text-xs text-outline">Summary of approval queue status every 4 hours.</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-surface-container rounded-sm">
                <input checked={alertPrefs.marketing} onChange={() => setAlertPrefs(c => ({ ...c, marketing: !c.marketing }))} className="mt-1 rounded-sm bg-surface-container-lowest border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" type="checkbox" />
                <div>
                  <div className="text-sm font-medium">Marketing &amp; Insights</div>
                  <div className="text-xs text-outline">Optional updates about new Shepherd capabilities.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="font-headline text-lg font-medium mb-6 flex items-center gap-2">
              <Users className="text-primary" size={20} /> Team Members
            </h2>
            <div className="space-y-3">
              {(teams.length > 0 ? teams : [{ id: 'default-team', name: 'alex_dev_ops', role: 'Administrator' }, { id: 'operator-team', name: 'sarah_codes', role: 'Operator' }]).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-2 hover:bg-surface-container rounded-sm transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-outline-variant/20 bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-medium">{team.name}</div>
                      <div className="text-[10px] text-outline font-mono">ROLE: {team.role.toUpperCase()}</div>
                    </div>
                  </div>
                  <button className="text-outline text-sm px-2 font-bold cursor-pointer">:</button>
                </div>
              ))}

              {/* Invite Form */}
              <div className="pt-4 border-t border-outline-variant/10 space-y-3 mt-4">
                <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-surface-container-lowest border-none rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                </select>

                <button onClick={() => void createInvitation()} disabled={activeRole === 'Viewer'} className="w-full mt-2 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 rounded-sm text-xs font-mono tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <span className="text-lg leading-none">+</span> SEND_INVITATION
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Action Bar */}
      <div className="mt-12 flex flex-col sm:flex-row sm:justify-end gap-4 border-t border-outline-variant/10 pt-8">
        <button onClick={() => void loadTeams()} className="px-6 py-2 text-sm text-outline hover:text-on-surface transition-colors">Discard Changes</button>
        <button onClick={() => void loadConnectors()} className="px-8 py-2 bg-gradient-to-b from-primary-container to-primary text-on-primary-container text-sm font-semibold rounded-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity">Commit Settings</button>
      </div>
    </div>
  )
}
