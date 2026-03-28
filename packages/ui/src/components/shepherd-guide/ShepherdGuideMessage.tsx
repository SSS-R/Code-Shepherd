import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { ShepherdGuideMessage as Message, useShepherdGuide } from './ShepherdGuideProvider'

export default function ShepherdGuideMessage({ message }: { message: Message }) {
    const { submitFeedback } = useShepherdGuide()

    if (message.role === 'user') {
        return (
            <div className="ml-auto max-w-[85%]">
                <div className="bg-surface-container-high px-4 py-4 text-sm leading-6 text-on-surface">{message.content}</div>
                <div className="mt-2 text-right font-mono text-[10px] uppercase tracking-tight text-on-surface-variant">{message.timestamp}</div>
            </div>
        )
    }

    return (
        <div className="max-w-[95%]">
            <div className="mb-2 flex items-center gap-2">
                <span className="status-diamond info"></span>
                <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface">Shepherd Guide</span>
            </div>
            <div className="border-l-2 border-primary bg-surface-container px-5 py-5">
                <p className="text-sm leading-6 text-on-surface">{message.content}</p>
                {message.code ? (
                    <pre className="mt-4 overflow-x-auto border border-outline-variant/10 bg-surface-container-low px-3 py-3 font-mono text-[12px] leading-6 text-on-surface custom-scrollbar">{message.code}</pre>
                ) : null}
                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-4">
                    <div className="flex items-center gap-3">
                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Was this helpful?</span>
                        <div className="flex gap-2">
                            {[
                                { Icon: ThumbsUp, value: 'up' as const },
                                { Icon: ThumbsDown, value: 'down' as const },
                            ].map(({ Icon, value }) => (
                                <button
                                    key={value}
                                    onClick={() => void submitFeedback(message.id, value)}
                                    aria-pressed={message.feedback === value}
                                    className={`flex h-5 w-5 rotate-45 items-center justify-center transition-colors ${message.feedback === value ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright hover:text-on-surface'}`}
                                >
                                    <Icon size={11} className="-rotate-45" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-tight text-on-surface-variant">{message.timestamp}</span>
                </div>
            </div>
        </div>
    )
}
