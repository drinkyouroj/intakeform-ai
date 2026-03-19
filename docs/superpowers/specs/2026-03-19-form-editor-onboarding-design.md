# IntakeForm.ai — Form Editor & Onboarding Flow Design Specification

## Surface 1: Onboarding Flow

### Step 1 — Profession Selection (`/onboarding/profession`)

**Component:** Six radio cards in a 2x3 responsive grid (single column on mobile). Each card is a shadcn `Card` wrapped in a `RadioGroup` item with the following anatomy:

- 48px Lucide icon (Stethoscope, Target, PenTool, Landmark, Scale, Shapes) in the card's accent color
- Profession name as `text-base font-semibold`
- One-line descriptor in `text-sm text-muted-foreground` (e.g., "Initial client intake & history")
- Selected state: `ring-2 ring-primary bg-primary/5` border with a smooth 200ms Framer `layoutId` highlight that slides between cards

**Header copy:** "What kind of work do you do?" in `text-2xl font-semibold tracking-tight`. Subtitle: "We'll start you with a form template built for your profession." in `text-muted-foreground`.

**CTA:** "Continue" button (shadcn `Button` default variant, full width on mobile, right-aligned on desktop). Disabled until a card is selected; enabled with a subtle `opacity` + `scale` spring transition.

**Transition to Step 2:** Framer `AnimatePresence` exit (fade + slide-left, 250ms ease-out) while Step 2 enters (fade + slide-right, 250ms ease-out). A thin progress bar across the top of the container shows 1/3 filled with `bg-primary`.

### Step 2 — Template Preview (`/onboarding/preview`)

**Layout:** Single centered column, max-w-2xl. The template renders as a read-only question list inside a `Card` with a subtle `shadow-sm` and `border` treatment.

**Question list:** Each question appears as a row:
- Question number in `text-muted-foreground font-mono text-sm` (01, 02, ...)
- Question text in `text-sm`
- Type badge: shadcn `Badge` variant="secondary" showing the question type
- If AI follow-up is enabled, a small sparkle icon (`Sparkles`, 14px, `text-primary`) appears inline

**Header copy:** "Here's your [Profession] intake form" with the profession name styled in `text-primary`. Subtitle: "This is your starting point — you can customize everything later."

**CTA area:** Two buttons side by side:
- Primary: "Activate this form" (`Button` default variant)
- Secondary: "Customize first" (`Button` variant="outline") — links to the form editor

Clicking "Activate this form" triggers a Server Action that creates the form record, sets `is_active = true`, and advances to Step 3.

### Step 3 — First Form Activated (`/onboarding/success`)

**Layout:** Centered column with a success animation — a single Framer `motion.div` that scales from 0.8 to 1.0 with a spring (stiffness: 300, damping: 20) while fading in.

**Share link block:** A prominent `Card` with:
- The form URL in a `font-mono text-sm` `Input` (read-only)
- shadcn `Button` variant="outline" with copy icon (`Copy`). On click, copies to clipboard; icon swaps to `Check` with a 2-second revert.

**Quick tutorial:** Three horizontal steps rendered as a `<ol>` with numbered circles (1, 2, 3) connected by dashed lines:
1. "Share this link with your client" — Link icon
2. "Client fills out the smart form" — FileText icon
3. "You receive a structured brief" — Sparkles icon

Each step: icon in a 36px circle (`bg-muted rounded-full`), label in `text-sm font-medium`, one-line description in `text-xs text-muted-foreground`.

**Actions:** Two buttons:
- "Go to dashboard" (`Button` default variant)
- "Edit this form" (`Button` variant="ghost")

### Onboarding Technical Notes

- All three steps share a single layout wrapper at `/onboarding/layout.tsx` that provides the progress bar, max-width container, and `AnimatePresence` context.
- Step state is URL-driven (each step is its own route segment), not client-side state. Browser back navigates correctly.
- On completion, a `providers.settings` JSONB flag `onboardingComplete: true` is set. Subsequent logins redirect to `/dashboard` instead of `/onboarding`.

---

## Surface 2: Form Editor (`/dashboard/forms/[formId]/edit`)

### Layout Decision: Option B — Split View

**Recommendation: Split view (question list left, detail panel right).** Rationale:

1. The audience edits questions sequentially. A split view keeps the full list visible while editing details, eliminating the "where am I" problem that accordion UIs create when lists grow past 10 items.
2. Accordion-style (Option A) forces excessive vertical scrolling with 12-15 questions. Sheet/modal (Option C) blocks the list and breaks spatial context.
3. The split view mirrors the mental model of "list + inspector" familiar from email clients, Notion databases, and Linear — tools this audience already uses.

