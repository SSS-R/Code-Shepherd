# AgentOps — UI/UX Design System

> **Mobile-first PWA** · **Dark mode default** · **Developer tool aesthetic**
> Based on UI/UX Pro Max skill analysis + AgentOPS.md product vision.

---

## Design Philosophy

AgentOps is a **command center**, not a dashboard. Every pixel should communicate status, urgency, and control. The developer should glance at their phone for 3 seconds and know exactly what their agents are doing.

**Core Principles:**
1. **Glanceable** — Status at a glance. No scrolling to understand state.
2. **Actionable** — Every screen has a primary action. Approve, reject, resume, assign.
3. **Trustworthy** — Professional, consistent, no visual jank. Users are trusting this to govern AI.
4. **Fast** — Skeleton loading, 150-300ms transitions, no blocking animations.

---

## Color System

### Semantic Tokens (Dark Mode Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0B1120` | App background (deep navy-black) |
| `--bg-surface` | `#111827` | Cards, panels (slate-900) |
| `--bg-surface-elevated` | `#1E293B` | Modals, popovers (slate-800) |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-active` | `rgba(255,255,255,0.12)` | Hover/focus borders |
| `--text-primary` | `#F1F5F9` | Headings, primary content (slate-100) |
| `--text-secondary` | `#94A3B8` | Descriptions, metadata (slate-400) |
| `--text-muted` | `#64748B` | Placeholders, timestamps (slate-500) |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#3B82F6` | Primary actions, active nav, links (blue-500) |
| `--accent-success` | `#22C55E` | Online, approved, healthy (green-500) |
| `--accent-warning` | `#F59E0B` | Pending, waiting, caution (amber-500) |
| `--accent-danger` | `#EF4444` | Rejected, failed, critical (red-500) |
| `--accent-info` | `#8B5CF6` | Informational, system events (violet-500) |

### Status Indicators (Glow Effect)

```css
/* Online agent — pulsing green glow */
.status-online {
  background: #22C55E;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

/* Critical approval — urgent red glow */
.status-critical {
  background: #EF4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}
```

---

## Typography

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Display | Inter | 700 | 28px | 1.2 |
| Heading (H1) | Inter | 600 | 22px | 1.3 |
| Heading (H2) | Inter | 600 | 18px | 1.4 |
| Body | Inter | 400 | 15px | 1.5 |
| Caption | Inter | 500 | 13px | 1.4 |
| Mono (code/diffs) | JetBrains Mono | 400 | 13px | 1.6 |

**Font Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

---

## Icon System

