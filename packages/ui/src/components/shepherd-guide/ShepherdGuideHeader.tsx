import { X } from 'lucide-react'
import { useShepherdGuide } from './ShepherdGuideProvider'

const statusCopy = {
    connected: { label: 'Relay Linked', tone: 'success' },
    fallback: { label: 'Fallback Mode', tone: 'warning' },
    loading: { label: 'Syncing', tone: 'info' },
} as const

export default function ShepherdGuideHeader() {
    const { closeGuide, connectionState } = useShepherdGuide()
    const status = statusCopy[connectionState]

    return (
        <div className="flex h-14 items-center justify-between bg-surface-container-low px-4">
            <div className="flex min-w-0 items-center gap-3">
                <span className={`status-diamond ${status.tone}`}></span>
                <div className="min-w-0">
                    <div className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface">Shepherd Guide</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-tight text-on-surface-variant">{status.label}</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="hidden font-mono text-[9px] uppercase tracking-tight text-on-surface-variant sm:inline">Powered by OpenClaw</span>
                <button onClick={closeGuide} className="text-on-surface-variant transition-colors hover:text-on-surface" aria-label="Close Shepherd Guide">
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}