**Responsive behavior:** On viewports below 1024px, the layout collapses to a single column with the detail panel appearing as a bottom `Sheet` (shadcn `Sheet` side="bottom", snap to 60% height). The question list remains full-width.

### Question List (Left Panel)

**Container:** `w-[400px]` fixed-width panel with `border-r`, scrollable independently (`overflow-y-auto`).

**Header area:**
- Form title as an inline-editable `h2`. Display mode: `text-lg font-semibold`. Click to edit: swaps to a borderless `Input` that auto-focuses and selects all text. Blur or Enter saves.
- Below the title: form description as inline-editable `text-sm text-muted-foreground` (same click-to-edit pattern, but with a `Textarea` limited to 2 lines).
- Active/inactive toggle: shadcn `Switch` with label, top-right of the header.

**Question rows:** Each question is a sortable item rendered by `@dnd-kit/sortable`. Anatomy of a single row:

```
┌──────────────────────────────────────────────┐
│ ⠿  01  What brings you to therapy today?  📝  │
│      text  ✨                               🗑 │
└──────────────────────────────────────────────┘
```

- **Grip handle** (`GripVertical` icon, `text-muted-foreground`, `cursor-grab`). Visible on hover, always visible on touch.
- **Sort number** in `font-mono text-xs text-muted-foreground`.
- **Question text** truncated to one line (`truncate`). Click selects this question and opens the detail panel.
- **Type badge** (`Badge` variant="secondary", `text-xs`).
- **AI indicator** (`Sparkles` icon, 14px, `text-primary`) — shown only when AI follow-up is enabled.
- **Delete button** (`Trash2` icon, appears on hover, `text-destructive`). Triggers a confirmation via shadcn `AlertDialog`: "Delete this question? This cannot be undone."
- **Selected state:** `bg-accent` background with `border-l-2 border-primary`.

**Drag-and-drop behavior:**
- On drag start: the dragged item elevates with `shadow-lg` and reduces to `opacity-70`. A translucent placeholder with dashed border marks the original position.
- During drag: items animate apart with Framer `layout` transitions (200ms spring) to make room for the dragged item.
- On drop: item settles with a 150ms spring. Sort order updates are auto-saved immediately (no debounce — reorder is an atomic operation).
- **Accessible alternative:** When a question row is focused, `Shift+ArrowUp` / `Shift+ArrowDown` moves it. Screen readers hear "Moved question 3 to position 2."

**Add question:**
- A persistent "Add question" button at the list bottom (`Button` variant="dashed", full width, `Plus` icon).
- On hover between any two questions, a thin horizontal line with a centered `Plus` circle appears (Framer `motion.div`, fade-in 150ms). Clicking inserts a new question at that position.
- New questions are created with defaults: type "text", AI follow-up enabled, empty prompt. The detail panel opens immediately with the prompt field focused.

### Question Detail Panel (Right Panel)

**Container:** Fills remaining width (`flex-1`), scrollable independently. Content is padded with `p-6`.

**Empty state (no question selected):** Centered muted text: "Select a question to edit its details" with a `MousePointerClick` icon.

**Fields when a question is selected:**

1. **Question text** — `Textarea` with label "Question prompt", auto-resizing (min 2 rows, max 6). Placeholder: "e.g., What brings you in today?"

2. **Question type** — shadcn `Select` with label "Answer type". Options: Text (free-form), Single choice, Multiple choice, Date, Scale (1-10). Selecting "Single choice" or "Multiple choice" reveals the options editor below.

3. **Options editor** (conditional, for select/multiselect) — A vertical list of `Input` fields, each with a grip handle for reorder (`@dnd-kit/sortable` nested) and a delete button (`X` icon). An "Add option" button (`Plus` icon, `Button` variant="ghost" size="sm") at the bottom. Minimum 2 options enforced; delete is disabled when only 2 remain.

4. **AI Follow-up section** — Visually separated by a `Separator`. Header: "AI Follow-up" with `Sparkles` icon.
   - **Toggle:** shadcn `Switch` labeled "Enable AI follow-up for this question". When off, the section below collapses with Framer `AnimatePresence` (height 0, opacity 0, 200ms).
   - **Max follow-ups:** shadcn `Select`, options "1" and "2", default "2". Label: "Maximum follow-up questions".
   - **Custom prompt hint:** `Textarea` (optional, 2 rows). Label: "Guidance for AI". Placeholder: "e.g., Ask about duration and severity". Helper text below in `text-xs text-muted-foreground`: "Give the AI direction on what to probe deeper on. Leave blank for automatic follow-up."

   **Visual treatment when enabled:** The entire AI section has a left border of `border-l-2 border-primary/30` and a faint `bg-primary/[0.02]` background to subtly distinguish it from static fields.

### Preview Mode

