import { X } from 'lucide-react'
import { useShepherdGuide } from './ShepherdGuideProvider'

export default function ShepherdGuidePreview() {
    const { isOpen, previewVisible, previewMessage, openGuide, dismissPreview } = useShepherdGuide()

    if (isOpen || !previewVisible || !previewMessage) return null

    return (
        <div className="fixed bottom-4 right-[72px] z-[99] hidden w-[280px] border border-outline-variant/20 bg-surface-container px-4 py-3 shadow-2xl lg:block">
            <button onClick={openGuide} className="w-full text-left">
                <div className="mb-2 flex items-center gap-2">
                    <span className="status-diamond info h-[6px] w-[6px]"></span>
                    <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Shepherd Guide</span>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-on-surface">{previewMessage.content}</p>
            </button>
            <button onClick={dismissPreview} className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface" aria-label="Dismiss preview">
                <X size={14} />
            </button>
            <div className="absolute -right-2 top-1/2 h-4 w-2 -translate-y-1/2 bg-surface-container [clip-path:polygon(0%_0%,100%_50%,0%_100%)]"></div>
        </div>
    )
}
