# Code Shepherd — Shepherd Guide Design Extension

**Extends:** `final_design_system.md`  
**Component:** Shepherd Guide (In-App AI Assistant)  
**Stitch References:** `stitch-designs/photos/shepherd guide modal.png`, `shepherd guide trigger button.png`, `shepherd guide with preview.png`  
**Stitch Code:** `stitch-designs/stitch_codes/shepherd_guide_modal/`, `shepherd_guide_trigger_button/`, `shepherd_guide_trigger_with_preview/`

---

## 1. Overview

Shepherd Guide is a first-party AI assistant embedded inside Code Shepherd. It consists of three UI states:

1. **Trigger Button** — A floating chathead square in the bottom-right corner (resting state)
2. **Trigger with Preview** — The trigger button with a tooltip showing the last assistant message
3. **Chat Modal** — The full conversation panel that opens on click

### Availability

- **Visible on:** All authenticated screens (Dashboard, Agents, Inbox, Approvals, Tasks, Timeline, Settings, Profile)
- **Hidden on:** Login / Registration page — the assistant requires authentication context

### Design System Alignment

All three components follow the Crystalline Architecture rules from `final_design_system.md`:
- Zero border-radius everywhere
- Structure via tonal shifts (no solid borders, ghost borders at 15% opacity only)
- Diamond (◆) shapes for status indicators — never circles
- Space Grotesk uppercase for labels, Manrope for body, JetBrains Mono for code/timestamps
- Lucide React icons (consistent with the rest of the app)

---

## 2. Component 1 — Floating Trigger Button

### Visual Spec

| Property | Value |
|---|---|
| **Size** | 56×56px, sharp square |
| **Background** | Silver gradient `#E2E2E2` → `#D4D4D4` (same as `shell-button-primary`) |
| **Shadow** | `0 8px 32px rgba(0, 0, 0, 0.28)` |
| **Position** | `fixed`, `bottom: 24px`, `right: 24px` |
| **z-index** | `100` (above all page content, below modals) |
| **Border-radius** | `0px` — sharp square |

### Icon

The icon is a **diamond outline with a `?` inside** — not a Lucide icon, it is a custom element:
- Outer diamond: `24×24px` container, `border: 2px solid #1A1C1C`, `rotate(45deg)`
- Inner text: `?` in Space Grotesk Bold, `14px`, color `#1A1C1C`, centered (counter-rotated to stay upright)

### Unread Badge

| Property | Value |
|---|---|
| **Size** | 18×18px sharp square |
| **Position** | Absolute, `top: -2px`, `right: -2px` (overlapping corner) |
| **Background** | `#EF5350` (error red) |
| **Text** | Unread count, Space Grotesk Bold, `9px`, white |
| **Border-radius** | `0px` — sharp square badge, NOT a circle |

### States

| State | Behavior |
|---|---|
| **Resting** | Silver gradient background, static |
| **Hover** | Background shifts to `#D4D4D4`, tooltip appears above (see Section 2.1) |
| **Active/Pressed** | `scale(0.95)` on click, 150ms transition |
| **Modal Open** | Button is hidden (modal replaces it in the same position) |

### 2.1 Hover Tooltip

On hover, a sharp-edged tooltip appears **above** the button:

| Property | Value |
|---|---|
| **Background** | `#353534` (surface-container-highest) |
| **Padding** | `8px 16px` |
| **Text** | "SHEPHERD GUIDE" — Space Grotesk Bold, `10px`, uppercase, tracking `0.16em`, color `#E2E2E2` |
| **Notch** | Angular downward-pointing notch (CSS `clip-path`) centered on the bottom edge |
| **Animation** | `opacity 0 → 1`, 200ms ease-out |

---

## 3. Component 2 — Trigger with Preview Tooltip

When the assistant has a proactive message or last-conversation context, a **preview tooltip** appears to the left of the trigger button.

### Visual Spec

| Property | Value |
|---|---|
| **Width** | `280px` |
| **Background** | `#201F1F` (surface-container) |
| **Border** | Ghost border: `1px solid #474747` at 15% opacity |
| **Shadow** | `shadow-2xl` (Tailwind: ambient dark shadow) |
| **Padding** | `12px 16px` |
| **Position** | Absolute, `bottom: 0`, `right: 72px` (left of trigger button) |

### Content Structure

