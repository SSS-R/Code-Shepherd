# Code Shepherd — Final Design System

**Version:** 1.0  
**Modes:** Obsidian (Dark) · Platinum (Light)  
**Brand:** The Digital Flock — Crystalline Architecture

---

## 1. Brand Identity

### Logo
The Code Shepherd logo is a **low-poly geometric black sheep head** — faceted, angular, and sharp. It represents the "shepherd" of code agents: watchful, precise, and commanding.

**Usage Rules:**
- Dark mode: Use logo as-is (dark poly sheep) on dark surfaces — high contrast via tonal difference
- Light mode: Use logo as-is on light surfaces — the dark sheep creates natural contrast against platinum backgrounds
- Minimum clear space: 1× the width of one ear on all sides
- Never add rounded containers, circles, or soft shapes around the logo
- The logo's geometric language (sharp facets, angular planes) must echo throughout the entire UI

### Wordmark
"CODE SHEPHERD" set in **Space Grotesk Bold**, uppercase, letter-spacing: +4%. Always appears next to the logo in the top-left sidebar/header.

---

## 2. Creative North Star

> **"Crystalline Architecture"** — The interface feels carved from obsidian and platinum. Authority through geometry, clarity through restraint.

### Core Principles
- **Zero border-radius.** Everything is sharp. No exceptions.
- **No-line rule.** Structure comes from tonal background shifts, never from 1px borders.
- **Geometric soul.** All decorative and data-viz elements use the logo's angular language — diamonds, polygons, stepped lines, faceted shapes.
- **Calm command.** Whitespace is a feature, not wasted space. Elite operators don't need visual clutter.

---

## 3. Geometric Background Elements

Both modes feature subtle **geometric polygon shapes** in the background — large, semi-transparent angular forms that echo the faceted sheep logo.

### Dark Mode (Obsidian)
- **Shape style:** Large angular polygons, overlapping triangular planes
- **Opacity:** 2–5% white
- **Placement:** Asymmetric — concentrated in the top-right and bottom-left corners of the main content area
- **Blur:** None. Shapes are crisp-edged but nearly invisible
- **Color:** `rgba(255, 255, 255, 0.02)` to `rgba(255, 255, 255, 0.05)`

### Light Mode (Platinum)
- **Shape style:** Same angular polygons, more visible as a design feature
- **Opacity:** 4–8%
- **Placement:** Same asymmetric layout. Visible in the login screen prototype as layered silver-grey angular planes behind content
- **Blur:** None. Clean geometric edges
- **Color:** `rgba(0, 0, 0, 0.04)` to `rgba(0, 0, 0, 0.08)`
- **Accent:** One or two planes can use the secondary color at 3% opacity for subtle warmth

### Implementation Notes
- Render as SVG overlays or CSS `clip-path` polygons, not as images
- Shapes should be fixed to the viewport (not scroll with content)
- Never overlap interactive elements — geometric background sits behind all UI layers unless used as a hero section backdrop (like the login page)
- Ensure shapes do not interfere with readability — contrast ratio for all text on top of geometric elements must still meet WCAG AA

---

## 4. Color System

### 4.1 Dark Mode — "Obsidian"

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#131313` | Page base background |
| `surface-dim` | `#131313` | Recessed areas |
| `surface-container-lowest` | `#0E0E0E` | Deepest layer |
| `surface-container-low` | `#1C1B1B` | Sidebar, nav panels |
| `surface-container` | `#201F1F` | Primary work area, cards |
| `surface-container-high` | `#2B2A2A` | Active inputs, hover states |
| `surface-container-highest` | `#353534` | Modals, overlays, dropdowns |
| `surface-bright` | `#3A3939` | Interactive hover highlight |
| `primary` | `#E2E2E2` | Primary text, button fills (silver) |
| `primary-container` | `#D4D4D4` | Gradient endpoint for metallic sheen |
| `on-primary` | `#1A1C1C` | Text on primary buttons |
| `secondary` | `#45484A` | Secondary text, muted labels |
| `tertiary` | `#2F3133` | Tertiary backgrounds, subtle containers |
| `neutral` | `#0F0F0F` | Deepest neutral |
| `outline-variant` | `#474747` | Ghost borders (15% opacity) |
| `on-surface` | `#E6E1DC` | Body text |
| `on-surface-variant` | `#C9C5C0` | Secondary body text |

### High-Signal Colors (Shared across both modes)

| Token | Hex | Usage |
|---|---|---|
| `success` | `#4CAF50` | Operational, connected, complete |
| `success-muted` | `#2E7D32` | Success backgrounds |
| `warning` | `#FFB300` | Caution, threshold warnings |
| `warning-muted` | `#F57F17` | Warning backgrounds |
| `error` | `#EF5350` | Failures, critical alerts, blocked |
| `error-container` | `#93000A` | Error card backgrounds |
| `info` | `#42A5F5` | Informational, reconnections |
| `accent-green` | `#4CAF50` | Active status diamonds |
| `accent-amber` | `#FFB300` | Action required diamonds |

