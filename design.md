# Token Dine — Design System

## Overview

Clean, modern SaaS analytics dashboard aesthetic. Soft, airy, premium-financial-tool feel. Pastel accents on a nearly-white canvas with generous spacing and rounded corners.

---

## Typography

| Element | Class | Notes |
|---|---|---|
| **Font** | `Inter` via `next/font/google` | weights 400–700, `font-display: swap` |
| Fallback | `system-ui, sans-serif` | — |
| Page/Section title | `text-lg font-semibold text-gray-900` | e.g. "Users", "Transactions" |
| Tab labels (active) | `text-sm font-medium text-gray-900 bg-gray-100 rounded-full px-3 py-1.5` | pill background |
| Tab labels (inactive) | `text-sm font-medium text-gray-400` | transparent bg |
| Card eyebrow labels | `text-xs font-medium text-gray-500` | e.g. "Total Orders" |
| Big stat numbers | `text-2xl md:text-3xl font-bold text-gray-900` | visual anchors |
| Stat sub-labels | `text-xs text-gray-400` | secondary info |
| Badges / deltas | `text-xs font-semibold rounded-full px-2 py-0.5` | green/red pills |
| Table headers | `text-xs font-medium text-gray-400 uppercase` | tracking-wide |
| Table body primary | `text-sm font-medium text-gray-800` | — |
| Table body secondary | `text-sm text-gray-500` | — |

---

## Color Palette

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Page background | `#F7F7FA` | `gray-50` | Main page canvas |
| Card surface | `#FFFFFF` | `white` | Cards, modals, sidebar |
| Primary accent | `#8B7FE8` | `accent-400` / `accent-500` | Active nav, focus rings, toggle |
| Success | `#10B981` | `emerald-500` | Deltas up, active toggles, badges |
| Primary text | `#111827` | `gray-900` | Headings, body emphasis |
| Secondary text | `#6B7280` | `gray-500` | Body, descriptions |
| Tertiary text | `#9CA3AF` | `gray-400` | Labels, hints |
| Borders | `#F3F4F6` | `gray-100` | Subtle separation |
| Data viz | `#60A5FA`, `#FBBF24`, `#F87171`, `#34D399` | blue/amber/red/emerald-400 | Chart series |

### Extended accent palette

```
accent: { 50: #f3f0ff, 100: #e9e4ff, 200: #d5ccff, 300: #b7a8ff,
          400: #8b7fe8, 500: #7c6fe0, 600: #6a5cd6, 700: #5a4cc4 }
```

### Extended success palette

```
success: { 50: #ecfdf5, 100: #d1fae5, 200: #a7f3d0,
           400: #34d399, 500: #10b981, 600: #059669 }
```

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| `shadow-card` | `0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.06)` | Cards, tables |
| `shadow-card-hover` | `0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)` | Card hover |
| `shadow-soft` | `0 4px 24px -8px rgba(15,23,42,0.08)` | Legacy / modal |

---

## Spacing & Layout

| Rule | Value | Context |
|---|---|---|
| Card padding | `p-5 md:p-6` | Uniform internal spacing |
| Grid gaps | `gap-4` to `gap-6` | Between cards/grid items |
| Section vert | `space-y-6` | Vertical rhythm |
| Sidebar width | `w-64` (256px) | Fixed left nav |
| Border radius (cards) | `rounded-2xl` (16px) | Large radius |
| Border radius (buttons) | `rounded-xl` (12px) | Buttons, inputs |
| Border radius (badges) | `rounded-full` | Pills, deltas, toggles |

---

## Component Specs

### Sidebar
- Width: 64 (256px), fixed, light bg
- Logo: `bg-accent-500` rounded-xl badge "TD"
- Nav items: icon in 32px `rounded-lg` pastel chip + label
- Active: `bg-accent-50 text-accent-700` with `rounded-xl`
- Inactive: `text-gray-500`, hover → `bg-gray-50 text-gray-700`

### Header
- Transparent bg (no border-bottom)
- Welcome message with user name + role
- Theme toggle (rounded-xl, border-gray-200)
- Logout button (btn-ghost style)

### Stat Cards
- `bg-white rounded-2xl shadow-card p-5 md:p-6`
- Eyebrow label at top
- Large bold number + optional delta badge (green/red pill)
- Optional hint text below

### Data Table
- `bg-white rounded-2xl shadow-card`
- Header: `text-xs font-medium text-gray-400 uppercase`
- Body: `text-sm text-gray-700`, generous `py-4`
- Hover: `bg-gray-50/50`
- Empty state: centered text

### Status Badge
- `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium`
- Semantic colors: emerald (active/present/in-stock/resolved), amber (late/low-stock/in-progress), rose (blocked/absent/out-of-stock), sky (open)

### Modal
- Backdrop: `bg-gray-900/40 backdrop-blur-sm`
- Content: `bg-white rounded-2xl shadow-xl`
- Header: border-b with title + close button
- Footer: border-t with action buttons

### Buttons
- Primary: `rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-medium`
- Ghost: `rounded-lg border border-gray-200 bg-white text-gray-600`
- Size: consistent px-4 py-2.5

### Inputs / Search
- `rounded-xl bg-gray-100 px-4 py-2.5 text-sm`
- Focus: `bg-white ring-2 ring-accent-400/30`
- No visible border (bg color separates from surface)

### Date Range Filter
- Pill buttons in `rounded-xl bg-gray-100 p-1`
- Active: `bg-white shadow-sm`
- Inactive: `text-gray-500`

### Gradient Stat Boxes (Dashboard overview)
- Full-bleed gradient background with decorative blurred circles
- White icon in `bg-white/20` rounded container
- Large white bold number, light label text
- "View details" arrow on hover

---

## Currency / Tokens

- BDT amounts: `৳ {amount.toLocaleString("en-BD")}` — use `formatBDT()`
- Token amounts: `{amount.toLocaleString("en-BD")} tkn` — use `formatTokens()`
- The system operates on **prepaid tokens** as the primary unit
- Product pricing is in BDT (for cost/margin calculations only)

---

## Dark Mode

- `darkMode: "class"` — toggled by `ThemeContext`
- All components have `dark:` variants
- Dark bg: `gray-950`, card: `gray-900`
- Dark text: `gray-100` / `gray-300` / `gray-400` / `gray-500`

---

## File Reference

| File | What it defines |
|---|---|
| `tailwind.config.ts` | Design tokens (colors, shadows, fonts) |
| `app/globals.css` | `.card`, `.input`, `.btn-primary`, `.btn-ghost`, `.badge` |
| `components/` | Sidebar, Header, DataTable, Modal, StatCard, etc. |
| `lib/format.ts` | `formatBDT()`, `formatTK()`, `formatTokens()` helpers |
