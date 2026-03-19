# Provider Dashboard — Design Specification

## Navigation

**Collapsible sidebar** (240px expanded, 48px collapsed icon rail). Persistent on desktop (>=1024px), collapses to a `Sheet` overlay triggered by a hamburger icon on mobile (<1024px).

Sidebar sections:
- **Logo mark** — top, 32x32, links to `/dashboard`
- **Primary nav** — Dashboard, Forms, Briefs (icons: `LayoutDashboard`, `FileText`, `BookOpen` from Lucide)
- **Secondary nav** (bottom) — Settings (`Settings`), Help (`HelpCircle`)
- **User button** — Clerk `<UserButton />` at the very bottom

Active state: `bg-zinc-800` fill on the nav item row, white text + white icon. Inactive: `text-zinc-400`, hover `text-zinc-200 bg-zinc-800/50`. Transition: `transition-colors duration-150`.

**Breadcrumbs** appear in the main content header for nested routes (e.g., Dashboard > Briefs > Session abc123). Use shadcn `Breadcrumb` with `text-zinc-500` separators.

---

## Color System

All values use oklch for perceptual uniformity.

### Dark Mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.145 0.000 0)` | Page background (#0a0a0a) |
| `--card` | `oklch(0.178 0.000 0)` | Card/panel surfaces (#141414) |
| `--elevated` | `oklch(0.215 0.000 0)` | Popovers, dropdown menus (#1e1e1e) |
| `--border` | `oklch(0.274 0.000 0)` | Borders, dividers (#272727) |
| `--foreground` | `oklch(0.985 0.000 0)` | Primary text (#fafafa) |
| `--muted-foreground` | `oklch(0.556 0.000 0)` | Secondary text (#737373) |
| `--accent` | `oklch(0.650 0.200 265)` | Accent — Violet (#7c5cfc) |
| `--accent-foreground` | `oklch(0.985 0.000 0)` | Text on accent |
| `--ring` | `oklch(0.650 0.200 265)` | Focus rings |

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(1.000 0.000 0)` | #ffffff |
| `--card` | `oklch(0.985 0.000 0)` | #fafafa |
| `--elevated` | `oklch(1.000 0.000 0)` | #ffffff |
| `--border` | `oklch(0.900 0.000 0)` | #e5e5e5 |
| `--foreground` | `oklch(0.145 0.000 0)` | #0a0a0a |
| `--muted-foreground` | `oklch(0.450 0.000 0)` | #636363 |
| `--accent` | `oklch(0.550 0.230 265)` | Deeper violet for contrast |

### Accent: Violet

Violet (`oklch hue 265`) is the single accent. It reads as professional and premium against zinc, avoids confusion with the semantic flag colors (red/amber/blue), and has strong contrast at WCAG AA on both themes.

### Semantic Colors

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--flag-risk` | `oklch(0.637 0.237 25)` | `oklch(0.577 0.245 25)` | Red flags (risk/safety) |
| `--flag-complexity` | `oklch(0.769 0.188 70)` | `oklch(0.666 0.200 65)` | Amber flags (complexity) |
| `--flag-info` | `oklch(0.623 0.214 255)` | `oklch(0.546 0.245 255)` | Blue flags (informational) |
| `--success` | `oklch(0.696 0.182 163)` | `oklch(0.546 0.200 163)` | Success states |
| `--destructive` | `oklch(0.637 0.237 25)` | `oklch(0.577 0.245 25)` | Error/delete actions |

---

## Typography

**Font stack:** `font-family: 'Geist Sans', ui-sans-serif, system-ui, sans-serif`
**Mono stack:** `font-family: 'Geist Mono', ui-monospace, monospace`

| Level | Element | Font | Weight | Size | Line Height | Tracking |
|-------|---------|------|--------|------|-------------|----------|
| Page title | h1 | Geist Sans | 600 | 24px (1.5rem) | 32px | -0.025em |
| Section title | h2 | Geist Sans | 600 | 18px (1.125rem) | 28px | -0.02em |
| Card title | h3 | Geist Sans | 500 | 14px (0.875rem) | 20px | -0.01em |
| Body | p | Geist Sans | 400 | 14px (0.875rem) | 22px | 0 |
| Small / caption | span | Geist Sans | 400 | 12px (0.75rem) | 16px | 0.01em |
| Metric value | span | Geist Mono | 600 | 28px (1.75rem) | 36px | -0.03em |
| Data cell | td | Geist Mono | 400 | 13px (0.8125rem) | 20px | 0 |
| Badge | span | Geist Sans | 500 | 11px (0.6875rem) | 16px | 0.02em |

Use Geist Mono for: session IDs, dates/timestamps, metric numbers, costs, code snippets, durations, answer counts.

---

## Dashboard Home (`/dashboard`)

### Metrics Row

Four `Card` components in a responsive grid: `grid-cols-2 lg:grid-cols-4 gap-4`.

Each metric card:
- **Label** — small caption, `text-muted-foreground`, e.g. "Intakes This Month"
- **Value** — Geist Mono 600, 28px, `text-foreground`
- **Delta** — small, green up-arrow or red down-arrow with percentage vs. last month
- Padding: `p-5`. Border: `1px solid var(--border)`. Background: `var(--card)`.
- Hover: border transitions to `var(--accent)` at 40% opacity, `duration-200`.

Metrics: **Total Intakes** (this month), **Active Forms**, **Completion Rate** (%), **Avg Brief Quality** (1-5 score from provider feedback).

### Recent Intakes Table

shadcn `Table` below the metrics row. Columns:

| Column | Width | Render |
|--------|-------|--------|
| Client | flex-1 | Name (Geist Sans 500) + session ID excerpt in mono below |
| Form | 160px | Form title, truncated |
| Date | 120px | Geist Mono, relative ("2h ago") with full date tooltip |
| Brief Status | 100px | Badge: `completed` (green), `generating` (amber pulse), `failed` (red) |
| Actions | 48px | `DropdownMenu` with: View Brief, Resend Notification |

Row hover: `bg-zinc-800/40`. Clickable rows navigate to `/dashboard/briefs/[sessionId]`. Pagination: 10 rows, `Pagination` component below. Sorting on Date (default desc) and Client columns.

### Quick Actions

Three `Button` components to the right of the page title (or below on mobile): **Create Form** (accent, primary), **View All Briefs** (outline), **Billing** (ghost).

---

## Forms List (`/dashboard/forms`)

**View toggle**: list (default) / grid. Stored in localStorage.

### Grid View

`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`. Each card:
- `Card` with `p-5`, `min-h-[180px]`
- **Title** — h3, truncated to 2 lines
- **Template badge** — e.g. "Therapist", muted outline badge
- **Active/Inactive** — green dot + "Active" or zinc dot + "Inactive"
- **Stats row** — Geist Mono: intake count, last used date
- **Actions** — `DropdownMenu` (three-dot icon top-right): Edit, Preview, Copy Link (copies `/form/[id]` to clipboard with toast), Toggle Active, Delete

Delete triggers `AlertDialog`: "This will deactivate the form and hide it from your list. Existing intakes and briefs are preserved." Confirm button uses `--destructive`.

### List View

shadcn `Table` with columns: Title, Template, Status (badge), Intakes, Last Used, Actions.

### Empty State

Centered container, max-w 400px. Illustration: a minimal line-art form icon (SVG, 120x120, `stroke: var(--muted-foreground)`). Heading: "No forms yet". Body: "Create your first intake form from a template." CTA: `Button` accent, "Create Form", links to form builder.

---

## Brief Viewer (`/dashboard/briefs/[sessionId]`)

**Layout**: two-column on desktop (main content 2/3, sidebar 1/3), single column on mobile (sidebar collapses to a top summary strip).

### Main Content

Rendered via AI Elements `<MessageResponse>` for markdown. Sections appear with **staggered fade-in** (see Motion). Structured sections:

1. **Client Situation Summary** — prose paragraph
2. **Key Flags** — rendered as inline `Badge` components:
   - Risk: `bg-flag-risk/15 text-flag-risk border-flag-risk/30`
   - Complexity: `bg-flag-complexity/15 text-flag-complexity border-flag-complexity/30`
   - Info: `bg-flag-info/15 text-flag-info border-flag-info/30`
   - Each badge has a tooltip with the evidence text from the brief
3. **Questions for First Call** — rendered as a checklist (`Checkbox` + label). Checkable state persisted via Server Action to `briefs.metadata.reviewed_questions`.
4. **Background Context** — prose paragraph

### Action Bar

Sticky top bar within the main content column: **Print** (ghost), **Export PDF** (outline), **Mark as Reviewed** (accent, toggles to "Reviewed" check state). Reviewed state stored in `briefs.metadata.is_reviewed`.

### Sidebar

`Card` with `p-5`, `space-y-4`. Rows of label + value:
- **Date** — Geist Mono, full datetime
- **Form** — link to form editor
- **Duration** — Geist Mono (time from session start to completion)
- **Answers** — Geist Mono count
- **Follow-ups Generated** — Geist Mono count
- **AI Cost** — Geist Mono, e.g. "$0.004" (sum from `generations` table)
- **Brief Status** — Badge

---

## Settings (`/dashboard/settings`)

shadcn `Tabs` with underline variant. Tabs: **Account**, **Billing**, **Notifications**, **Embed**.

### Account Tab
Standard form fields (`Input`, `Select`): Name, Email (read-only from Clerk), Profession dropdown (therapist, coach, consultant, lawyer, financial advisor, other). Save button (accent).

### Billing Tab
Current plan badge ("Starter" or "Professional"). Usage bar: active forms used / limit. `Button` linking to Stripe Customer Portal (`outline` variant). Upgrade CTA if on Starter.

### Notifications Tab
Toggle switches (`Switch` component): "Email me when an intake completes" (default on), "Daily digest summary" (default off). Auto-saves via Server Action on toggle.

### Embed Tab
`Select` to choose a form. Code block (`pre` with Geist Mono, `bg-elevated`, `rounded-lg p-4`) showing the embed snippet. Copy button with clipboard toast. Below: live preview in a bordered iframe (300px height). Style inputs: accent color picker, logo URL input.

---

## Motion

All animations use Framer Motion. Respect `prefers-reduced-motion` by wrapping in a check — if reduced, skip animations entirely.

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transition | `opacity: 0 -> 1`, `y: 8 -> 0` | 200ms | `ease-out` |
| Metric cards (initial) | Staggered fade-in, 50ms between cards | 300ms each | `ease-out` |
| Table rows (load) | `opacity: 0 -> 1`, stagger 30ms | 150ms each | `ease-out` |
| Brief sections | Staggered reveal, 80ms between sections | 350ms each | `[0.25, 0.46, 0.45, 0.94]` (custom) |
| Card hover | `border-color` to accent/40, `translateY: -1px` | 200ms | `ease-out` |
| Badge appear | `scale: 0.9 -> 1`, `opacity: 0 -> 1` | 150ms | `ease-out` |
| Dropdown open | `opacity: 0 -> 1`, `scale: 0.95 -> 1`, transform-origin top | 120ms | `ease-out` |
| Sidebar collapse | `width` tween 240px to 48px | 200ms | `ease-in-out` |

---

## Loading, Empty, and Error States

### Loading (Skeleton)

Every data-dependent surface renders `Skeleton` components matching the layout dimensions:
- Metric cards: 4 skeleton rectangles (h-8 for value, h-3 for label)
- Table: 5 skeleton rows with column-width blocks
- Brief viewer: 3 skeleton paragraphs (h-4 lines) + 4 skeleton badges (h-6 w-16)
- Skeleton color: `var(--border)` with shimmer animation (`bg-gradient-to-r` sweep)

### Error

`Alert` component (destructive variant) with icon (`AlertTriangle`), error message, and a "Try Again" `Button` that calls `router.refresh()`. Positioned where the failed content would render (inline, not modal).

### Empty States

- **Forms list**: described above
- **Briefs list** (no completed intakes): "No briefs yet. Briefs appear here once a client completes an intake form." + link to share a form
- **Dashboard home** (new provider): combined empty — metrics show zeroes (not skeleton), recent intakes replaced with onboarding checklist: "1. Create a form, 2. Share the link, 3. View your first brief"

---

## Data Table Patterns

Reusable across Forms List and Recent Intakes:
- **Sorting**: clickable column headers with `ArrowUpDown` icon. Active sort shows `ArrowUp` or `ArrowDown`.
- **Filtering**: `Input` with search icon for text filter (debounced 300ms). Status filter via `Select` dropdown.
- **Pagination**: `Pagination` component. 10 rows default. Shows "Showing 1-10 of 47".
- **Row actions**: `DropdownMenu` triggered by `MoreHorizontal` icon button (ghost, 32x32).
- **Row hover**: `bg-zinc-800/40` (dark) / `bg-zinc-100` (light). `transition-colors duration-100`.
- **Empty table**: centered `text-muted-foreground` message within the table body, colspan full width.

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (sm) | Single column. Sidebar hidden (Sheet). Metrics 2-col. Tables scroll horizontally. |
| 640-1023px (md) | Single column with wider cards. Sidebar still Sheet. |
| >= 1024px (lg) | Sidebar visible. Metrics 4-col. Brief viewer 2-col. |
| >= 1280px (xl) | Max content width 1200px, centered. Comfortable spacing. |

---

## Accessibility

- All interactive elements have visible focus rings (`ring-2 ring-offset-2 ring-accent`).
- Color is never the sole indicator — flags include text labels alongside color.
- Minimum contrast ratio: 4.5:1 for text, 3:1 for UI components (verified against both themes).
- Sidebar nav uses `role="navigation"` with `aria-label="Main"`.
- Table sorting announces state via `aria-sort`.
- Modals (`AlertDialog`, `Sheet`) trap focus and restore on close.
