import { Terminal } from 'lucide-react'

export default function LoginPreview() {
    return (
        <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-surface">
            <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(53,53,52,0.85)_0%,transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(28,27,27,0.9)_0%,transparent_50%)]"></div>
            </div>

            <main className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-[1200px] grid-cols-1 gap-0 px-4 py-8 lg:grid-cols-12 lg:px-6">
                <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:pr-12">
                    <div className="mb-8 flex h-16 w-16 items-center justify-center bg-surface-container text-primary">
                        <Terminal size={28} />
                    </div>
                    <h1 className="font-headline text-5xl font-bold uppercase leading-none tracking-[-0.04em] text-primary">Crystalline<br />Architecture</h1>
                    <p className="mb-12 mt-4 max-w-sm text-lg leading-8 text-on-surface-variant">Experience elite technical control. Deploy with mathematical precision using the Code Shepherd command interface.</p>
                    <div className="space-y-6">
                        {['System Status: Nominal', 'Latency: 14ms (Primary)', 'Encryption: AES-256 Quantum Resistant'].map((item) => (
                            <div key={item} className="flex items-center gap-4">
                                <span className="status-diamond info"></span>
                                <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-7 flex items-center justify-center lg:justify-start">
                    <div className="w-full max-w-[480px] bg-surface-container p-8 sm:p-10">
                        <div className="mb-10">
                            <h2 className="mb-2 font-headline text-2xl font-semibold uppercase tracking-[-0.02em] text-primary">Access Command Center</h2>
                            <p className="text-sm text-on-surface-variant">Initialize secure authentication to manage your flock.</p>
                        </div>

                        <button className="shell-button shell-button-primary focus-ring mb-8 w-full min-h-[52px]">
                            <Terminal size={16} />
                            Register with GitHub
                        </button>

                        <div className="mb-8 flex items-center">
                            <div className="h-px flex-1 bg-outline-variant/20"></div>
                            <span className="px-4 font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Or via credentials</span>
                            <div className="h-px flex-1 bg-outline-variant/20"></div>
                        </div>

                        <div className="space-y-6">
                            <Field label="Endpoint Identifier" placeholder="email@protocol.internal" type="email" />
                            <Field label="Secure Cipher" placeholder="••••••••" type="password" />
                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3">
                                    <div className="flex h-4 w-4 items-center justify-center bg-surface-container-low">
                                        <div className="status-diamond info h-2 w-2"></div>
                                    </div>
                                    <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Stay Synced</span>
                                </label>
                                <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Reset Logic?</span>
                            </div>
                            <button className="shell-button shell-button-secondary focus-ring w-full min-h-[52px]">Execute Login</button>
                        </div>

                        <div className="mt-10 border-t border-outline-variant/15 pt-8 text-center text-xs text-on-surface-variant">
                            By proceeding, you agree to the <span className="text-primary">Protocol Terms</span> and <span className="text-primary">Data Safety Standards</span>.
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative flex flex-col gap-4 px-6 pb-6 pt-4 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="status-diamond success"></span>
                    <span className="font-headline font-semibold uppercase tracking-[0.18em]">© 2024 The Digital Flock. Crystalline Architecture.</span>
                </div>
                <div className="hidden gap-8 sm:flex">
                    {['Privacy Policy', 'Terms of Service', 'Security', 'Status'].map((item) => (
                        <span key={item} className="font-headline font-semibold uppercase tracking-[0.18em]">{item}</span>
                    ))}
                </div>
            </footer>
        </div>
    )
}

function Field({ label, placeholder, type }: { label: string; placeholder: string; type: string }) {
    return (
        <div>
            <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{label}</label>
            <input type={type} placeholder={placeholder} className="focus-ring w-full bg-surface-container-low border-l-2 border-transparent px-4 py-4 text-sm text-primary placeholder:text-on-surface-variant" />
        </div>
    )
}