1. **Header row:** 6px diamond in `#42A5F5` (info blue) + "SHEPHERD GUIDE" in Space Grotesk Bold, `10px`, uppercase, tracking `0.16em`, color `#C9C5C0`
2. **Preview text:** Manrope `12px`, line-height relaxed, color `#E6E1DC` — shows last assistant message preview (max 2 lines, truncated)

### Notch (Pointer Arrow)

- Angular triangular notch pointing right toward the trigger button
- CSS `clip-path: polygon(0% 0%, 100% 50%, 0% 100%)`
- Size: `8×16px`
- Background: matches tooltip `#201F1F`
- Position: `right: -8px`, vertically centered on tooltip

### Behavior

| Trigger | Action |
|---|---|
| New proactive message from Shepherd Guide | Preview appears with 200ms fade-in |
| User clicks tooltip | Opens full chat modal |
| User clicks X or taps outside | Preview dismisses |
| After 8 seconds idle | Preview auto-dismisses with 200ms fade-out |

---

## 4. Component 3 — Chat Modal

### Container

| Property | Value |
|---|---|
| **Size** | `420×620px` |
| **Background** | `#353534` (surface-container-highest) |
| **Shadow** | `0 20px 50px rgba(0, 0, 0, 0.5)` |
| **Border** | Ghost border: `1px solid #474747` at 15% opacity |
| **Position** | `fixed`, `bottom: 24px`, `right: 24px` (replaces trigger button) |
| **z-index** | `200` (above trigger button, above dark overlay) |
| **Border-radius** | `0px` |
| **Layout** | Flex column: Header → Chat Area → Quick Suggestions → Input Footer |

### 4.1 Modal Header

| Property | Value |
|---|---|
| **Height** | `56px` (h-14) |
| **Background** | `#1C1B1B` (surface-container-low) — one tonal tier darker than modal body |
| **Padding** | `0 16px` |

**Left side:**
- 8px diamond: `background: #4CAF50` (success green), `rotate(45deg)`
- "SHEPHERD GUIDE": Space Grotesk Bold, `11px`, uppercase, tracking `0.18em`, color `#E2E2E2`

**Right side:**
- "POWERED BY OPENCLAW": JetBrains Mono, `9px`, uppercase, tracking tight, color `#C9C5C0`
- Close button: Lucide `X` icon, `18px`, color `#C9C5C0` → hover `#E2E2E2`, 150ms transition

### 4.2 Chat Conversation Area

| Property | Value |
|---|---|
| **Background** | `#353534` (inherits modal bg) |
| **Padding** | `20px` |
| **Overflow** | `overflow-y: auto` with custom scrollbar (4px width, `#474747` thumb) |
| **Message gap** | `32px` vertical spacing between message groups |

#### User Messages (right-aligned)

| Property | Value |
|---|---|
| **Max width** | `85%` of chat area |
| **Alignment** | `margin-left: auto` (right-aligned) |
| **Background** | `#2B2A2A` (surface-container-high) |
| **Padding** | `16px` |
| **Text** | Manrope `14px`, line-height relaxed, color `#E2E2E2` |
| **Timestamp** | JetBrains Mono `10px`, uppercase, tracking tight, color `#C9C5C0`, right-aligned below message |

#### Assistant Messages (left-aligned)

| Property | Value |
|---|---|
| **Max width** | `95%` of chat area |
| **Alignment** | Left-aligned (default) |

**Sender label (above message):**
- 8px diamond: `background: #42A5F5` (info blue), `rotate(45deg)`
- "SHEPHERD GUIDE": Space Grotesk Bold, `10px`, uppercase, tracking widest, color `#E2E2E2`

**Message container:**
| Property | Value |
|---|---|
| **Background** | `#201F1F` (surface-container) |
| **Left accent bar** | `2px solid #E2E2E2` (primary silver) — vertical left edge |
| **Padding** | `20px` |
| **Text** | Manrope `14px`, line-height relaxed, color `#E2E2E2` |

**Code blocks inside messages:**
| Property | Value |
|---|---|
| **Background** | `#1C1B1B` (surface-container-low) |
| **Padding** | `12px` |
| **Font** | JetBrains Mono `12px`, color `#E2E2E2` |
| **Border** | Ghost border `1px solid #474747` at 10% opacity |
| **Comment text** | Color `#C9C5C0` (on-surface-variant) |

