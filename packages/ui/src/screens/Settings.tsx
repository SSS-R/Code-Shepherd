import { useState } from 'react'

interface Team {
    id: string
    name: string
    role: string
}

export default function Settings() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [teamName, setTeamName] = useState('')
    const [userId, setUserId] = useState('')
    const [teams, setTeams] = useState<Team[]>([])
    const [sessionLabel, setSessionLabel] = useState('No session yet')

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
            }
        }
    }

    const loadTeams = async () => {
        if (!userId) return
        const res = await fetch(`http://localhost:3000/auth/teams?userId=${userId}`)
        if (res.ok) {
            setTeams(await res.json())
        }
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-xl p-6 md:p-8">
                <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] md:text-[32px]">Collaboration settings</h2>
                <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Phase 3 adds account setup, teams, invites, and role-aware operational control.</p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-xl p-5 space-y-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Create account / team</h3>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="surface-panel rounded-lg px-4 py-3 text-[15px] text-white" />
                    <button onClick={() => void signUp()} className="btn-primary rounded-lg px-4 py-3 text-sm font-medium">Create Session</button>
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
        </div>
    )
}
