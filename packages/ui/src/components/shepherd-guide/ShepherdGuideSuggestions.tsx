import { useShepherdGuide } from './ShepherdGuideProvider'

const suggestions = ['Connect an Agent', 'Approval Tiers', 'Troubleshooting']

export default function ShepherdGuideSuggestions() {
    const { sendMessage } = useShepherdGuide()

    return (
        <div className="overflow-x-auto border-t border-outline-variant/10 bg-surface-container-highest px-5 py-3 custom-scrollbar">
            <div className="flex gap-2">
                {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => sendMessage(suggestion)} className="flex shrink-0 items-center gap-2 bg-surface-container-high px-3 py-2 hover:bg-surface-bright">
                        <span className="status-diamond info h-[6px] w-[6px]"></span>
                        <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface">{suggestion}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
