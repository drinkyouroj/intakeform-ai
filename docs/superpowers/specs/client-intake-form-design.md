# Client-Facing Intake Form -- Design Specification

**Surface:** `/form/[formId]` (standalone) and `/embed/[formId]` (iframe)
**Theme:** Light mode default, adaptive via `forms.style_config`
**Stack:** shadcn/ui (new-york), Geist Sans/Mono, Framer Motion, Tailwind CSS v4

---

## 1. Layout Structure

The form occupies a single centered column. No sidebar. No multi-panel layout. The entire viewport is dedicated to the form content, creating a focused, distraction-free experience.

```
┌──────────────────────────────────────────────────────┐
│  [Provider Logo]  Provider Name                      │
│  Form Title                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░  5 of 12      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. What brings you in today?                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ I've been feeling overwhelmed at work and...   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│     ┌─ AI follow-up ──────────────────────────────┐  │
│     │ ✦ Can you describe what "overwhelmed"       │  │
│     │   looks like day-to-day for you?            │  │
│     │ ┌────────────────────────────────────────┐  │  │
│     │ │                                        │  │  │
│     │ └────────────────────────────────────────┘  │  │
│     └─────────────────────────────────────────────┘  │
│                                                      │
│  2. Have you seen a therapist before?                │
│  ○ Yes  ○ No  ○ Prefer not to say                   │
│                                                      │
│  3. What are your goals for therapy?                 │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│             [ Back ]          [ Continue → ]          │
│                                                      │
│  ── Secured by IntakeForm.ai ── 🔒 ──               │
└──────────────────────────────────────────────────────┘
```

**Max width:** `max-w-2xl` (42rem / 672px). Centered with `mx-auto`.
**Horizontal padding:** `px-4` mobile, `px-6` tablet+.
**Vertical padding:** `py-6` mobile, `py-10` desktop.

All questions on the current page render as a **scrollable vertical list** -- not one-question-per-screen. Questions are separated by `space-y-8` (2rem). This is a traditional multi-question form, not a wizard.

---

## 2. Typography

All text uses Geist Sans. Geist Mono is reserved for the footer attribution only.

| Element | Weight | Size (mobile) | Size (desktop) | Line height | Color |
|---------|--------|---------------|----------------|-------------|-------|
| Provider name | 500 (medium) | 0.875rem | 0.875rem | 1.25rem | `--muted-foreground` |
| Form title | 600 (semibold) | 1.25rem | 1.5rem | 1.75rem / 2rem | `--foreground` |
| Progress text | 400 (regular) | 0.8125rem | 0.8125rem | 1.25rem | `--muted-foreground` |
| Question label | 500 (medium) | 1rem | 1.0625rem | 1.5rem | `--foreground` |
| Question number | 400 (regular) | 1rem | 1.0625rem | 1.5rem | `--muted-foreground` |
| Helper/description text | 400 (regular) | 0.8125rem | 0.875rem | 1.25rem | `--muted-foreground` |
| Input text (user typing) | 400 (regular) | 1rem | 1rem | 1.5rem | `--foreground` |
| AI follow-up question | 500 (medium) | 0.9375rem | 0.9375rem | 1.375rem | `--foreground` |
| AI follow-up label | 500 (medium) | 0.75rem | 0.75rem | 1rem | `oklch(0.65 0.15 270)` |
| Button text | 500 (medium) | 0.875rem | 0.875rem | 1.25rem | per variant |
| Footer text | 400 (regular) Geist Mono | 0.75rem | 0.75rem | 1rem | `--muted-foreground` |

---

## 3. Color System

Light mode palette using oklch. These map to shadcn/ui CSS custom properties.

```css
/* Backgrounds */
--background: oklch(0.99 0.002 240);       /* #FAFBFC -- page bg */
--card: oklch(1.0 0 0);                    /* #FFFFFF -- input/card surfaces */
--muted: oklch(0.965 0.005 240);           /* #F3F4F6 -- subtle bg, disabled */

/* Borders */
--border: oklch(0.90 0.005 240);           /* #E2E4E8 -- default borders */
--ring: oklch(0.55 0.15 270);              /* focus ring, derived from accent */

/* Text */
--foreground: oklch(0.15 0.01 240);        /* #1A1C20 -- primary text */
--muted-foreground: oklch(0.55 0.01 240);  /* #6B7280 -- secondary text */

/* Accent (interactive elements) */
--primary: oklch(0.45 0.18 270);           /* #4F46E5 -- indigo, buttons & links */
--primary-foreground: oklch(1.0 0 0);      /* #FFFFFF -- text on primary */

/* AI follow-up treatment */
--ai-surface: oklch(0.965 0.025 270);      /* #EEF0FF -- very light indigo bg */
--ai-border: oklch(0.85 0.08 270);         /* #C7CBEF -- soft indigo border */
--ai-accent: oklch(0.55 0.15 270);         /* #6366F1 -- indigo-500 for icon/label */

/* State colors */
--success: oklch(0.60 0.17 145);           /* #16A34A */
--error: oklch(0.55 0.22 25);              /* #DC2626 */
--warning: oklch(0.70 0.17 70);            /* #D97706 */
```

