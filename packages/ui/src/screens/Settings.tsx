import { useState } from 'react'

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
    const [sessionLabel, setSessionLabel] = useState('No session yet')

    const seedDemo = async () => {
        const res = await fetch('http://localhost:3000/demo/seed', { method: 'POST' })
        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setTeams([data.team])
            setSelectedTeamId(data.team.id)
            setSessionLabel(`Demo loaded for ${data.user.name}`)
        }
    }

    const signUp = async () => {
        const res = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, teamName }),
        })

        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setSessionLabel(`Signed in as ${data.user.name}`)
            if (data.team) {
                setTeams([data.team])
                setSelectedTeamId(data.team.id)
            }
        }
    }

    const login = async () => {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (res.ok) {
            const data = await res.json()
            setUserId(data.user.id)
            setSessionLabel(`Signed in as ${data.user.name}`)
            setTeams(data.teams || [])
            if (data.teams?.[0]?.id) {
                setSelectedTeamId(data.teams[0].id)
            }
        }
    }

    const loadTeams = async () => {
        if (!userId) return
        const res = await fetch(`http://localhost:3000/auth/teams?userId=${userId}`)
        if (res.ok) {
            const data = await res.json()
            setTeams(data)
            if (data[0]?.id) {
                setSelectedTeamId(data[0].id)
            }
        }
    }

    const loadInvitations = async () => {
        if (!selectedTeamId) return
        const res = await fetch(`http://localhost:3000/auth/teams/${selectedTeamId}/invitations`)
        if (res.ok) {
            setInvitations(await res.json())
        }
    }

    const createInvitation = async () => {
        if (!selectedTeamId || !inviteEmail) return
        const res = await fetch(`http://localhost:3000/auth/teams/${selectedTeamId}/invitations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })

        if (res.ok) {
            void loadInvitations()
            void loadTeams()
        }
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-xl p-6 md:p-8">
                <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[32px]">Collaboration settings</h2>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Phase 3 adds account setup, teams, invitations, and role-aware operational control.</p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Create account / login</h3>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <div className="flex gap-3">
                        <button onClick={() => void signUp()} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium">Sign Up</button>
                        <button onClick={() => void login()} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Login</button>
                        <button onClick={() => void seedDemo()} className="btn-secondary rounded-lg px-4 py-3 text-sm font-medium">Load Demo</button>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">{sessionLabel}</p>
                </div>

                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Your teams</h3>
                        <button onClick={() => void loadTeams()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh</button>
                    </div>
                    {teams.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 p-4 text-[13px] text-[var(--text-muted)]">No teams loaded yet.</div>
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
                <div className="glass rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Invite teammate</h3>
                        <button onClick={() => void loadInvitations()} className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium">Refresh invites</button>
                    </div>
                    <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white">
                        <option value="">Select team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white">
                        <option value="Developer">Developer</option>
                        <option value="Viewer">Viewer</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <button onClick={() => void createInvitation()} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium">Create invitation</button>
                </div>

                <div className="glass rounded-xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Invitations</h3>
                    {invitations.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 p-4 text-[13px] text-[var(--text-muted)]">No invitations loaded.</div>
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
        </div>
    )
}