### 4.2 Light Mode — "Platinum"

Derived from the light mode login prototype. The platinum mode inverts the surface hierarchy while preserving the same geometric and typographic DNA.

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#F5F5F3` | Page base background |
| `surface-dim` | `#EEEDE9` | Recessed areas |
| `surface-container-lowest` | `#FFFFFF` | Cards that need to pop |
| `surface-container-low` | `#F0EFEB` | Sidebar, nav panels |
| `surface-container` | `#EAEAE6` | Primary work area containers |
| `surface-container-high` | `#E0DFDB` | Active inputs, hover states |
| `surface-container-highest` | `#D6D5D1` | Modals, overlays, dropdowns |
| `surface-bright` | `#DCDBD7` | Interactive hover highlight |
| `primary` | `#1A1C1C` | Primary text, button fills (charcoal) |
| `primary-container` | `#2C2E2E` | Gradient endpoint for dark button sheen |
| `on-primary` | `#F5F5F3` | Text on primary buttons |
| `secondary` | `#6B6E70` | Secondary text, muted labels |
| `tertiary` | `#D0CFD1` | Tertiary backgrounds |
| `neutral` | `#F8F8F6` | Lightest neutral |
| `outline-variant` | `#C8C8C4` | Ghost borders (20% opacity) |
| `on-surface` | `#1A1C1C` | Body text |
| `on-surface-variant` | `#44474A` | Secondary body text |

### Mode Switching Notes
- High-signal colors remain **identical** in both modes — red stays red, green stays green
- In light mode, error/warning containers use lighter tinted backgrounds (`error` at 8% opacity) instead of the dark `error-container` hex
- Ghost borders become slightly more visible in light mode (20% opacity vs 15%) to compensate for less natural tonal depth
- The geometric background polygons shift from white-on-dark to grey-on-light

---

## 5. Typography

### Font Stack
| Role | Font | Weight | Tracking |
|---|---|---|---|
| Display & Headlines | Space Grotesk | Bold (700) | -2% |
| Section Headers | Space Grotesk | SemiBold (600) | +2% |
| Labels & Micro-copy | Space Grotesk | Medium (500) | +4% (uppercase) |
| Body & Technical Data | Manrope | Regular (400) | 0% |
| Body Emphasis | Manrope | SemiBold (600) | 0% |
| Code & Monospace | JetBrains Mono | Regular (400) | 0% |

### Type Scale
| Token | Size | Line Height | Usage |
|---|---|---|---|
| `display-lg` | 48px | 56px | Hero metrics (99.98%, 1,284) |
| `display-md` | 36px | 44px | Page titles (CONTROL PLANE, SYSTEM CONFIGURATION) |
| `headline-lg` | 28px | 36px | Section headers (APPROVAL QUEUE, RECENT ACTIVITY) |
| `headline-md` | 22px | 28px | Card titles (PostgreSQL Schema Migration) |
| `title-lg` | 18px | 24px | Agent names, conversation titles |
| `title-md` | 16px | 22px | Sub-section headers |
| `body-lg` | 16px | 24px | Primary body text |
| `body-md` | 14px | 20px | Standard body text |
| `body-sm` | 12px | 16px | Secondary descriptions |
| `label-lg` | 14px | 20px | Button text, tab labels (uppercase) |
| `label-md` | 12px | 16px | Status badges, metadata (uppercase) |
| `label-sm` | 11px | 14px | Timestamps, micro-stats (uppercase) |

### All-Caps Rule
These elements are **always uppercase + Space Grotesk**:
- Sidebar navigation labels
- Column headers in tables
- Status badges
- Button text
- Section headers with diamond icons
- Metric card label text (TOTAL MANAGED AGENTS, etc.)

---

## 6. Elevation & Depth

### Layering Principle
Depth is achieved by stacking surface-container tiers, **not** by borders or drop shadows.

| Level | Dark Token | Light Token | Usage |
|---|---|---|---|
| Base | `surface` #131313 | `surface` #F5F5F3 | Page background |
| Layer 1 | `surface-container-low` #1C1B1B | `surface-container-low` #F0EFEB | Sidebar |
| Layer 2 | `surface-container` #201F1F | `surface-container` #EAEAE6 | Cards, work area |
| Layer 3 | `surface-container-high` #2B2A2A | `surface-container-high` #E0DFDB | Active states |
| Layer 4 | `surface-container-highest` #353534 | `surface-container-highest` #D6D5D1 | Modals, dropdowns |

### Shadows
- **Dark mode:** Shadows are almost invisible. Ambient only on floating elements. Blur: 40–80px, opacity: 4–8%
- **Light mode:** Slightly more visible shadows needed. Blur: 20–40px, opacity: 6–12%. Color: tinted with `primary-container`, never flat grey

### Ghost Border Fallback
When tonal contrast alone is not enough (common in light mode):
- Dark mode: `outline-variant` #474747 at 15% opacity, 1px
- Light mode: `outline-variant` #C8C8C4 at 20% opacity, 1px

---

## 7. Components

### Buttons

