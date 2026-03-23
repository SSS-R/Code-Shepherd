# Code Shepherd — B2C Pricing & Service Planning

## Status

Draft planning file for B2C pricing, service packaging, beta whitelist logic, and launch upgrade strategy.

This file is intentionally planning-oriented, not final pricing law.

---

## 1. Current B2C planning goals

The B2C offer should support three layers:

1. **Free** for evaluation and lightweight usage
2. **Pro** as the main paid B2C tier
3. **Max** as the heavier premium tier, still under definition

The beta program sits on top of this with a separate temporary access rule.

---

## 2. Beta whitelist policy

### Source of beta access
Beta access will come from the future website, not from the app itself.

Planned flow:

1. user submits email on the website waitlist
2. the waitlist is processed first-come, first-served
3. a cron job runs continuously and keeps count
4. only the first 200 approved users are invited into Beta Pro

### Beta benefit
Those 200 beta users receive:

- Beta Pro access before public launch
- **50% off the first 2 months of Pro** after launch
- **20% off Max** if they choose Max after launch

### Important product note
This means the app needs pricing visibility, but the whitelist control, invitation logic, and conversion logic will live in the website/backend ecosystem.

---

## 3. Draft B2C tiers

## Free

### Purpose
Give new users a low-friction way to try Code Shepherd.

### Draft positioning
- best for evaluation and light solo usage
- enough to understand the core workflow
- intentionally limited to encourage Pro upgrade

### Draft feature bucket
- single user
- limited connected agents
- basic dashboard and inbox access
- approval queue access
- basic timeline visibility
- limited history retention

### Open questions
- how many agents should Free allow
- whether Free gets mobile push notifications
- whether Free gets conversation history limits

---

## Pro

### Draft price
`$19/month`

### Purpose
This is the main B2C tier for serious solo developers and power users.

### Draft feature bucket
- more connected agents or effectively unlimited B2C-scale usage
- full inbox and conversation control
- approvals and intervention flows
- richer audit/timeline history
- task coordination and parallel supervision
- mobile and desktop control plane access

### Beta note
Beta Pro is not a separate permanent retail tier. It is a **beta-access version of Pro** granted to the first 200 approved users.

---

## Max

### Status
Still in planning.

### Purpose
For heavier individual operators running larger multi-agent workloads and wanting more premium limits.

### Draft feature direction
- higher concurrency
- higher agent/session ceilings
- deeper automation options
- premium governance and coordination features
- longer retention and richer exports

### Open questions
- final price not yet locked
- exact separation from Pro still needs product definition
- may overlap with early prosumer / solo-founder / operator segment

---

## 4. Draft packaging logic

### Simplest current interpretation

| Tier | Role in funnel | Status |
|---|---|---|
| Free | Entry / evaluation | Needed now |
| Pro | Main paid B2C tier | Price mostly defined |
| Max | Premium power-user tier | Still open |

### Recommended rule
Before launch, finalize:

1. the hard Free limits
2. the real Pro differentiation
3. the exact Max upgrade reason

If Max does not yet have a sharp value boundary, it should stay as a waitlist/planning tier rather than pretending to be final.

---

## 5. Upgrade and discount planning

### Beta-to-launch conversion

For the first 200 website-approved beta users:

- if they continue with Pro after launch → 50% off first 2 months
- if they choose Max after launch → 20% off

### Implementation note
The app UI can display these offers now, but the actual discount enforcement later needs:

- backend entitlement records
- discount expiration dates
- billing integration rules
- waitlist-to-invite mapping

---

## 6. What still needs product decisions

Before launch, these B2C questions still need firm answers:

1. what exact limits define Free
2. what exact features move from Free to Pro
3. what exact features justify Max
4. whether Max is monthly-only or annual-friendly
5. whether Pro and Max both include connector-heavy automation
6. what retention/export limits each plan gets

---

## 7. Recommended next pricing step

The cleanest next planning step is:

1. lock Free limits
2. lock Pro feature boundaries
3. define a sharp Max value proposition
4. connect website whitelist logic to future entitlement/billing design

Until those are finalized, the current app should present pricing as:

- **Free** → available
- **Pro** → primary paid tier
- **Beta Pro** → whitelist-only prelaunch offer
- **Max** → premium tier still being finalized
