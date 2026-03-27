import {
    Bell,
    BellRing,
    Bot,
    BookOpen,
    Database,
    History,
    LayoutDashboard,
    Menu,
    Moon,
    Radio,
    Settings as SettingsIcon,
    ShieldCheck,
    Sun,
    Terminal,
    Workflow,
    Network,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ShepherdGuideModal from '../components/shepherd-guide/ShepherdGuideModal'
import ShepherdGuidePreview from '../components/shepherd-guide/ShepherdGuidePreview'
import { ShepherdGuideProvider } from '../components/shepherd-guide/ShepherdGuideProvider'
import ShepherdGuideTrigger from '../components/shepherd-guide/ShepherdGuideTrigger'
import ApprovalQueue from '../screens/ApprovalQueue'
import AgentDetail from '../screens/AgentDetail'
import AgentsOverview from '../screens/AgentsOverview'
import Dashboard from '../screens/Dashboard'
import ExecutionTimeline from '../screens/ExecutionTimeline'
import Inbox from '../screens/Inbox'
import KanbanBoard from '../screens/KanbanBoard'
import LoginPreview from '../screens/LoginPreview'
import OperatorProfile from '../screens/OperatorProfile'
import Settings from '../screens/Settings'
import { loadSession } from '../utils/authSession'
import { AppRouteKey, navigateTo, navigationRoutes, ParsedRoute } from './routeConfig'

const sidebarLogo = '/code-shepherd-logo.png'

const headerCopy: Record<AppRouteKey, { eyebrow: string; title: string }> = {
    dashboard: { eyebrow: 'Control Plane', title: 'Command Center' },
    login: { eyebrow: 'Auth Preview', title: 'Login / Registration' },
    agents: { eyebrow: 'Unified Presence', title: 'Agents Overview' },
    'agent-detail': { eyebrow: 'Agent View', title: 'Agent Detail' },
    inbox: { eyebrow: 'Unified Communication', title: 'Communication Hub' },
    approvals: { eyebrow: 'Remote Intervention', title: 'Approval Queue' },
    kanban: { eyebrow: 'Parallel Coordination', title: 'Mission Control' },
    timeline: { eyebrow: 'Auditability', title: 'Timeline / Audit Log' },
    settings: { eyebrow: 'Configuration', title: 'System Settings' },
    profile: { eyebrow: 'Operator Identity', title: 'Operator Profile' },
}

export default function AppRouter({ route }: { route: ParsedRoute }) {
    const [isConnected, setIsConnected] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const session = loadSession()

    const notifications = useMemo(() => ([
        { id: 1, title: 'Agent Execution Failure: Logic_Gate_7', description: 'System-wide interruption detected in neural processing block 7. Immediate manual bypass suggested.', time: '2m ago', tone: 'error' as const },
        { id: 2, title: 'Approval Required: Schema Migration', description: 'Ghost-Writer-Alpha requested write access to production SQL cluster for schema expansion.', time: '8m ago', tone: 'warning' as const },
        { id: 3, title: 'Deployment Approved by Admin_Root', description: 'Traffic rerouted to version 2.4.1-stable after reconciliation completed.', time: '14m ago', tone: 'success' as const },
        { id: 4, title: 'Ghost-Writer-Alpha Reconnected', description: 'Sub-routine handshake successful via encrypted tunnel 9.', time: '22m ago', tone: 'info' as const },
    ]), [])

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('code-shepherd-theme') as 'dark' | 'light' | null
        const initialTheme = savedTheme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        setTheme(initialTheme)
    }, [])

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        window.localStorage.setItem('code-shepherd-theme', theme)
    }, [theme])

    useEffect(() => {
        fetch('http://localhost:3000/health')
            .then((res) => res.json())
            .then(() => setIsConnected(true))
            .catch(() => setIsConnected(false))
    }, [])

    useEffect(() => {
        setSidebarOpen(false)
        setNotificationsOpen(false)
    }, [route.key])

    const navItems = useMemo(
        () => [
            { key: 'dashboard' as const, path: '/dashboard', label: 'Command Center', icon: <Terminal size={20} /> },
            { key: 'agents' as const, path: '/agents', label: 'Agents', icon: <Bot size={20} /> },
            { key: 'inbox' as const, path: '/inbox', label: 'Inbox', icon: <Radio size={20} /> },
            { key: 'approvals' as const, path: '/approvals', label: 'Approval Queue', icon: <BellRing size={20} /> },
            { key: 'kanban' as const, path: '/kanban', label: 'Task Board', icon: <Workflow size={20} /> },
            { key: 'timeline' as const, path: '/timeline', label: 'Timeline', icon: <History size={20} /> },
            { key: 'settings' as const, path: '/settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
            { key: 'profile' as const, path: '/profile', label: 'Profile', icon: <ShieldCheck size={20} /> },
        ],
        [],
    )

    if (route.key === 'login') {
        return <LoginPreview />
    }

    return (
        <ShepherdGuideProvider>
            <div className="app-shell min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary overflow-x-hidden">
                <div className={`relative z-10 min-h-screen lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[64px_minmax(0,1fr)]' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}>
                    <aside className={`shell-panel shell-border fixed inset-y-0 left-0 z-40 flex w-screen max-w-none flex-col border-r border-t-0 border-l-0 border-b-0 transition-transform duration-200 sm:w-[280px] sm:max-w-[280px] lg:sticky lg:top-0 lg:h-screen ${sidebarCollapsed ? 'lg:w-[64px]' : 'lg:w-[240px]'} lg:max-w-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        <div className={`border-b border-outline-variant/20 ${sidebarCollapsed ? 'px-3 py-6' : 'px-6 py-7'}`}>
                            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
                                <div className="flex h-11 w-11 items-center justify-center bg-surface-container-high">
                                    <img src={sidebarLogo} alt="Code Shepherd logo" className="h-8 w-8 object-contain" />
                                </div>
                                <div className={sidebarCollapsed ? 'hidden' : 'block'}>
                                    <div className="font-headline text-sm font-bold uppercase tracking-[0.18em] text-primary">Code Shepherd</div>
                                    <div className="mt-1 font-headline text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">V2.4.0-STABLE</div>
                                </div>
                            </div>
                        </div>

                        <nav className={`custom-scrollbar flex-1 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'}`}>
                            {navItems.map((item) => {
                                const isActive = route.key === item.key || (route.key === 'agent-detail' && item.key === 'agents')
                                return (
                                    <button
                                        key={item.key}
                                        title={sidebarCollapsed ? item.label : undefined}
                                        onClick={() => navigateTo(item.path)}
                                        className={`focus-ring flex w-full items-center ${sidebarCollapsed ? 'justify-center min-h-12 px-2 py-3' : 'gap-3 min-h-12 px-4 py-3'} text-left transition-colors ${isActive ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                                        <span className={`${sidebarCollapsed ? 'hidden' : 'inline'} font-headline text-[11px] font-semibold uppercase tracking-[0.16em]`}>{item.label}</span>
                                    </button>
                                )
                            })}
                        </nav>

                        <div className={`border-t border-outline-variant/20 ${sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
                            {[{ Icon: Database, label: 'System Status' }, { Icon: BookOpen, label: 'Documentation' }].map((item) => (
                                <a
                                    key={item.label}
                                    title={sidebarCollapsed ? item.label : undefined}
                                    className={`focus-ring flex items-center ${sidebarCollapsed ? 'justify-center min-h-12 px-2 py-3' : 'gap-3 min-h-12 px-4 py-3'} text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface`}
                                    href="#"
                                >
                                    <item.Icon size={16} />
                                    <span className={`${sidebarCollapsed ? 'hidden' : 'inline'} font-headline text-[10px] font-semibold uppercase tracking-[0.16em]`}>{item.label}</span>
                                </a>
                            ))}
                        </div>
                    </aside>

                    {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/45 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

                    <div className="min-w-0">
                        <header className="shell-panel shell-border sticky top-0 z-20 flex h-12 items-center justify-between border-x-0 border-t-0 px-4 sm:h-14 sm:px-6 lg:h-16 lg:px-10">
                            <div className="flex min-w-0 items-center gap-4 lg:gap-6">
                                <button className="focus-ring text-on-surface-variant lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                                    <Menu size={22} />
                                </button>
                                <button className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary lg:inline-flex" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Toggle sidebar rail">
                                    <LayoutDashboard size={18} />
                                </button>
                                <div className="min-w-0">
                                    <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{headerCopy[route.key].eyebrow}</p>
                                    <h1 className="truncate font-headline text-sm font-bold uppercase tracking-[0.12em] text-on-surface sm:text-base">{headerCopy[route.key].title}</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <button className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary sm:inline-flex" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                                <div className="relative hidden md:block">
                                    <button className="focus-ring relative hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary md:inline-flex" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Toggle notifications">
                                        <Bell size={18} />
                                        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center bg-error px-1 font-headline text-[9px] font-semibold text-white">{notifications.length}</span>
                                    </button>

                                    {notificationsOpen ? (
                                        <div className="shell-border absolute right-0 top-12 z-50 w-[400px] max-w-[calc(100vw-2rem)] bg-surface-container-highest shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                                            <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container px-4 py-4">
                                                <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface">Notifications</span>
                                                <button className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Mark All Read</button>
                                            </div>
                                            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                                                {notifications.map((notification) => (
                                                    <div key={notification.id} className="relative flex gap-4 border-t border-outline-variant/10 px-4 py-4 hover:bg-surface-bright first:border-t-0">
                                                        <div className={`absolute left-0 top-0 h-full w-1 ${notification.tone === 'error' ? 'bg-error' : notification.tone === 'warning' ? 'bg-warning' : notification.tone === 'success' ? 'bg-success' : 'bg-primary'}`}></div>
                                                        <div className="pt-1"><span className={`status-diamond ${notification.tone}`}></span></div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-start justify-between gap-3">
                                                                <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface">{notification.title}</span>
                                                                <span className="shrink-0 text-[10px] text-on-surface-variant">{notification.time}</span>
                                                            </div>
                                                            <p className="text-xs leading-5 text-on-surface-variant">{notification.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-surface-container-lowest p-4">
                                                <button className="shell-button shell-button-primary focus-ring w-full min-h-[40px] px-4 py-2">View All Notifications</button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {[Radio, Network].map((Icon, index) => (
                                    <button key={index} className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary md:inline-flex">
                                        <Icon size={18} />
                                    </button>
                                ))}
                                <div className="ml-2 flex items-center gap-3 border-l border-outline-variant/25 pl-3 sm:pl-4">
                                    <div className="hidden text-right sm:block">
                                        <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Operator Status</p>
                                        <p className="mt-1 flex items-center justify-end gap-2 font-mono text-[11px] text-on-surface">
                                            <span className={`status-diamond ${isConnected ? 'success' : 'error'}`}></span>
                                            {isConnected ? 'Relay Online' : 'Relay Offline'}
                                        </p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center bg-surface-container-high font-headline text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                        {(session?.name || session?.userId || 'OP').slice(0, 2).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main className="relative min-h-[calc(100vh-48px)] overflow-y-auto custom-scrollbar sm:min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-96px)]">
                            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 2xl:px-16 2xl:py-12">
                                {route.key === 'dashboard' ? <Dashboard onViewAgent={(id) => navigateTo(`/agents/${encodeURIComponent(id)}`)} /> : null}
                                {route.key === 'agents' ? <AgentsOverview onViewAgent={(id) => navigateTo(`/agents/${encodeURIComponent(id)}`)} /> : null}
                                {route.key === 'agent-detail' ? <AgentDetail agentId={route.params.agentId} onBack={() => navigateTo('/agents')} /> : null}
                                {route.key === 'inbox' ? <Inbox initialAgentId={null} /> : null}
                                {route.key === 'approvals' ? <ApprovalQueue /> : null}
                                {route.key === 'kanban' ? <KanbanBoard /> : null}
                                {route.key === 'timeline' ? <ExecutionTimeline /> : null}
                                {route.key === 'settings' ? <Settings /> : null}
                                {route.key === 'profile' ? <OperatorProfile /> : null}
                            </div>
                        </main>

                        <div className="shell-panel shell-border hidden h-8 items-center justify-between border-x-0 border-b-0 px-4 lg:flex lg:px-10">
                            <div className="flex items-center gap-4 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                                <span className={`status-diamond ${isConnected ? 'success' : 'error'}`}></span>
                                <span>{isConnected ? 'System Online' : 'System Offline'}</span>
                                <span>Cluster Alpha</span>
                            </div>
                            <div className="font-mono text-[11px] text-on-surface-variant">Latency 24ms // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                </div>
                <ShepherdGuidePreview />
                <ShepherdGuideTrigger />
                <ShepherdGuideModal />
            </div>
        </ShepherdGuideProvider>
    )
}
