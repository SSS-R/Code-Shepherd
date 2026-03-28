import type { FormEvent } from 'react'
import { useState } from 'react'
import { ShieldCheck, Terminal } from 'lucide-react'
import { useOperator } from '../context/OperatorContext'
import { saveSession } from '../utils/authSession'
import { MeResponse, relayFetch } from '../utils/relay'
import { navigateTo } from '../routes/routeConfig'

type AuthMode = 'login' | 'signup'

export default function LoginPreview() {
    const [mode, setMode] = useState<AuthMode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [teamName, setTeamName] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { refreshProfile } = useOperator()

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const path = mode === 'login' ? '/auth/login' : '/auth/signup'
            const payload = mode === 'login'
                ? { email, password }
                : { email, password, name, teamName: teamName || undefined }

            const response = await relayFetch<MeResponse>(path, {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            if (response.user) {
                saveSession({
                    userId: response.user.id,
                    teamId: response.activeTeam?.id ?? null,
                    role: response.role as 'Admin' | 'Developer' | 'Viewer',
                    name: response.user.name,
                    email: response.user.email,
                })
            }

            await refreshProfile()
            navigateTo('/dashboard')
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Authentication failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-surface">
            <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(53,53,52,0.85)_0%,transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(28,27,27,0.9)_0%,transparent_50%)]"></div>
            </div>

            <main className="relative mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-0 px-4 py-8 lg:grid-cols-12 lg:px-6">
                <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:pr-12">
                    <div className="mb-8 flex h-16 w-16 items-center justify-center bg-surface-container text-primary">
                        <Terminal size={28} />
                    </div>
                    <h1 className="font-headline text-5xl font-bold uppercase leading-none tracking-[-0.04em] text-primary">Secure<br />Command Plane</h1>
                    <p className="mb-12 mt-4 max-w-sm text-lg leading-8 text-on-surface-variant">Signed session cookies, relay-backed preferences, and auditable agent control from one hardened entry point.</p>
                    <div className="space-y-6">
                        {['Signed access + refresh sessions', 'Scrypt password storage', 'Authenticated realtime channel'].map((item) => (
                            <div key={item} className="flex items-center gap-4">
                                <span className="status-diamond success"></span>
                                <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-7 flex items-center justify-center lg:justify-start">
                    <div className="w-full max-w-[520px] bg-surface-container p-8 sm:p-10">
                        <div className="mb-8 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="mb-2 font-headline text-2xl font-semibold uppercase tracking-[-0.02em] text-primary">Access Command Center</h2>
                                <p className="text-sm text-on-surface-variant">Authenticate with a relay-issued session.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 text-xs uppercase tracking-[0.16em] text-success">
                                <ShieldCheck size={14} />
                                Hardened
                            </div>
                        </div>

                        <div className="mb-8 flex gap-2 bg-surface-container-low p-1">
                            <button onClick={() => setMode('login')} className={`focus-ring flex-1 px-4 py-3 text-sm font-headline uppercase tracking-[0.14em] ${mode === 'login' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}>Login</button>
                            <button onClick={() => setMode('signup')} className={`focus-ring flex-1 px-4 py-3 text-sm font-headline uppercase tracking-[0.14em] ${mode === 'signup' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}>Create Account</button>
                        </div>

                        <form className="space-y-5" onSubmit={submit}>
                            {mode === 'signup' ? (
                                <>
                                    <Field label="Operator Name" value={name} onChange={setName} placeholder="Rafi" type="text" />
                                    <Field label="Workspace / Team" value={teamName} onChange={setTeamName} placeholder="Code Shepherd Lab" type="text" />
                                </>
                            ) : null}
                            <Field label="Email" value={email} onChange={setEmail} placeholder="email@protocol.internal" type="email" />
                            <Field label="Password" value={password} onChange={setPassword} placeholder="Minimum 10 characters" type="password" />

                            {error ? (
                                <div className="bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
                            ) : null}

                            <button disabled={submitting} className="shell-button shell-button-primary focus-ring w-full min-h-[52px] disabled:opacity-60">
                                <Terminal size={16} />
                                {submitting ? 'Authenticating...' : mode === 'login' ? 'Execute Login' : 'Create Secure Account'}
                            </button>
                        </form>

                        <div className="mt-10 border-t border-outline-variant/15 pt-8 text-center text-xs text-on-surface-variant">
                            Sessions are stored in HttpOnly cookies. Client storage keeps only non-sensitive operator metadata.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder: string
    type: string
}) {
    return (
        <div>
            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="focus-ring w-full bg-surface-container-low border-l-2 border-transparent px-4 py-4 text-sm text-primary placeholder:text-on-surface-variant"
            />
        </div>
    )
}