> **🚫 NO EMOJIS.** Use [Lucide React](https://lucide.dev/) exclusively.

| Use Case | Icon | Lucide Name |
|----------|------|-------------|
| Dashboard | grid layout | `LayoutDashboard` |
| Approvals | bell ring | `BellRing` |
| Timeline | clock/history | `History` |
| Settings | gear | `Settings` |
| Agent online | circle check | `CircleCheck` |
| Agent offline | circle x | `CircleX` |
| File write | file-pen | `FilePen` |
| File delete | file-x | `FileX2` |
| Command run | terminal | `Terminal` |
| Approve action | check | `Check` |
| Reject action | x | `X` |
| Risk: low | shield | `Shield` |
| Risk: medium | shield-alert | `ShieldAlert` |
| Risk: high | shield-x | `ShieldX` |
| Expand/collapse | chevron | `ChevronDown` / `ChevronUp` |
| Back | arrow left | `ArrowLeft` |
| Workflow running | loader | `Loader2` (animated) |
| Workflow paused | pause | `Pause` |

**Install:** `npm install lucide-react`

---

## Component Design Specs

### 1. Bottom Navigation (4 tabs)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Dashboard  │  Approvals  │  Timeline   │  Settings   │
│  [icon]     │  [icon](3)  │  [icon]     │  [icon]     │
│  Active ━━  │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

- Active tab: `--accent-primary` icon + label + 2px bottom indicator
- Inactive: `--text-muted`
- Badge on Approvals: red dot with count
- Height: 64px (safe for touch + gesture bar)
- `touch-action: manipulation` on all buttons

### 2. Agent Card (Dashboard)

```
┌──────────────────────────────────────────────┐
│  ● Agent Name                    [Online]    │
│  ID: agent-abc-123              ⟶            │
│                                              │
│  ┌──────┐ ┌───────────┐ ┌─────────────┐     │
│  │ read │ │ write     │ │ execute     │     │
│  └──────┘ └───────────┘ └─────────────┘     │
│                                              │
│  Last active: 2m ago    Actions today: 47    │
└──────────────────────────────────────────────┘
```

- Left border: 3px solid `--accent-success` (online) or `--text-muted` (offline)
- Background: `--bg-surface` with `border: 1px solid var(--border-subtle)`
- Hover: slight elevation + `--border-active`
- Click → navigates to Agent Detail screen
- Status pill: tight rounded-full with soft color background
- **NO glassmorphism** (replace with solid surfaces + subtle borders)

### 3. Approval Card (Swipeable)

```
┌──────────────────────────────────────────────┐
│  [ShieldAlert] file_write           P1  ⚠️   │
│  ─────────────────────────────────────────    │
│  "Write 47 lines to src/utils/parser.ts"     │
│                                              │
│  ┌─ Diff Preview ──────────────────────┐     │
│  │ + import { parseConfig } from './..  │     │
│  │ + export function validate(input)    │     │
│  │ - // TODO: implement                 │     │
│  └──────────────────────────────────────┘     │
│                                              │
│  Agent: code-writer   ·   3m ago             │
│                                              │
│  ┌──────────┐              ┌──────────┐      │
│  │ ✗ Reject │              │ ✓ Approve│      │
│  └──────────┘              └──────────┘      │
└──────────────────────────────────────────────┘
```

- Swipe right → Approve (green flash)
- Swipe left → Reject (red flash + reason input)
- Diff viewer: monospace font, green/red line coloring, collapsible
- Risk badge: color-coded pill (low=blue, medium=amber, high=red, critical=red+glow)
- Approve button: `bg-green-600 hover:bg-green-500`
- Reject button: `bg-red-600/20 text-red-400 border border-red-500/30`

### 4. Execution Timeline

```
     ●  File Write — src/api/routes.ts           2m ago
     │  Added 12 lines to the approvals router
     │
     ●  Approval Requested — file_write           5m ago
     │  Risk: Medium · Waiting for review
     │
     ●  Command Execute — npm test                8m ago
     │  Exit code: 0 · All tests passed
     │
     ◐  Session Started                          12m ago
         Agent registered and began work
```

- Vertical line: 2px solid `--border-subtle`
- Event dot: 10px circle, color-coded by category
- Expandable detail panel on click
- Filter bar at top: chips for action types
- Time stamps: relative ("2m ago") → absolute on hover

### 5. Active Workflow Card

```
┌──────────────────────────────────────────────┐
│  [Loader2 ↻]  ApprovalWorkflow       Running │
│  Waiting for human interaction                │
│                                              │
│  ID: wf-approval-001  ·  Agent: code-writer  │
│  Running for: 1h 23m                         │
│                                 ┌──────────┐ │
│                                 │   View   │ │
│                                 └──────────┘ │
└──────────────────────────────────────────────┘
```

- Running status: animated `Loader2` icon
- Waiting status: `Pause` icon with amber glow
- "View" navigates to the related approval or agent detail

---

## Screen Architecture

```
App.tsx
├── Dashboard.tsx          ← Home screen (stats + agents + workflows)
├── ApprovalQueue.tsx      ← Swipeable approval cards
├── ExecutionTimeline.tsx  ← Searchable/filterable audit log (NEW)
├── AgentDetail.tsx        ← Agent info + session timeline
├── KanbanBoard.tsx        ← Task management (Phase 2)
└── Settings.tsx           ← Preferences + API keys (NEW)
```

### Navigation Flow

```
Bottom Nav tabs:
  [Dashboard] → AgentDetail (drill-in, back button)
  [Approvals] → ApprovalDetail (expand card)
  [Timeline]  → Filter/Search → Event Detail
  [Settings]  → Notification Prefs, Policy Editor, API Keys
```

---

## Spacing & Layout System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon-text gaps |
| `--space-sm` | 8px | Intra-component padding |
| `--space-md` | 16px | Card padding, section gaps |
| `--space-lg` | 24px | Section margins |
| `--space-xl` | 32px | Page section separators |
| `--space-2xl` | 48px | Major layout divisions |

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | 375px | Single column, bottom nav |
| Tablet | 768px | 2-column grid, bottom nav |
| Desktop | 1024px | 3-column grid, sidebar nav |
| Wide | 1440px | Max content width, centered |

---

## Micro-Interactions & Animation

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Button press | 150ms | ease-out | Scale to 0.97, opacity 0.8 |
| Card hover | 200ms | ease-out | Border color change, subtle translateY(-1px) |
| Nav tab switch | 200ms | ease-in-out | Underline slides |
| Approval swipe | 250ms | spring | Card slides off-screen, confirmation flash |
| Skeleton pulse | 1.5s | ease-in-out | Infinite, `bg-gradient animate` |
| Expand/collapse | 200ms | ease-out | Height auto with overflow hidden |
| Page transition | 250ms | ease-out | Fade + slight Y translate |

### Loading Strategy

```
1. Skeleton screens for card lists (NOT spinners)
2. Progressive loading: show layout first, data fills in
3. Optimistic updates for approve/reject (undo toast for 3s)
4. Error toast with retry button (auto-dismiss 5s)
```

---

## Accessibility Checklist

- [ ] All text contrast ≥ 4.5:1 (AA) against `--bg-surface`
- [ ] Focus rings: 2px solid `--accent-primary` on all interactive elements
- [ ] `aria-label` on icon-only buttons
- [ ] Tab order matches visual order
- [ ] `prefers-reduced-motion`: disable all non-essential animations
- [ ] Touch targets: minimum 44×44px
- [ ] Touch spacing: minimum 8px between targets
- [ ] Keyboard navigation: full app is usable without mouse/touch
- [ ] Screen reader: approval cards announce risk level + action type

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Emoji icons (🤖 📊 🔔) | Lucide SVG icons |
| Glassmorphism/blur everywhere | Solid dark surfaces + subtle borders |
| Rainbow gradients on text | Single accent color for emphasis |
| Spinners for data loading | Skeleton shimmer screens |
| `cursor: default` on clickable cards | `cursor: pointer` + hover state |
| Generic "Loading..." text | Contextual: "Loading agents..." |
| Alert/confirm browser dialogs | Custom modal with proper styling |
| Horizontal scroll on mobile | Responsive single-column layout |
| Raw JSON in approval details | Structured key-value display |
| `px` for all spacing | Design token variables |

---

## Implementation Order

### Phase A: Design Foundation (Do First)
1. Install `lucide-react`
2. Create `index.css` design tokens (all CSS variables above)
3. Replace all emoji icons app-wide with Lucide
4. Implement skeleton loading components
5. Build reusable `StatusBadge`, `RiskBadge`, `ActionButton` components

### Phase B: Screen Rebuild
1. Rebuild `App.tsx` with 4-tab bottom nav
2. Rebuild `Dashboard.tsx` with proper agent cards + workflow section
3. Rebuild `ApprovalQueue.tsx` with swipe gestures + new card design
4. Create `ExecutionTimeline.tsx` (new screen)
5. Create `Settings.tsx` (new screen)
6. Rebuild `AgentDetail.tsx` with refined timeline

### Phase C: Polish
1. Add `prefers-reduced-motion` support
2. Responsive testing at all 4 breakpoints
3. Keyboard navigation pass
4. Performance audit (bundle size, lazy loading)
5. PWA manifest + splash screen update

---

*This document is the source of truth for all UI decisions. Reference it before writing any frontend code.*
