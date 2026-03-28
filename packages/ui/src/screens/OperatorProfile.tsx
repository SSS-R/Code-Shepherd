import { useEffect, useMemo, useState } from 'react'
import { Download, MapPin, Pencil, ShieldCheck, UserRound } from 'lucide-react'
import { useOperator } from '../context/OperatorContext'
import { AuditEvent, formatRelativeTime, relayFetch } from '../utils/relay'

export default function OperatorProfile() {
    const { profile, teams, activeTeam, role, preferences, updatePreferences } = useOperator()
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const events = await relayFetch<AuditEvent[]>('/audit-logs?limit=6')
                if (!cancelled) {
                    setAuditEvents(events)
                }
            } catch {
                if (!cancelled) {
                    setAuditEvents([])
                }
            }
        }

        void load()
        return () => {
            cancelled = true
        }
    }, [])

    const operator = useMemo(() => ({
        name: profile?.name || 'Operator',
        email: profile?.email || 'No email available',
        userId: profile?.id || 'unknown-user',
    }), [profile])

    return (
        <div className="mx-auto max-w-6xl pb-16">
            <section className="surface-card-alt mb-8 p-6 sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <div className="flex h-28 w-28 items-center justify-center bg-surface-container-highest text-primary">
                                <UserRound size={42} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-primary px-3 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-primary">{role}</div>
                        </div>
                        <div>
                            <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.03em] text-on-surface sm:text-[36px]">{operator.name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                                <span>{activeTeam?.name || 'Personal Workspace'}</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                                <span>{operator.userId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button className="shell-button shell-button-primary focus-ring min-h-[40px] px-4 py-2"><Pencil size={14} /> Profile Synced</button>
                        <button className="shell-button shell-button-secondary focus-ring min-h-[40px] px-4 py-2"><Download size={14} /> Export Audit</button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 md:grid-cols-12">
                <section className="surface-card md:col-span-7 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Identity Parameters</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Operator Name" value={operator.name} />
                        <Field label="Interface Email" value={operator.email} />
                        <Field label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
                        <Field label="Active Team" value={activeTeam?.name || 'Personal Workspace'} />
                    </div>
                </section>

                <section className="surface-card-alt md:col-span-5 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Operational Metrics</h2>
                    <Metric label="Team Memberships" value={String(teams.length || 1)} width={`${Math.min(100, Math.max(24, teams.length * 24))}%`} />
                    <Metric label="Notification Readiness" value={preferences.desktop_notifications ? 'On' : 'Off'} width={preferences.desktop_notifications ? '96%' : '34%'} />
                    <div className="mt-8 flex items-center gap-4 border-t border-outline-variant/20 pt-6">
                        <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><ShieldCheck size={18} /></div>
                        <div>
                            <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Current Standing</p>
                            <p className="font-headline text-sm font-semibold uppercase tracking-[0.08em] text-primary">Relay Authenticated</p>
                        </div>
                    </div>
                </section>

                <section className="surface-card md:col-span-8 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Security &amp; Session</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">Current Auth Mode</div>
                                <div className="text-xs text-on-surface-variant">Header-based development session active</div>
                            </div>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-warning">Prototype</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">Desktop Notifications</div>
                                <div className="text-xs text-on-surface-variant">Persisted to the relay preference store</div>
                            </div>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">{preferences.desktop_notifications ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low p-4">
                            <div>
                                <div className="font-body text-sm font-semibold text-on-surface">Operator Role</div>
                                <div className="text-xs text-on-surface-variant">{role} in {activeTeam?.name || 'current workspace'}</div>
                            </div>
                            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{role}</span>
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
                                <button key={option.key} onClick={() => void updatePreferences({ theme_mode: option.key as 'dark' | 'light' })} className={`focus-ring border p-3 text-left ${preferences.theme_mode === option.key ? 'border-primary' : 'border-outline-variant/20'}`}>
                                    <div className={`mb-3 h-16 ${option.previewClass}`}></div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">{option.label}</span>
                                        {preferences.theme_mode === option.key ? <span className="text-[10px] font-headline font-semibold uppercase tracking-[0.14em] text-primary">Active</span> : null}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Toggle label="Data Density" checked={preferences.density_mode} onToggle={() => void updatePreferences({ density_mode: !preferences.density_mode })} />
                        <Toggle label="Motion Reduction" checked={preferences.motion_reduction} onToggle={() => void updatePreferences({ motion_reduction: !preferences.motion_reduction })} />
                    </div>
                </section>

                <section className="surface-card md:col-span-12 p-6 sm:p-8">
                    <h2 className="mb-6 font-headline text-lg font-semibold uppercase tracking-[0.08em] text-on-surface">Recent Audit Stream</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditEvents.map((event) => (
                                    <tr key={event.id} className="border-t border-outline-variant/15">
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{formatRelativeTime(event.timestamp)}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface">{event.event_type.replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{event.agent_id || 'system'}</td>
                                        <td className="px-4 py-3"><span className={`status-diamond ${event.status === 'failure' ? 'error' : event.status === 'pending' ? 'warning' : 'success'}`}></span></td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-primary">AUD-{event.id}</td>
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