**Feedback row (bottom of assistant message):**
- Separator: `border-top: 1px solid #474747` at 10% opacity, `padding-top: 16px`
- Left: "WAS THIS HELPFUL?" — Space Grotesk, `10px`, uppercase, tracking wider, color `#C9C5C0`
- Feedback buttons: Two diamond-shaped buttons (20×20px), `rotate(45deg)`, bg `#2B2A2A`, containing thumbs-up / thumbs-down icons (counter-rotated), hover bg `#3A3939`
- Right: Timestamp in JetBrains Mono `10px`

### 4.3 Quick Suggestion Chips

| Property | Value |
|---|---|
| **Container** | Horizontal scrollable row, `padding: 12px 20px`, bg `#353534`, `border-top: 1px solid #474747` at 10% opacity |
| **Chip gap** | `8px` |
| **Overflow** | `overflow-x: auto`, hidden scrollbar |

**Individual chip:**
| Property | Value |
|---|---|
| **Background** | `#2B2A2A` (surface-container-high) |
| **Padding** | `8px 12px` |
| **Icon** | 6px diamond, `background: #42A5F5`, `rotate(45deg)` |
| **Text** | Space Grotesk SemiBold, `11px`, uppercase, tracking tight, color `#E2E2E2` |
| **Hover** | Background shifts to `#3A3939` (surface-bright), 150ms transition |
| **Shrink** | `flex-shrink: 0` (no wrapping) |

**Default suggestions:**
1. "CONNECT AN AGENT"
2. "APPROVAL TIERS"
3. "TROUBLESHOOTING"

### 4.4 Input Footer

| Property | Value |
|---|---|
| **Background** | `#131313` (surface base — deepest layer) |
| **Padding** | `16px` |
| **Layout** | Flex column: input row + disclaimer text |

**Input field:**
| Property | Value |
|---|---|
| **Background** | `#201F1F` (surface-container) → focus: `#2B2A2A` (surface-container-high) |
| **Left accent** | `2px solid #E2E2E2` (primary), always visible |
| **Border** | None |
| **Text** | Manrope `14px`, color `#E2E2E2` |
| **Placeholder** | "Describe your request..." in `#C9C5C0` |
| **Height** | `44px` (matches WCAG touch target minimum) |
| **Focus ring** | None (accent bar serves as the active indicator) |

**Send button:**
| Property | Value |
|---|---|
| **Size** | `44×44px` |
| **Background** | Silver gradient `#E2E2E2` → `#D4D4D4` |
| **Icon** | Lucide `ArrowRight`, `20px`, color `#1A1C1C` |
| **Active** | `scale(0.95)` on press |

**Disclaimer text:**
- "SHEPHERD GUIDE ONLY ANSWERS QUESTIONS ABOUT CODE SHEPHERD."
- Space Grotesk, `9px`, uppercase, tracking `0.05em`, color `#C9C5C0`, center-aligned

---

## 5. Dark Overlay (Behind Modal)

When the chat modal is open:

| Property | Value |
|---|---|
| **Coverage** | Full viewport, `position: fixed`, `inset: 0` |
| **Background** | `rgba(0, 0, 0, 0.40)` — 40% black overlay |
| **z-index** | `150` (above page content, below modal) |
| **Interaction** | Click on overlay closes the modal |
| **Blur** | Optional `backdrop-filter: blur(2-4px)` on the page content behind overlay |

---

## 6. Responsive Behavior

### Desktop (1440px+)
- Full 420×620px modal in bottom-right corner
- Trigger button always visible (24px from edges)
- Preview tooltip appears to the left of trigger

### Laptop (1024–1439px)
- Same as desktop, modal may shrink to 400×580px if needed
- Trigger button same position

### Tablet (640–1023px)
- Trigger button: 48×48px (slightly smaller), `bottom: 16px`, `right: 16px`
- Modal: 360px wide, 70% viewport height, still bottom-right anchored
- Preview tooltip: hidden (no space), tap-to-open only

### Mobile (0–639px)
- Trigger button: 48×48px, `bottom: 16px`, `right: 16px`
- **Modal becomes a bottom sheet:** full viewport width, 85% viewport height, slides up from bottom edge
- Close button prominent, swipe-down to dismiss
- Quick suggestion chips: horizontal scroll with visible overflow hint
- No overlay blur (performance)

---

## 7. Interaction & Motion