| Type | Dark Mode | Light Mode |
|---|---|---|
| **Primary** | Silver gradient fill (`#E2E2E2` → `#D4D4D4`), text `on-primary` #1A1C1C | Charcoal gradient fill (`#1A1C1C` → `#2C2E2E`), text `on-primary` #F5F5F3 |
| **Secondary** | No fill, 1px ghost border, text `primary` | No fill, 1px ghost border, text `primary` |
| **Tertiary** | No fill, no border, text only. Hover: `surface-bright` bg | No fill, no border, text only. Hover: `surface-bright` bg |
| **Destructive** | `error` fill, text white | `error` fill, text white |

All buttons: `0px` border-radius, uppercase Space Grotesk, `label-lg` size.

### Input Fields
- No border, no underline
- Fill: `surface-container-low` (resting) → `surface-container-high` (active)
- Active state: 2px `primary` left-edge accent bar
- Placeholder text: `on-surface-variant`
- Labels: uppercase Space Grotesk `label-md`

### Cards
- Zero dividers inside cards
- Item separation via spacing (`1rem` to `1.3rem`)
- Card background: `surface-container` (one tier above parent)
- Hover: transition to `surface-bright`
- No rounded corners. Ever.

### Status Indicators
- **Shape:** Small diamonds (◆), never circles — mirrors the logo's faceted geometry
- **Colors:** `success` green, `warning` amber, `error` red
- **Text status badges:** Uppercase `label-md`, tight padding, background at 15% of signal color

### Data Visualization
- **Charts:** Stepped bar charts and angular area charts — no smooth curves
- **Progress rings:** Use donut charts with sharp endpoints, not rounded caps
- **Sparklines:** Angular/stepped, not bezier-smoothed

### Notification Dropdown
- Width: ~400px
- Background: `surface-container-highest`
- Items: severity icon (colored diamond) + bold title + description + timestamp
- Unread indicator: small `primary` dot
- Footer: "VIEW ALL NOTIFICATIONS" link

---

## 8. Layout, Spacing & Responsive Design (RWD)

### Breakpoints

| Token | Width | Targets |
|---|---|---|
| `mobile` | 0–639px | Phones (portrait & landscape) |
| `tablet` | 640–1023px | Tablets, small laptops |
| `laptop` | 1024–1439px | Standard laptops, small desktops |
| `desktop` | 1440px+ | Full desktops, ultrawide |

