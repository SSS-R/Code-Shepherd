import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ShepherdGuideInput from './ShepherdGuideInput'
import ShepherdGuideMessage from './ShepherdGuideMessage'
import ShepherdGuideSuggestions from './ShepherdGuideSuggestions'
import { useShepherdGuide } from './ShepherdGuideProvider'

export default function ShepherdGuideModal() {
    const { isOpen, closeGuide, messages } = useShepherdGuide()
    const endRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isOpen) return
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOpen])

    if (!isOpen) return null

    return (
        <>
            <button className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px]" onClick={closeGuide} aria-label="Close Shepherd Guide overlay" />
            <div className="fixed bottom-0 right-0 z-[200] flex h-[85vh] w-full flex-col border border-outline-variant/20 bg-surface-container-highest shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:bottom-4 sm:right-4 sm:h-[620px] sm:max-h-[70vh] sm:w-[360px] lg:bottom-6 lg:right-6 lg:h-[620px] lg:w-[420px]">
                <div className="flex h-14 items-center justify-between bg-surface-container-low px-4">
                    <div className="flex items-center gap-3">
                        <span className="status-diamond success"></span>
                        <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface">Shepherd Guide</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-[9px] uppercase tracking-tight text-on-surface-variant">Powered by OpenClaw</span>
                        <button onClick={closeGuide} className="text-on-surface-variant hover:text-on-surface" aria-label="Close Shepherd Guide">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto bg-surface-container-highest p-5">
                    {messages.map((message) => (
                        <ShepherdGuideMessage key={message.id} message={message} />
                    ))}
                    <div ref={endRef} />
                </div>
                <ShepherdGuideSuggestions />
                <ShepherdGuideInput />
            </div>
        </>
    )
}