| Action | Animation | Duration |
|---|---|---|
| **Modal open** | Slide up from bottom-right + fade in | 200ms ease-out |
| **Modal close** | Slide down + fade out | 150ms ease-out |
| **Preview tooltip appear** | Fade in from right | 200ms ease-out |
| **Preview tooltip dismiss** | Fade out | 200ms ease-out |
| **Hover tooltip (trigger)** | Opacity 0 → 1 | 200ms ease-out |
| **New message received** | Slide in from left (assistant) or right (user) | 200ms ease-out |
| **Send button press** | `scale(0.95)` | 150ms |
| **Suggestion chip hover** | Background color transition | 150ms ease-out |

When `prefers-reduced-motion` is active or Motion Reduction toggle is on:
- All slide animations become instant opacity transitions at 100ms
- Scale effects disabled

---

## 8. Light Mode (Platinum) Adaptations

The modal follows the same Platinum token swaps from `final_design_system.md`:

| Element | Obsidian (Dark) | Platinum (Light) |
|---|---|---|
| Modal background | `#353534` | `#D6D5D1` (surface-container-highest) |
| Modal header bg | `#1C1B1B` | `#F0EFEB` (surface-container-low) |
| Chat area bg | `#353534` | `#D6D5D1` |
| User message bg | `#2B2A2A` | `#E0DFDB` (surface-container-high) |
| Assistant message bg | `#201F1F` | `#EAEAE6` (surface-container) |
| Code block bg | `#1C1B1B` | `#F0EFEB` |
| Input area bg | `#131313` | `#F5F5F3` (surface) |
| Input field bg | `#201F1F` | `#EAEAE6` |
| Primary text | `#E2E2E2` | `#1A1C1C` |
| Body text | `#E6E1DC` | `#1A1C1C` |
| Secondary text | `#C9C5C0` | `#44474A` |
| Trigger button bg | Silver gradient `#E2E2E2` → `#D4D4D4` | Charcoal gradient `#1A1C1C` → `#2C2E2E` |
| Trigger icon color | `#1A1C1C` | `#F5F5F3` |
| Ghost borders | `#474747` at 15% | `#C8C8C4` at 20% |
| Overlay | `rgba(0,0,0,0.40)` | `rgba(0,0,0,0.25)` |
| High-signal colors | Unchanged | Unchanged |

---

## 9. Implementation Notes

### React Component Structure

```
ShepherdGuide/
├── ShepherdGuideProvider.tsx    # Context: open/close state, messages, connection
├── ShepherdGuideTrigger.tsx     # Floating button + unread badge
├── ShepherdGuidePreview.tsx     # Preview tooltip (proactive message)
├── ShepherdGuideModal.tsx       # Full chat modal container
├── ShepherdGuideHeader.tsx      # Modal header bar
├── ShepherdGuideChatArea.tsx    # Scrollable message thread
├── ShepherdGuideMessage.tsx     # Individual message (user or assistant variant)
├── ShepherdGuideSuggestions.tsx  # Quick suggestion chips
└── ShepherdGuideInput.tsx       # Input field + send button + disclaimer
```

### Placement in App

The `ShepherdGuideProvider` wraps the authenticated layout shell (inside `AppRouter.tsx`), making it available on all pages:

```tsx
// AppRouter.tsx (simplified)
<ShepherdGuideProvider>
  <Sidebar />
  <main>{/* Page content */}</main>
  <ShepherdGuideTrigger />    {/* Fixed position, always rendered */}
  <ShepherdGuideModal />      {/* Conditionally rendered when open */}
</ShepherdGuideProvider>
```

The Login/Register page uses a separate `PublicLayout` that does **not** include `ShepherdGuideProvider`.

### Integration with Relay API

- Messages route through existing conversation endpoints: `POST /conversations`, `GET /conversations/:id`
- Agent ID: `shepherd-guide` (first-party, pre-registered)
- All conversations logged in `messages` table with `agent_id = 'shepherd-guide'`
- Feedback (thumbs up/down) stored as metadata on the message record

### Theme Switching

All colors use CSS custom properties from `index.css`. The modal automatically adapts via `data-theme` attribute on `<html>` — no conditional class logic needed in components.

---

## 10. Stitch Design Reference

| Screen | Photo | HTML Code |
|---|---|---|
| Chat Modal (open) | `stitch-designs/photos/shepherd guide modal.png` | `stitch_codes/shepherd_guide_modal/code.html` |
| Trigger Button (resting + hover) | `stitch-designs/photos/shepherd guide trigger button.png` | `stitch_codes/shepherd_guide_trigger_button/code.html` |
| Trigger with Preview Tooltip | `stitch-designs/photos/shepherd guide with preview.png` | `stitch_codes/shepherd_guide_trigger_with_preview/code.html` |