Use `min-width` media queries (mobile-first). Tailwind v4 default breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`) can map to these.

### Base Grid

| Element | Desktop (1440px+) | Laptop (1024–1439px) | Tablet (640–1023px) | Mobile (0–639px) |
|---|---|---|---|---|
| **Sidebar** | Fixed 240px, always visible | Fixed 240px, collapsible via toggle | Hidden, slide-in overlay (280px) | Hidden, full-width overlay |
| **Top bar** | 64px height | 64px height | 56px height | 48px height |
| **Main content** | Fluid, max-width 1440px | Fluid, full width | Fluid, full width | Fluid, full width |
| **Main padding** | `space-16` (64px) | `space-10` (40px) | `space-6` (24px) | `space-4` (16px) |
| **Bottom status bar** | 32px, visible | 32px, visible | Hidden | Hidden |

### Sidebar Responsive Behavior

| Viewport | Behavior |
|---|---|
| **Desktop** | Always visible. Sidebar + main content side-by-side. User can collapse via toggle → sidebar shrinks to 64px icon-only rail |
| **Laptop** | Visible by default. User can collapse to icon-only rail (64px) via toggle. Main content reflows |
| **Tablet** | Hidden by default. Hamburger menu in top bar opens sidebar as a 280px overlay with backdrop blur. Tap outside or navigate to close |
| **Mobile** | Hidden by default. Hamburger opens full-width sidebar overlay. Navigation items get larger touch targets (48px min height). Bottom sheet alternative acceptable |

#### Icon-Only Rail (Collapsed Sidebar)
- Width: 64px
- Shows: logo icon (no wordmark), nav icons only (no labels), tooltip on hover with label
- Active state: icon background highlight instead of left accent bar
- Bottom: icon-only for Logout and System Status

### Spacing Scale (Base)
| Token | Value |
|---|---|
| `space-1` | 0.25rem (4px) |
| `space-2` | 0.5rem (8px) |
| `space-3` | 0.75rem (12px) |
| `space-4` | 1rem (16px) |
| `space-5` | 1.25rem (20px) |
| `space-6` | 1.5rem (24px) |
| `space-8` | 2rem (32px) |
| `space-10` | 2.5rem (40px) |
| `space-12` | 3rem (48px) |
| `space-16` | 4rem (64px) |

### Responsive Spacing Adjustments

| Context | Desktop | Laptop | Tablet | Mobile |
|---|---|---|---|---|
| Page padding | `space-16` (64px) | `space-10` (40px) | `space-6` (24px) | `space-4` (16px) |
| Section gap | `space-12` (48px) | `space-10` (40px) | `space-8` (32px) | `space-6` (24px) |
| Card padding | `space-8` (32px) | `space-6` (24px) | `space-6` (24px) | `space-4` (16px) |
| Card gap (grid) | `space-6` (24px) | `space-4` (16px) | `space-4` (16px) | `space-3` (12px) |
| Table cell padding | `space-4` (16px) | `space-3` (12px) | `space-3` (12px) | `space-2` (8px) |

### Responsive Typography Adjustments

| Token | Desktop | Tablet | Mobile |
|---|---|---|---|
| `display-lg` | 48px | 36px | 28px |
| `display-md` | 36px | 28px | 22px |
| `headline-lg` | 28px | 22px | 18px |
| `headline-md` | 22px | 18px | 16px |
| `body-lg` | 16px | 16px | 15px |
| `body-md` | 14px | 14px | 14px |
| `label-lg` | 14px | 13px | 12px |
| `label-sm` | 11px | 11px | 11px |

### Screen-Specific Responsive Rules

#### Hero Metrics Row (Dashboard, Agents Overview)
| Viewport | Layout |
|---|---|
| Desktop | 4 cards in one horizontal row |
| Laptop | 4 cards in one row (compressed) |
| Tablet | 2×2 grid |
| Mobile | Single column stack (4 cards vertical) |

#### Agent Table (Agents Overview)
| Viewport | Behavior |
|---|---|
| Desktop | Full table with all columns visible |
| Laptop | Full table, `Success Rate` column uses compact bar |
| Tablet | Hide `Connector Type` column. Horizontal scroll enabled |
| Mobile | Convert to card-based list. Each agent = one card with stacked fields. No table layout |

#### Communication Hub (Inbox) — 3-Panel Layout
| Viewport | Behavior |
|---|---|
| Desktop | 3 panels side-by-side: sessions list (280px) + thread (fluid) + tools (280px) |
| Laptop | 2 panels: sessions list (240px) + thread (fluid). Tools panel accessible via toggle |
| Tablet | 1 panel at a time. Sessions list → tap agent → thread view. Back button to return |
| Mobile | Same as tablet. Thread input bar stays fixed at bottom. Session list is a full-screen view |

#### Task Board (Kanban)
| Viewport | Behavior |
|---|---|
| Desktop | Horizontal scrolling columns, all visible |
| Laptop | Horizontal scrolling, 2–3 columns visible at once |
| Tablet | Horizontal scrolling, 1–2 columns visible. Swipe to navigate |
| Mobile | Single column view with tab/dropdown to switch between columns (READY / ACTIVE / VALIDATION) |

#### Approval Queue
| Viewport | Behavior |
|---|---|
| Desktop | Full-width approval cards with inline diff preview |
| Laptop | Same layout, diff preview may truncate with "expand" button |
| Tablet | Cards stack full-width. Diff preview collapsed by default |
| Mobile | Cards full-width. Action buttons (REJECT / AUTHORIZE) stack vertically. Diff preview in expandable accordion |

#### Timeline / Audit Log
| Viewport | Behavior |
|---|---|
| Desktop | Timeline left (fluid) + analytics sidebar right (320px) |
| Laptop | Same layout, sidebar compressed (280px) |
| Tablet | Single column. Analytics panel moves above timeline as a collapsible summary bar |
| Mobile | Single column. Analytics hidden behind "View Stats" toggle. Event cards simplified |

#### Notification Dropdown
| Viewport | Behavior |
|---|---|
| Desktop/Laptop | 400px dropdown anchored to bell icon |
| Tablet | 360px dropdown anchored to bell icon |
| Mobile | Full-width bottom sheet sliding up from bottom edge, 80% viewport height max |

#### Login / Registration
| Viewport | Behavior |
|---|---|
| Desktop | Split-screen: left hero (50%) + right form (50%) |
| Laptop | Split-screen: left hero (40%) + right form (60%) |
| Tablet | Single column. Hero section becomes a compact banner above the form |
| Mobile | Single column. Hero reduced to logo + one-line tagline. Form card fills viewport |

### Touch Targets (Tablet & Mobile)
- Minimum touch target: **44×44px** (WCAG 2.5.8)
- Sidebar nav items on mobile: 48px min height
- Table/list row tap zones: full-row with 48px min height
- Button minimum padding: `space-3` vertical, `space-6` horizontal
- Action buttons in approval cards: min 44px height, full-width on mobile

### Sidebar Navigation (Desktop Default)
- Logo + wordmark at top
- Version tag below (`V2.4.0-STABLE`)
- Navigation items: icon + uppercase label, `space-6` vertical gap
- Active state: left accent bar (3px `primary`), label at full `primary` opacity
- Inactive: label at `on-surface-variant` opacity
- Bottom: Logout link + System Status

---

## 9. Screen-by-Screen Specification

### 9.1 Login / Registration

| Element | Specification |
|---|---|
| **Layout** | Split-screen. Left: brand hero with logo, tagline, system status metrics. Right: auth form card |
| **Dark mode** | Left side: `surface` base with geometric background polygons. Right: `surface-container` card |
| **Light mode** | Left side: `surface` #F5F5F3 with visible silver geometric polygon overlays. Right: white `surface-container-lowest` card |
| **Brand hero** | Logo, "CRYSTALLINE ARCHITECTURE" headline (Space Grotesk Bold), sub-tagline, diamond-prefixed status items |
| **Auth form** | "ACCESS COMMAND CENTER" / "Initialize Session" header. GitHub OAuth button (primary). Divider "OR VIA CREDENTIALS". Email + password fields. Login button (primary). Footer: terms links |
| **Geometric BG** | Large angular planes behind the left hero section, 3–6 overlapping polygons |
| **Footer** | Full-width bar: copyright, Privacy Policy, Terms of Service, Security, Status links |

### 9.2 Dashboard (Control Plane)

| Element | Specification |
|---|---|
| **Layout** | Standard sidebar + top bar + main content |
| **Hero metrics row** | 4 cards: Total Managed Agents, Active Conversations, Pending Approvals, System Uptime. Each with icon, large `display-lg` number, diamond-prefixed status label |
| **Recent Activity Feed** | Timestamped event list. Agent name bold, action description, status badge (SUCCESS/WARNING/COMPLETE/FAILURE color-coded) |
| **System Health panel** | Right column. Node status bars (Core Engine, Memory Cluster, Network IO) with colored indicator blocks. Throughput Trend stepped bar chart |
| **Active Threads** | Bottom section. 3−column card row showing top agent threads with avatar, agent name, task label (colored), unread badge, message preview |
| **Footer bar** | System Online indicator, Cluster name, Latency, Timestamp |

### 9.3 Agents Overview

| Element | Specification |
|---|---|
| **Layout** | Hero metrics row (same 4-card pattern) + full-width agent table + bottom split (Live Execution Stream + Node Health) |
| **Agent table** | Columns: #, Agent Identity & Model, Status, Connector Type, Success Rate (Real-Time). Row hover: `surface-bright`. Status uses diamond badges |
| **Live Execution Stream** | Left panel. Timestamped log lines with color-coded status text. Monospace font for log content |
| **Node Health** | Right panel. Node name + status badge. Auth Guard indicator |

### 9.4 Agent Detail

| Element | Specification |
|---|---|
| **Layout** | Breadcrumb navigation (Agents Overview / Agent Name). Agent header card + tabbed content + right metrics panel |
| **Agent header** | Avatar icon, `display-md` agent name, status badge (BUSY/IDLE/BLOCKED), metadata row: Model Architecture, Connector, Session Uptime, Active Threads |
| **Tab navigation** | Activity · Tasks · Configuration. Active tab: underline accent |
| **Activity tab** | Vertical timeline with diamond markers. Each entry: timestamp, bold title, description block, code snippet with status label |
| **Performance Metrics** | Right panel. Success Rate donut chart (angular endpoints), Avg. Response Time, Tokens Today, Task Completion stats |
| **Connection Health** | Right panel. Heartbeat status with pulse indicator, Ingress/Egress throughput, Packet Loss |
| **Action buttons** | MANUAL_OVERRIDE (primary), TERMINATE_SESSION (secondary/destructive) |

### 9.5 Approval Queue

| Element | Specification |
|---|---|
| **Layout** | Page header with "Approval Queue" title + Pending Review count + System Integrity. Vertically stacked approval cards |
| **Approval card** | Left edge: risk severity bar (color-coded, vertical). Agent badge + submission time. Title (headline-md). Description. Inline code diff (red deletions, green additions). Validation status footer. Action buttons: REJECT (secondary) + AUTHORIZE ACTION (primary) |
| **Risk levels** | HIGH RISK: red bar + warning triangle. MEDIUM: amber. LOW: green. Each uses the vertical bar + icon pattern |

### 9.6 Communication Hub (Inbox)

| Element | Specification |
|---|---|
| **Layout** | 3-panel: Left sidebar (active sessions list), Center (conversation thread), Right tools/header |
| **Active Sessions sidebar** | Agent avatar, name, last message preview, timestamp. Status badges (COLLABORATIVE, SYSTEM). Typing indicator. "NEW INITIATIVE" button at bottom |
| **Conversation thread** | Messages from agents show code diffs, analysis text, proposed changes. Messages from operator shown as reply bubbles. System intervention cards: approval prompts with GRANT PERMISSION / DECLINE REQUEST + VIEW IMPACT REPORT |
| **Message input** | Bottom: code/attachment/image icons, text input, send button. Status: "2 AGENTS ONLINE" |
| **Header** | Session title, participant list, LOGS + EXPORT actions |

### 9.7 Operator Profile

| Element | Specification |
|---|---|
| **Layout** | Profile header + 2-column content grid |
| **Profile header** | Avatar, operator name (display-md), level badge, role, datacenter location. Actions: EDIT METADATA, EXPORT LOG |
| **Identity Parameters** | Legal Designation, Interface Email, Timezone, Language Protocol. All as input fields |
| **Operational Metrics** | Successful Deployments count, Approval Consistency percentage, Current Standing badge |
| **Security & Encryption** | API Master Key (masked + ROTATE KEY button), Multi-Factor Authentication status, Active Sessions with TERMINATE ALL |
| **Interface Config** | Theme selector: Obsidian (Dark) / Platinum (Light) thumbnail cards. Data Density toggle. Motion Reduction toggle |
| **Recent Command Stream** | Table: Timestamp, Action Directive, Target Instance, Status (diamond-colored), Reference ID |

### 9.8 Settings (System Configuration)

| Element | Specification |
|---|---|
| **Layout** | Full-width sections stacked vertically |
| **Adapter Connectors** | Featured connector card (GitHub Connector with status badge, description, RECONFIGURE + LOGS buttons). Right: connector list (VS Code Extension, Slack Relay) + ADD NEW CONNECTOR |
| **Relay & Server** | Relay Endpoint URL, Protocol Buffer Version dropdown |
| **Interface & Theme** | Theme thumbnails: Obsidian (Dark) / Platinum (Light). Preview boxes. Active indicator |
| **Toggles** | Auto-Scale Workers, Desktop Notifications. Standard toggle components |

### 9.9 Task Board (Kanban)

| Element | Specification |
|---|---|
| **Layout** | "MISSION CONTROL" header with operational status. Board/List toggle. Horizontal scrolling columns |
| **Columns** | READY FOR QUEUE, ACTIVE OPERATIONS, VALIDATION (and more). Each with item count badge + overflow menu |
| **Task cards** | Agent badge, priority indicator bars (vertical colored bars), task title (headline-md), description, assigned agent avatars, metadata (time remaining, completion %). CRITICAL label for high-priority items |
| **Right toolbar** | Vertical icon strip for quick filters/views |

### 9.10 Timeline / Audit Log

| Element | Specification |
|---|---|
| **Layout** | Left: vertical timeline. Right: event analytics sidebar |
| **Timeline** | Epoch grouping headers (TODAY, YESTERDAY). Diamond markers on vertical line. Event cards: icon, bold title, status badge, origin label, timestamp, description, action buttons (RESTART NODE, VIEW LOGS) |
| **Event types** | Reconnection (info), Execution Failure (error/critical), Deployment Approval (success/security). Each styled by severity |
| **Right sidebar** | Event Distribution panel (Success %, Failures %), Signal Integrity stepped chart, Active Filters (tag chips with ×) |
| **Search** | Filter-by-agent search bar in top header |

### 9.11 Notification Dropdown

| Element | Specification |
|---|---|
| **Layout** | Dropdown panel anchored to the bell icon in the top bar. ~400px wide |
| **Header** | "NOTIFICATIONS" label + "MARK ALL READ" action |
| **Items** | Severity icon (error ⊘, warning △, success ✓, info ⓘ, system ⚙) + bold title + description + relative timestamp. Unread items have stronger font weight and a left accent dot |
| **Footer** | "VIEW ALL NOTIFICATIONS" link to full notifications page |
| **Bell badge** | Red circle with unread count on the bell icon |

---

## 10. Interaction & Motion

### Transitions
- **Page transitions:** None. Instant swap. Command centers don't animate page loads.
- **Hover states:** 150ms ease-out background-color transition to `surface-bright`
- **Dropdown open/close:** 200ms ease-out opacity + translateY(-4px → 0)
- **Notification badge pop:** 200ms scale(0.8 → 1) + opacity
- **Status changes:** 300ms color transition for diamond status indicators

### Micro-interactions
- **Diamond pulse:** Status diamonds pulse once (300ms scale 1→1.2→1) when an agent's status changes in real-time
- **Approval card entry:** Fade-in 250ms when new approval arrives
- **Activity feed prepend:** New items slide in from top, 200ms translateY
- **Toast notifications:** Slide in from top-right, 300ms. Auto-dismiss after 5s

### Motion Reduction
When `prefers-reduced-motion` is active OR the Motion Reduction toggle in Profile is on:
- All transitions become instant (0ms)
- Diamond pulse disabled
- Slide animations disabled
- Only opacity fades retained at 100ms

---

## 11. Mode Toggle Behavior

### Implementation
- Toggle location: Operator Profile → Interface Config → Theme selector
- Also available in Settings → Interface & Theme
- System preference detection: respect `prefers-color-scheme` on first visit
- User choice persists in localStorage and overrides system preference
- Mode switch: instant swap of CSS custom properties, no page reload

### What Changes Between Modes

| Element | Obsidian (Dark) | Platinum (Light) |
|---|---|---|
| Surface hierarchy | Dark greys (#131313 → #353534) | Light greys (#F5F5F3 → #D6D5D1) |
| Primary text | Silver #E2E2E2 | Charcoal #1A1C1C |
| Primary buttons | Silver gradient fill | Charcoal gradient fill |
| Geometric BG | White polygons at 2–5% opacity | Dark polygons at 4–8% opacity |
| Shadows | Nearly invisible (4–8%) | Slightly visible (6–12%) |
| Ghost borders | #474747 at 15% | #C8C8C4 at 20% |
| Logo | Dark sheep on dark surface (tonal) | Dark sheep on light surface (contrast) |
| High-signal colors | Unchanged | Unchanged |
| Code blocks | Dark fill (`surface-container`) | Light fill (`surface-container`) |
| Scrollbars | Thin, `surface-bright` thumb | Thin, `surface-container-high` thumb |

---

## 12. Iconography

### System
- Icon set: **Lucide React** (already in project dependencies)
- Stroke width: 1.5px
- Size: 20px (sidebar nav), 16px (inline), 24px (top bar actions)
- Color: `on-surface-variant` (resting), `primary` (active/hover)

### Status Diamonds
Custom SVG diamond shapes (`◆`) — not from Lucide. Sized at 8px (inline status), 12px (card status), 16px (timeline markers).

### Agent Avatars
- Square containers with `0px` border-radius
- Background: `surface-container-high`
- Icon inside: Lucide robot/cloud/shield variants based on connector type
- Size: 40px (list items), 64px (detail header), 32px (compact/thread)

---

## 13. Accessibility

### Contrast Requirements
- All text on surfaces must meet **WCAG AA** minimum (4.5:1 for body, 3:1 for large text)
- High-signal colors on surface backgrounds are pre-validated for both modes
- Ghost borders exist specifically as a fallback when tonal contrast alone is insufficient (more common in light mode)

### Focus States
- Outline: 2px `primary` outline, 2px offset
- Never rely on color alone to convey status — always pair diamonds with text labels

### Keyboard Navigation
- Full tab-through for all interactive elements
- Focus-visible ring matches the 2px primary outline spec
- Dropdown items navigable via arrow keys

---

## 14. File & Asset Checklist

| Asset | Status | Path |
|---|---|---|
| Logo (transparent PNG) | ✅ | `docs/logo/Whisk_82cec6ada29abd6b2fc4858c78de0cf3dr-removebg-preview.png` |
| Stitch designs (11 screens) | ✅ | `docs/stitch designs/photos/` |
| Stitch code references | ✅ | `docs/stitch designs/stitch codes/` |
| Original DESIGN.md tokens | ✅ | `docs/stitch designs/DESIGN.md` |
| Light mode prototype | ✅ | Provided by Rafi (login screen with geometric BG) |
| PWA icons (multiple sizes) | ❌ | Need: 72, 96, 128, 144, 152, 192, 384, 512px |
| Favicon (ICO/SVG) | ❌ | Need: 16×16, 32×32 |
| Logo SVG (vector source) | ❌ | Recommended for scaling |
| OG / social share image | ❌ | Recommended: 1200×630 |

---

## 15. Frontend Stack & Required Dependencies

### Current Stack (Keep)
| Layer | Tool | Version | Status |
|---|---|---|---|
| Framework | React | 18.2 | ✅ Keep |
| Bundler | Vite | 5.x | ✅ Keep |
| Styling | Tailwind CSS | 4.2 (v4 with `@tailwindcss/vite` plugin) | ✅ Keep |
| Language | TypeScript | 5.3 | ✅ Keep |
| Icons | Lucide React | latest | ✅ Keep |

### Required Additions

#### 1. `react-router-dom` — Client-Side Routing
**Why:** The current `App.tsx` uses `useState<Screen>` to swap views. This means no real URLs, no browser back/forward, no deep-linking. With 11 screens, proper routing is mandatory.

**Install:**
```bash
npm install react-router-dom --workspace=@code-shepherd/ui
```

**Route Map:**
| Route | Screen | Notes |
|---|---|---|
| `/login` | Login / Registration | Public, no sidebar |
| `/` or `/dashboard` | Dashboard (Control Plane) | Default authenticated route |
| `/inbox` | Communication Hub (Inbox) | Primary product surface |
| `/agents` | Agents Overview | Agent list |
| `/agents/:agentId` | Agent Detail | Drill-down from agents table |
| `/approvals` | Approval Queue | Triage surface |
| `/tasks` | Task Board (Kanban) | Coordination |
| `/timeline` | Timeline / Audit Log | History |
| `/settings` | Settings (System Config) | System config |
| `/profile` | Operator Profile | User profile & theme |

**Implementation Notes:**
- Use `<BrowserRouter>` → `<Routes>` → `<Route>` pattern
- Wrap authenticated routes in a `<ProtectedLayout>` component that renders the sidebar + top bar
- Login page uses a separate `<PublicLayout>` with no sidebar (full-bleed split-screen design)
- The notification dropdown is a portal/overlay — not a route

#### 2. `zustand` — Lightweight State Management
**Why:** The app needs shared state across 11 screens: theme mode, authenticated user, WebSocket connection status, notification counts, real-time agent data. React context alone gets messy at this scale.

**Install:**
```bash
npm install zustand --workspace=@code-shepherd/ui
```

**Recommended Stores:**
| Store | Manages |
|---|---|
| `useThemeStore` | Current mode (obsidian/platinum), motion preference, data density |
| `useAuthStore` | Session data, operator identity, JWT token |
| `useAgentStore` | Agent registry state, online/offline status, last heartbeat |
| `useNotificationStore` | Unread count, notification list, read/unread state |
| `useWebSocketStore` | Connection status, event subscriptions, reconnect state |

#### 3. CSS Custom Properties Theme Layer
**Why:** Tailwind v4 alone cannot toggle between two full color systems (Obsidian vs Platinum) cleanly. You need a CSS variables layer that Tailwind references, so theme switching = swapping one class on `<html>`.

**See Section 16 below for full implementation spec.**

### Optional Additions (Recommend but not blocking)
| Library | Purpose | When |
|---|---|---|
| `@tanstack/react-query` | Server state caching for API calls | When you connect to real relay API |
| `framer-motion` | Complex animations (approval card entry, thread transitions) | If micro-interactions need more than CSS |
| `recharts` or `visx` | Stepped/angular data viz charts | When building dashboard charts |
| `vite-plugin-pwa` | Full PWA support (service worker, manifest) | Before mobile deployment |

### Mobile Strategy
When moving from web to mobile:
- **Recommended path:** Use **Capacitor** to wrap the Vite PWA into a native iOS/Android shell
- **Why Capacitor:** Same codebase, same components, native device APIs (push notifications, biometrics), minimal code changes
- **Alternative:** React Native — but this requires rewriting UI components, which is wasteful given the existing React web code

---

## 16. CSS Theme Architecture

### How Theme Switching Works

The entire color system uses CSS custom properties. Tailwind v4 references these variables. Switching themes = toggling a class on `<html>`.

#### Step 1: Define variables in `index.css`

```css
/* === Obsidian (Dark) — Default === */
:root,
[data-theme="obsidian"] {
  --surface: #131313;
  --surface-dim: #131313;
  --surface-container-lowest: #0E0E0E;
  --surface-container-low: #1C1B1B;
  --surface-container: #201F1F;
  --surface-container-high: #2B2A2A;
  --surface-container-highest: #353534;
  --surface-bright: #3A3939;
  --primary: #E2E2E2;
  --primary-container: #D4D4D4;
  --on-primary: #1A1C1C;
  --secondary: #45484A;
  --tertiary: #2F3133;
  --neutral: #0F0F0F;
  --outline-variant: #474747;
  --on-surface: #E6E1DC;
  --on-surface-variant: #C9C5C0;
  --geo-bg-color: rgba(255, 255, 255, 0.03);
  --ghost-border-opacity: 0.15;
  --shadow-opacity: 0.06;
  color-scheme: dark;
}

