import { useMemo, useState } from 'react'
import { Download, KeyRound, MapPin, Pencil, ShieldCheck, UserRound } from 'lucide-react'
import { loadSession } from '../utils/authSession'

export default function OperatorProfile() {
    const session = loadSession()
    const [theme, setTheme] = useState<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') || 'dark')
    const [density, setDensity] = useState(false)
    const [motionReduction, setMotionReduction] = useState(false)

    const profile = useMemo(() => ({
        name: session?.name || 'Operator_7_Shepherd',
        email: session?.email || 'operator@codeshepherd.io',
        role: session?.role || 'Admin',
        userId: session?.userId || 'OP-7701',
    }), [session])

    return (
        <div className="mx-auto max-w-6xl pb-16">
            <section className="surface-card-alt mb-8 p-6 sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <div className="flex h-28 w-28 items-center justify-center bg-surface-container-highest text-primary">
                                <UserRound size={42} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-primary px-3 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-primary">Level 7</div>
                        </div>
                        <div>
                            <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.03em] text-on-surface sm:text-[36px]">{profile.name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                                <span>{profile.role}</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> Core Datacenter A</span>
                                <span>{profile.userId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2"><Pencil size={14} /> Edit Metadata</button>
                        <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2"><Download size={14} /> Export Log</button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 md:grid-cols-12">
                <section className="surface-card md:col-span-7 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Identity Parameters</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Legal Designation" value={profile.name} />
                        <Field label="Interface Email" value={profile.email} />
                        <Field label="Timezone" value="UTC+06:00 (Dhaka)" />
                        <Field label="Language Protocol" value="English (US-Command)" />
                    </div>
                </section>

                <section className="surface-card-alt md:col-span-5 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Operational Metrics</h2>
                    <Metric label="Successful Deployments" value="1,248" width="94%" />
                    <Metric label="Approval Consistency" value="99.8%" width="99%" />
                    <div className="mt-8 flex items-center gap-4 border-t border-outline-variant/20 pt-6">
                        <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><ShieldCheck size={18} /></div>
                        <div>
                            <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Current Standing</p>
                            <p className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-primary">Elite Commander Status</p>
                        </div>
                    </div>
                </section>

                <section className="surface-card md:col-span-8 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Security &amp; Encryption</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">API Master Key</div>
                                <div className="font-mono text-xs text-on-surface-variant">sk_live_xxxx_xxxx_xxxx_29af</div>
                            </div>
                            <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2"><KeyRound size={14} /> Rotate Key</button>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">Multi-Factor Authentication</div>
                                <div className="text-xs text-on-surface-variant">Enabled for command-critical operations</div>
                            </div>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">Active Sessions</div>
                                <div className="text-xs text-on-surface-variant">3 verified sessions across desktop and mobile</div>
                            </div>
                            <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2">Terminate All</button>
                        </div>
                    </div>
                </section>

                <section className="surface-card-alt md:col-span-4 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Interface Config</h2>
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            {[
                                { key: 'dark', label: 'Obsidian', previewClass: 'bg-[#131313]' },
                                { key: 'light', label: 'Platinum', previewClass: 'bg-[#f5f5f3]' },
                            ].map((option) => (
                                <button key={option.key} onClick={() => setTheme(option.key as 'dark' | 'light')} className={`focus-ring border p-3 text-left ${theme === option.key ? 'border-primary' : 'border-outline-variant/20'}`}>
                                    <div className={`mb-3 h-16 ${option.previewClass}`}></div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">{option.label}</span>
                                        {theme === option.key ? <span className="text-[10px] font-headline font-semibold uppercase tracking-[0.14em] text-primary">Active</span> : null}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Toggle label="Data Density" checked={density} onToggle={() => setDensity((v) => !v)} />
                        <Toggle label="Motion Reduction" checked={motionReduction} onToggle={() => setMotionReduction((v) => !v)} />
                    </div>
                </section>

                <section className="surface-card md:col-span-12 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Recent Command Stream</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Action Directive</th>
                                    <th className="px-4 py-3">Target Instance</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Reference ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['14:22 UTC', 'Authorize schema migration', 'Ghost-Writer-Alpha', 'success', 'CMD-8821'],
                                    ['13:58 UTC', 'Manual override', 'Cyber-Shep-01', 'warning', 'CMD-8710'],
                                    ['13:22 UTC', 'Terminate stale worker', 'Deploy-Bot-9', 'error', 'CMD-8624'],
                                ].map(([time, action, target, status, ref]) => (
                                    <tr key={ref} className="border-t border-outline-variant/15">
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{time}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface">{action}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{target}</td>
                                        <td className="px-4 py-3"><span className={`status-diamond ${status}`}></span></td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-primary">{ref}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    )
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</label>
            <input readOnly value={value} className="w-full bg-surface-container-low px-4 py-3 text-sm text-on-surface" />
        </div>
    )
}

function Metric({ label, value, width }: { label: string; value: string; width: string }) {
    return (
        <div className="mb-6">
            <div className="mb-2 flex items-end justify-between">
                <span className="text-sm text-on-surface-variant">{label}</span>
                <span className="font-headline text-3xl font-bold text-on-surface">{value}</span>
            </div>
            <div className="h-1 bg-surface-container-low">
                <div className="h-full bg-primary" style={{ width }}></div>
            </div>
        </div>
    )
}

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between bg-surface-container p-4">
            <span className="text-sm text-on-surface">{label}</span>
            <button onClick={onToggle} className={`focus-ring relative h-6 w-11 ${checked ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                <span className={`absolute top-1 h-4 w-4 transition-all ${checked ? 'right-1 bg-on-primary' : 'left-1 bg-outline'}`}></span>
            </button>
        </div>
    )
}
