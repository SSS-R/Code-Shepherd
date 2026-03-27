import { ArrowRight } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import { useShepherdGuide } from './ShepherdGuideProvider'

export default function ShepherdGuideInput() {
    const [draft, setDraft] = useState('')
    const { sendMessage } = useShepherdGuide()

    const submit = () => {
        if (!draft.trim()) return
        sendMessage(draft)
        setDraft('')
    }

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            submit()
        }
    }

    return (
        <div className="bg-surface px-4 py-4">
            <div className="flex items-center gap-3">
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Describe your request..."
                    className="focus-ring h-11 flex-1 border-l-2 border-primary bg-surface-container px-4 text-sm text-on-surface placeholder:text-on-surface-variant"
                />
                <button onClick={submit} className="focus-ring flex h-11 w-11 items-center justify-center bg-[linear-gradient(180deg,var(--color-primary),var(--color-primary-container))] text-on-primary active:scale-95">
                    <ArrowRight size={20} />
                </button>
            </div>
            <div className="mt-3 text-center font-headline text-[9px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Shepherd Guide only answers questions about Code Shepherd.
            </div>
        </div>
    )
}
