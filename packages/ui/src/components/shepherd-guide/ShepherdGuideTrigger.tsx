import { useShepherdGuide } from './ShepherdGuideProvider'

export default function ShepherdGuideTrigger() {
    const { isOpen, openGuide, unreadCount } = useShepherdGuide()

    if (isOpen) return null

    return (
        <button
            onClick={openGuide}
            className="focus-ring fixed bottom-4 right-4 z-[100] flex h-12 w-12 items-center justify-center bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-container))] text-on-primary shadow-[0_8px_32px_rgba(0,0,0,0.28)] sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
            aria-label="Open Shepherd Guide"
        >
            <span className="relative flex h-6 w-6 items-center justify-center rotate-45 border-2 border-on-primary">
                <span className="-rotate-45 font-headline text-sm font-bold">?</span>
            </span>
            {unreadCount > 0 ? (
                <span className="absolute -right-[2px] -top-[2px] flex h-[18px] w-[18px] items-center justify-center bg-error font-headline text-[9px] font-bold text-white">
                    {unreadCount}
                </span>
            ) : null}
        </button>
    )
}