**Toggle:** A `Button` variant="outline" with `Eye` icon in the editor toolbar (top bar, right-aligned). Label toggles between "Preview" and "Edit".

**Behavior:** Clicking "Preview" replaces the split-view editor with a full-width, centered preview (`max-w-2xl mx-auto`) that renders the form exactly as the client sees it — the same component used at `/form/[formId]` but in a read-only, non-submittable mode. AI follow-up questions are not simulated; a subtle `Badge` on questions with AI enabled reads "AI follow-up active".

**Return:** The "Edit" button in the same toolbar position returns to the split-view editor. Transition: crossfade via `AnimatePresence` (200ms).

### Form Settings Panel

Accessible via a `Settings` icon button in the editor toolbar, opening a shadcn `Sheet` from the right (`side="right"`, `w-[400px]`).

**Contents:**
- **Form title** — `Input` (mirrors the inline-editable title in the list header; changes sync bidirectionally).
- **Description** — `Textarea`, 3 rows.
- **Active toggle** — `Switch` with status label ("Active" in green, "Inactive" in muted).
- **Share link** — Read-only `Input` with `Copy` button. Same clipboard interaction as onboarding.
- **Embed code** — `Textarea` (read-only, `font-mono text-xs`) with the `<script>` snippet. Copy button. Labeled "Week 3" with a muted badge if not yet available.
- **Style section** (collapsible):
  - Accent color picker: six preset swatches (zinc, blue, violet, emerald, amber, rose) rendered as colored circles, plus a custom hex `Input`. Selected swatch gets a `ring-2 ring-offset-2` treatment.
  - Logo upload: `Button` variant="outline" triggering a file input. Shows a thumbnail preview once uploaded. Max 500KB, PNG/SVG only.

### Auto-Save Strategy

**Approach: Debounced auto-save (800ms) with explicit visual feedback.**

- Every field change (text input, select change, toggle flip, reorder) starts an 800ms debounce timer. If no further changes occur within 800ms, a Server Action fires to persist the current form state.
- **Reorder and delete are immediate** (no debounce) — these are discrete, high-intent actions.
- **Save indicator** in the top toolbar, right side:
  - Idle (saved): `Check` icon + "Saved" in `text-xs text-muted-foreground`. Fades in after successful save.
  - Saving: `Loader2` icon (spinning) + "Saving..." in `text-xs text-muted-foreground`.
  - Unsaved: `Circle` icon (filled, `text-amber-500`) + "Unsaved changes" — appears immediately on edit, before debounce fires.
  - Error: `AlertCircle` icon (`text-destructive`) + "Save failed — retrying..." with automatic retry (exponential backoff, max 3 attempts). On persistent failure, a toast notification appears with a manual "Retry" button.
- **Navigation guard:** If the user attempts to leave the editor with unsaved changes, an `AlertDialog` warns: "You have unsaved changes. Leave anyway?"

### Editor Toolbar

A sticky top bar (`sticky top-0 z-10 bg-background/80 backdrop-blur border-b`) with:

- Left: Back arrow to `/dashboard/forms` + form title (read-only here, editable in the list panel)
- Center: Save status indicator
- Right: Preview toggle, Settings gear, and a "View live form" external link button (`ExternalLink` icon)

### Inline Editing Pattern

All inline-editable text (form title, description, question prompts) follows a consistent interaction:

1. **Display mode:** Text renders as a styled `span` or `p` with a subtle `hover:bg-accent/50` background on hover, signaling editability. Cursor changes to `cursor-text`.
2. **Edit mode:** On click, the element swaps to an `Input` or `Textarea` (matching the dimensions of the display element) that auto-focuses with all text selected. A thin `ring-1 ring-primary` border appears.
3. **Commit:** Blur or Enter (for single-line) commits the change and triggers the debounced auto-save. Escape reverts to the previous value.
4. **Empty state:** If the field is empty, display mode shows placeholder text in `text-muted-foreground italic`.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+S` | Force immediate save (bypasses debounce) |
| `Cmd+P` | Toggle preview mode |
| `Escape` | Deselect current question / close settings sheet |
| `ArrowUp/Down` | Navigate question list when list is focused |
| `Shift+ArrowUp/Down` | Reorder selected question |
| `Cmd+Shift+N` | Add new question at end of list |

### Accessibility Notes

- All interactive elements have visible focus rings (`focus-visible:ring-2`).
- Drag-and-drop has keyboard alternatives (shift+arrow reorder with live region announcements).
- Color is never the sole indicator of state (icons and text labels accompany all status colors).
- The AI follow-up toggle has an accessible description via `aria-describedby` linking to helper text that explains what AI follow-up does.
- Preview mode is keyboard-navigable; tab order follows question order.