The AI follow-up region uses a distinct surface color (`--ai-surface`) with a left border accent (`--ai-border`) to visually separate it from static questions without being jarring. The indigo tint signals "this is AI-generated" consistently throughout the product.

---

## 4. Component Inventory (shadcn/ui)

| Purpose | Component | Notes |
|---------|-----------|-------|
| Text answers | `Textarea` | Auto-resize, min 3 rows, max 8 rows. `resize-none`. |
| Short text | `Input` | For name, email, single-line fields. |
| Single select | `RadioGroup` + `RadioGroupItem` | Vertical stack, custom styled radio circles. |
| Multi-select | `Checkbox` group | Vertical stack with `Checkbox` items. |
| Dropdown select | `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` | For lists > 5 options. |
| Date input | `Input` with `type="date"` | Native date picker. No calendar popover for MVP. |
| Scale (1-10) | Custom `ToggleGroup` row | Horizontal row of numbered buttons using `Toggle`. |
| Navigation | `Button` | `variant="default"` for Continue, `variant="ghost"` for Back. |
| Progress | Custom `Progress` bar | shadcn `Progress` component with custom height (6px). |
| AI indicator | `Badge` | `variant="secondary"` with indigo tint for "AI follow-up" label. |
| Separator | Not used | Spacing alone separates questions. No horizontal rules. |
| Card wrapper | Not used for questions | Questions sit directly on the page background. The AI follow-up region uses a bordered div, not a `Card`. |

Questions are **not wrapped in cards**. They sit flush on the page background with generous vertical spacing. This avoids visual heaviness and keeps the form feeling open. Only the AI follow-up region gets a bounded container.

---

## 5. AI Follow-Up Injection -- The Signature Interaction

This is the most important interaction in the product. When a client finishes typing an answer and moves focus away (blur) or explicitly submits the answer, the system evaluates whether a follow-up is needed.

### Trigger
- `onBlur` on the `Textarea`/`Input` with a 300ms debounce, OR
- Explicit selection on `RadioGroup`/`Select`/`Checkbox` triggers immediately after value change.
- Minimum answer length of 10 characters for text inputs before triggering evaluation.
- The AI call fires via `POST /api/session/answer`. The response streams back.

### Animation Sequence

**Phase 1 -- Loading (0-2000ms typical):**
A subtle loading indicator appears below the answered question.

```
framer-motion: animate={{ opacity: [0, 1] }}
               transition={{ duration: 0.25, ease: "easeOut" }}
```

The loading state is a single line of text: "Thinking..." in `--ai-accent` color, with a 3-dot pulse animation (opacity cycles at 1.2s intervals). It appears 400ms after the AI call begins -- if the response arrives before 400ms, no loader is shown (prevents flash).

**Phase 2 -- Follow-up slide-in (when AI returns a question):**

The loader is replaced by the follow-up container. The container uses `AnimatePresence` + `motion.div`:

```ts
// Follow-up container entrance
initial:  { opacity: 0, height: 0, y: 8 }
animate:  { opacity: 1, height: "auto", y: 0 }
exit:     { opacity: 0, height: 0, y: -4 }
transition: {
  height:  { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] },
  opacity: { duration: 0.25, delay: 0.1, ease: "easeOut" },
  y:       { duration: 0.25, delay: 0.1, ease: "easeOut" }
}
```

Height animates first (expanding space), then opacity and y fade the content in. This prevents layout jump.

**Phase 3 -- Focus management:**
After the follow-up fully renders (350ms after animation start), focus moves to the new follow-up input via `ref.focus()`. A `aria-live="polite"` region announces: "Follow-up question: [question text]".

### Visual Treatment of Follow-Up

The follow-up container is indented `ml-6` (1.5rem) from the parent question and styled:

```
background: var(--ai-surface)
border-left: 3px solid var(--ai-border)
border-radius: 0.5rem (right corners only -- rounded-r-lg)
padding: 1rem 1.25rem
margin-top: 0.75rem
```

Above the follow-up question text, a small label:
```
✦ Follow-up        (✦ is the Unicode character U+2726, styled in --ai-accent)
```
The sparkle icon distinguishes AI-generated content without being cute. The label uses `text-xs font-medium tracking-wide uppercase` in `--ai-accent`.

---

## 6. Form Header

```
[32x32 provider logo, rounded-md]  Provider Name (text-sm, --muted-foreground)
Form Title (text-xl / text-2xl desktop, font-semibold, --foreground)
Optional: 1-line description (text-sm, --muted-foreground, max 120 chars)
```

Below the title, a full-width progress bar:

```
height: 6px
border-radius: 9999px (full)
track color: var(--muted)
fill color: var(--primary)
transition: width 500ms cubic-bezier(0.25, 0.1, 0.25, 1.0)
```

To the right of the progress bar (or below on mobile): progress text showing `"5 of 12"` format using the `X of Y` pattern (answered questions / total base questions, excluding follow-ups). Follow-up questions do not increment the denominator -- they are bonus depth, not additional length.

---

## 7. Navigation

Two buttons at the bottom of the visible question group, inside a `flex justify-between` container with `pt-6`:

| Button | Variant | Label | Behavior |
|--------|---------|-------|----------|
| Back | `variant="ghost"` size="default" | "Back" with left arrow (Lucide `ChevronLeft`) | Scrolls to previous question group. Disabled on first page. |
| Continue | `variant="default"` size="default" | "Continue" with right arrow (Lucide `ChevronRight`) | Validates visible answers, saves to session, advances. |
| Submit (final page) | `variant="default"` size="lg" | "Submit" (no arrow) | Completes session, triggers brief generation. |

**Keyboard navigation:** `Tab` moves between inputs in DOM order. `Enter` in a single-line `Input` advances to the next question. `Cmd+Enter` / `Ctrl+Enter` in a `Textarea` submits that answer (triggers AI evaluation). No auto-advance -- the client controls pacing.

---

## 8. Completion State

After the client clicks Submit, the form content cross-fades to a completion screen:

```ts
// Page transition
exit:    { opacity: 0, y: -12 }
initial: { opacity: 0, y: 12 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
```

**Completion content (centered, max-w-md):**
- Checkmark icon: Lucide `CircleCheck`, 48px, `--success` color, draws in with a stroke animation over 600ms.
- Heading: "Thank you" -- `text-2xl font-semibold`
- Body: "Your responses have been submitted. [Provider Name] will review them before your appointment." -- `text-base --muted-foreground`, `max-w-sm mx-auto text-center`
- No confetti. No celebration animation. This is a professional context (therapy, legal). Restraint is premium.

---

## 9. Loading & Error States

**Skeleton on initial form load:** The header renders immediately via Server Component. Question content uses a shimmer skeleton: 3 rectangular pulses (`h-4 rounded bg-muted animate-pulse`) stacked with `space-y-3`, inside the max-w-2xl container.

**AI processing indicator:** Described in section 5. The 400ms delay prevents flash for fast responses.

**Network error on answer submission:** A toast notification (shadcn `Sonner`) slides in from the bottom: "Couldn't save your answer. Retrying..." with automatic retry (3 attempts, exponential backoff). If all retries fail: "Something went wrong. Your answers are saved locally." and answers are persisted to `localStorage` alongside the `resume_token`.

**Validation error:** Inline below the input, `text-sm` in `--error` color. Text appears with `animate={{ opacity: 1, y: 0 }}` from `initial={{ opacity: 0, y: -4 }}` over 200ms.

---

## 10. Responsive Behavior

| Breakpoint | Layout changes |
|------------|---------------|
| < 640px (mobile) | `px-4`, `py-6`. Progress text below bar. Scale inputs wrap to 2 rows if needed. AI follow-up `ml-3` instead of `ml-6`. Full-width buttons stacked vertically with `flex-col-reverse gap-3` (Continue on top). |
| 640-1024px (tablet) | `px-6`, `py-8`. Same single column. Progress text inline right of bar. Buttons side-by-side. |
| > 1024px (desktop) | `px-6`, `py-10`. `max-w-2xl mx-auto`. Generous whitespace. No layout changes from tablet. |

In iframe embed mode (`/embed/[formId]`), the header is condensed: logo shrinks to 24x24, form title becomes `text-lg`, and vertical padding reduces by 25% to maximize form content in constrained height.

---

## 11. Accessibility

- **Focus ring:** All interactive elements show a `2px` focus ring in `--ring` color with `2px` offset on `:focus-visible`. Uses Tailwind's `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- **ARIA live region:** A visually hidden `aria-live="polite"` div at the page root. When an AI follow-up injects, the region text updates to: "Follow-up question added: [question text]". Screen readers announce this without interrupting the current focus.
- **Focus after injection:** After the follow-up animation completes, `focus()` is called on the new input. This respects the natural flow -- the client is guided to answer the follow-up before continuing.
- **Color contrast:** All text meets WCAG 2.1 AA. `--foreground` on `--background` = 15.8:1. `--muted-foreground` on `--background` = 5.2:1. `--ai-accent` on `--ai-surface` = 4.7:1.
- **Reduced motion:** All Framer Motion animations wrapped in a `useReducedMotion()` check. When `prefers-reduced-motion: reduce` is active, all transitions become instant (`duration: 0`). Height changes still occur (to prevent layout jump) but without easing.
- **Form labels:** Every input has an associated `<label>` via the question prompt text. Required fields marked with `aria-required="true"` and a visual asterisk.