/* === Platinum (Light) === */
[data-theme="platinum"] {
  --surface: #F5F5F3;
  --surface-dim: #EEEDE9;
  --surface-container-lowest: #FFFFFF;
  --surface-container-low: #F0EFEB;
  --surface-container: #EAEAE6;
  --surface-container-high: #E0DFDB;
  --surface-container-highest: #D6D5D1;
  --surface-bright: #DCDBD7;
  --primary: #1A1C1C;
  --primary-container: #2C2E2E;
  --on-primary: #F5F5F3;
  --secondary: #6B6E70;
  --tertiary: #D0CFD1;
  --neutral: #F8F8F6;
  --outline-variant: #C8C8C4;
  --on-surface: #1A1C1C;
  --on-surface-variant: #44474A;
  --geo-bg-color: rgba(0, 0, 0, 0.05);
  --ghost-border-opacity: 0.20;
  --shadow-opacity: 0.10;
  color-scheme: light;
}
```

#### Step 2: Reference variables in Tailwind / component styles

```css
.bg-surface { background-color: var(--surface); }
.bg-surface-container { background-color: var(--surface-container); }
.text-primary { color: var(--primary); }
.text-on-surface { color: var(--on-surface); }
/* etc. — Tailwind v4 @theme can also map these */
```

#### Step 3: Toggle via zustand store

```typescript
// useThemeStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'obsidian' | 'platinum'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'obsidian',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'obsidian' ? 'platinum' : 'obsidian'
          document.documentElement.setAttribute('data-theme', next)
          return { theme: next }
        })
      },
    }),
    { name: 'cs-theme' }
  )
)
```

#### Step 4: Initialize on app load

```typescript
// In App.tsx or main.tsx
const theme = useThemeStore((s) => s.theme)
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
}, [theme])
```

### Geometric Background Implementation

```css
/* Geometric polygon overlay — sits behind all content */
.geo-background::before,
.geo-background::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

.geo-background::before {
  top: -10%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: var(--geo-bg-color);
  clip-path: polygon(20% 0%, 100% 0%, 80% 100%, 0% 80%);
}

.geo-background::after {
  bottom: -10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: var(--geo-bg-color);
  clip-path: polygon(0% 20%, 60% 0%, 100% 60%, 40% 100%);
}
```

Apply `geo-background` class to the main layout wrapper. The polygons automatically adapt color via `--geo-bg-color` when the theme switches.
