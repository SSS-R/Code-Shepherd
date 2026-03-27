export type AppRouteKey =
    | 'login'
    | 'dashboard'
    | 'agents'
    | 'agent-detail'
    | 'inbox'
    | 'approvals'
    | 'kanban'
    | 'timeline'
    | 'settings'
    | 'profile'

export interface ParsedRoute {
    key: AppRouteKey
    params: Record<string, string>
}

export interface NavigationRoute {
    key: Exclude<AppRouteKey, 'agent-detail' | 'login'>
    path: string
    label: string
}

export const navigationRoutes: NavigationRoute[] = [
    { key: 'dashboard', path: '/dashboard', label: 'Command Center' },
    { key: 'agents', path: '/agents', label: 'Agents' },
    { key: 'inbox', path: '/inbox', label: 'Inbox' },
    { key: 'approvals', path: '/approvals', label: 'Approval Queue' },
    { key: 'kanban', path: '/kanban', label: 'Task Board' },
    { key: 'timeline', path: '/timeline', label: 'Timeline' },
    { key: 'settings', path: '/settings', label: 'Settings' },
    { key: 'profile', path: '/profile', label: 'Profile' },
]

export function parsePathRoute(pathname: string): ParsedRoute {
    const cleanPath = pathname && pathname !== '/' ? pathname : '/dashboard'
    const parts = cleanPath.split('/').filter(Boolean)

    if (parts.length === 0) {
        return { key: 'dashboard', params: {} }
    }

    if (parts[0] === 'login') {
        return { key: 'login', params: {} }
    }

    if (parts[0] === 'agents' && parts[1]) {
        return { key: 'agent-detail', params: { agentId: decodeURIComponent(parts[1]) } }
    }

    const matched = navigationRoutes.find((route) => route.key === parts[0])
    if (matched) {
        return { key: matched.key, params: {} }
    }

    return { key: 'dashboard', params: {} }
}

export function navigateTo(path: string) {
    if (window.location.pathname !== path) {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
    }
}
