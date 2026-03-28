import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { loadSession } from '../utils/authSession'
import { MeResponse, OperatorPreferences, relayFetch, ThemeMode } from '../utils/relay'

const PREFERENCES_CACHE_KEY = 'code-shepherd.preferences'

const defaultPreferences: OperatorPreferences = {
    theme_mode: 'dark',
    density_mode: false,
    motion_reduction: false,
    desktop_notifications: true,
    auto_scale_workers: true,
}

interface OperatorContextValue {
    profile: MeResponse['user'] | null
    teams: MeResponse['teams']
    activeTeam: MeResponse['activeTeam']
    role: string
    preferences: OperatorPreferences
    loading: boolean
    refreshProfile: () => Promise<void>
    updatePreferences: (patch: Partial<OperatorPreferences>) => Promise<void>
}

const OperatorContext = createContext<OperatorContextValue | null>(null)

function loadCachedPreferences(): OperatorPreferences {
    try {
        const raw = window.localStorage.getItem(PREFERENCES_CACHE_KEY)
        if (!raw) return defaultPreferences
        return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<OperatorPreferences>) }
    } catch {
        return defaultPreferences
    }
}

function applyTheme(themeMode: ThemeMode) {
    document.documentElement.dataset.theme = themeMode
    window.localStorage.setItem('code-shepherd-theme', themeMode)
}

export function OperatorProvider({ children }: { children: ReactNode }) {
    const session = loadSession()
    const [profile, setProfile] = useState<MeResponse['user'] | null>(null)
    const [teams, setTeams] = useState<MeResponse['teams']>([])
    const [activeTeam, setActiveTeam] = useState<MeResponse['activeTeam']>(null)
    const [role, setRole] = useState<string>(session?.role ?? 'Developer')
    const [preferences, setPreferences] = useState<OperatorPreferences>(loadCachedPreferences)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        applyTheme(preferences.theme_mode)
        window.localStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences))
    }, [preferences])

    const refreshProfile = async () => {
        if (!session) {
            setProfile(null)
            setTeams([])
            setActiveTeam(null)
            setRole('Developer')
            setLoading(false)
            return
        }

        try {
            const me = await relayFetch<MeResponse>('/auth/me')
            setProfile(me.user)
            setTeams(me.teams)
            setActiveTeam(me.activeTeam)
            setRole(me.role)
            setPreferences(me.preferences)
        } catch {
            setProfile({
                id: session.userId,
                email: session.email ?? null,
                name: session.name ?? null,
                created_at: null,
            })
            setRole(session.role)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void refreshProfile()
    }, [session?.userId])

    const updatePreferences = async (patch: Partial<OperatorPreferences>) => {
        const optimistic = { ...preferences, ...patch }
        setPreferences(optimistic)

        if (!session) {
            return
        }

        try {
            const response = await relayFetch<{ preferences: OperatorPreferences }>('/auth/preferences', {
                method: 'PUT',
                body: JSON.stringify(patch),
            })
            setPreferences(response.preferences)
        } catch {
            setPreferences((current) => ({ ...current, ...patch }))
        }
    }

    const value = useMemo<OperatorContextValue>(() => ({
        profile,
        teams,
        activeTeam,
        role,
        preferences,
        loading,
        refreshProfile,
        updatePreferences,
    }), [profile, teams, activeTeam, role, preferences, loading])

    return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
}

export function useOperator() {
    const context = useContext(OperatorContext)
    if (!context) {
        throw new Error('useOperator must be used inside OperatorProvider')
    }
    return context
}
