# Design Spec Review Errata — All Issues & Resolutions

> Generated 2026-03-19 from parallel review of all 4 design specs.
> This document is the authoritative patch list. All issues below are resolved.

## Cross-Cutting Resolution: Token Canonicalization

**The motion/theme spec (`2026-03-19-motion-theme-spec.md`) is the SINGLE SOURCE OF TRUTH for all design tokens.** Surface specs (intake form, dashboard, editor) must reference token names from the theme spec — they do not define their own color values.

Any oklch values in surface specs that conflict with the theme spec are **superseded**. During implementation, import tokens from a single `globals.css` file derived from the theme spec.

---

## Critical Issues (10 total, all resolved)

### C1. Color token divergence across all surface specs
**Specs affected:** Intake form, dashboard, motion/theme
**Resolution:** Surface specs are updated to reference theme spec token names only. All inline oklch definitions in surface specs are removed and replaced with token references. The theme spec adds missing tokens (see C3, M5, M6).

### C2. Token naming: `--foreground-muted` vs `--muted-foreground`
**Spec:** Motion/theme
**Resolution:** Rename to match shadcn/ui convention: `--muted-foreground`, `--subtle-foreground`. The motion/theme spec is updated.

### C3. Missing `--destructive` and `--destructive-foreground` tokens
**Spec:** Motion/theme
**Resolution:** Added to both theme definitions. Values alias `--error` tokens:
- Dark: `--destructive: oklch(0.550 0.200 25)`, `--destructive-foreground: oklch(0.985 0 0)`
- Light: `--destructive: oklch(0.500 0.200 25)`, `--destructive-foreground: oklch(0.985 0 0)`

### C4. Intake form pagination/question grouping undefined
**Spec:** Intake form
**Resolution:** All questions on a single scrollable page (no pagination). Progress shows "5 of 12" based on answered count vs total questions. The Back/Continue buttons scroll to previous/next unanswered question, not paginate. This matches the "traditional form" aesthetic the user chose. The `questions` table does not need a `page` column.

### C5. Session resume and browser back button unaddressed
**Spec:** Intake form
**Resolution:** Added to spec:
- On return with valid `resume_token` in localStorage: form loads with all previous answers pre-filled, scrolled to first unanswered question. A subtle "Welcome back" toast appears (Sonner, 3s auto-dismiss).
- Browser history: use `replaceState` for scroll positions — back button exits the form entirely (no history trap).
- Concurrent tabs: optimistic concurrency on the session `version` column handles data conflicts. UI shows "Session updated elsewhere — refreshing..." toast if version mismatch detected on answer submission.

### C6. Onboarding partial failure (Clerk succeeds, DB write fails)
**Spec:** Editor/onboarding
**Resolution:** Added to spec:
- Step 2's Server Action creates form + sets `onboardingComplete` in a single DB transaction.
- On failure: inline Alert with retry button, user stays on Step 2.
- Dashboard route guard: check `providers` record exists AND `onboardingComplete: true`. Missing record → redirect to `/onboarding/profession`. Record exists but incomplete → redirect to appropriate step.
- Profession is written to `providers.profession` immediately on Step 1 Continue (survives refresh).

### C7. Form editor: no concurrent tab conflict resolution
**Spec:** Editor/onboarding
**Resolution:** Added `updated_at` check to form auto-save Server Action. On conflict (another tab saved more recently): toast "This form was updated in another tab. Reload to see latest." with Reload button. Save is rejected — no silent overwrite.

### C8. Form editor: no offline resilience / network failure queuing
**Spec:** Editor/onboarding
**Resolution:** Added to spec:
- During retries, debounce timer coalesces new edits — only latest state is sent.
- On persistent failure (3 retries exhausted): "Unsaved changes" indicator persists, navigation guard blocks departure.
- No localStorage offline queue for MVP — navigation guard is sufficient.
- When connectivity resumes, next edit triggers normal save cycle.

### C9. Dashboard: subscription states completely absent
**Spec:** Dashboard
**Resolution:** Added "Subscription States" section:
- `trialing`: Yellow banner "Trial ends in X days" at top of dashboard. Full functionality.
- `active`: No banner. Full functionality.
- `past_due`: Red banner "Payment failed — update billing to continue." Forms remain active, briefs still generate, but new form creation is disabled. CTA links to Stripe portal.
- `canceled`: Orange banner "Subscription canceled. Your forms are inactive." All forms auto-deactivated. Dashboard is read-only (can view existing briefs). CTA to resubscribe.

### C10. Dashboard: briefs list page missing
**Spec:** Dashboard
**Resolution:** Added `/dashboard/briefs` index route spec:
- Table columns: Client name, Form title, Date, Brief status (badge), Duration, Actions (view)
- Sorting: by date (default desc), by form, by status
- Filtering: by form (Select), by date range (DatePicker), by status
- Pagination: 20 per page, same pattern as intakes table
- Empty state: "No briefs yet. Completed intakes will appear here."
- Empty search: "No results for [query]. Clear filters" with ghost button.

---

## Medium Issues (24 total, all resolved)

### Intake Form (6 medium)
- **I1. Color tokens → canonical reference:** Resolved by C1.
- **I2. Animation values diverge from motion spec:** Inline animation code removed from surface spec. References motion spec variants by name (`followUpReveal`, `thinkingDot`, `followUpConnector`).
- **I3. AI follow-up on last question:** Submit button remains visible during follow-up generation. Follow-up answers on final question are optional. Submitting while follow-up loads cancels the pending AI request.
- **I4. Scale input mobile behavior:** On viewports <640px, scale renders as two rows of 5 (1-5, 6-10) with gap-2. Each button is 44x44px min. Selected: `--primary` bg. Unselected: `--muted` bg.
- **I5. Textarea overflow for long answers:** When content exceeds 8 rows, textarea scrolls internally (`overflow-y: auto`). Subtle gradient fade (4px) at bottom indicates scrollable content.
- **I6. Validation rules:** All questions required by default (provider can mark optional in editor). Validation fires on Continue click. Standard messages. AI follow-ups are always optional/skippable.

### Dashboard (4 medium)
- **D1. Brief viewer edge cases:** Empty sections show "None identified" in muted text. Full content renders (no truncation). Flags wrap naturally. Checklist has no UI cap (AI prompt limits to 5 questions).
- **D2. Mobile Sheet sidebar:** Hamburger icon top-left, sticky. Sheet slides from LEFT (not right). Backdrop at `oklch(0 0 0 / 0.5)`. Auto-closes on route change. Swipe-to-dismiss supported.
- **D3. Stagger animation performance:** Stagger applies only to current visible page (max 10-20 items). Grid caps stagger at first 9 cards; additional cards appear immediately.
- **D4. Empty search results:** "No results for [query]" in muted-foreground + "Clear filters" ghost button.

### Editor/Onboarding (8 medium)
- **E1. Mid-onboarding refresh:** Profession written to DB on Step 1 Continue. URL-driven steps. Refresh on Step 2 re-fetches profession from DB.
- **E2. Single-question edge:** Grip handle hidden when only 1 question. Empty list shows "No questions yet" + prominent Add button.
- **E3. Touch drag:** 200ms press-hold activation via dnd-kit TouchSensor. `touch-action: none` on grip handle only.
- **E4. Character limits:** Form title: 100. Description: 300. Question prompt: 500. AI guidance hint: 200. Counter appears at 80% of max.
- **E5. Empty question validation:** Empty prompt shows red warning indicator. Form cannot be activated with empty questions. Toggle shows tooltip explaining why disabled.
- **E6. Delete last question:** Allowed. Shows empty state. If form was active, auto-deactivates with toast.
- **E7. Form deletion location:** Not available in editor. Only from dashboard forms list via AlertDialog. Active sessions preserved (soft delete).
- **E8. AI toggle preservation:** Toggling off preserves config in data model (`enabled: false`, other fields retained). Toggling on restores previous settings.

### Motion/Theme (6 medium)
- **T1. WCAG contrast for `--subtle-foreground`:** Explicitly noted as WCAG-exempt (disabled controls, decorative only). Added `--input-placeholder` token at higher lightness for form placeholders.
- **T2. Dashboard tokens not in theme spec:** Added "Dashboard Extensions" section: `--flag-risk`, `--flag-complexity`, `--flag-info`. `--accent` maps to `--primary`. `--elevated` maps to `--card-elevated`.
- **T3. Missing AI surface/border tokens:** Added `--ai-surface` and `--ai-border` to both theme definitions.
- **T4. confettiParticle Math.random():** Replaced with deterministic golden-angle distribution: `rotate: ((i * 137.5) % 360)`.
- **T5. useReducedMotion custom hook:** Removed. Use Framer Motion's built-in `useReducedMotion()` exclusively.
- **T6. Theme transition:** Added 200ms crossfade on `background-color`, `color`, `border-color` on `html` element during theme switch.

---

## Low Issues (23 total — addressed during implementation)

These are documented here for implementer reference but do not block planning:

**Intake form:** Empty 0-questions state, rapid submission focus preservation, embed postMessage height sync, progress bar ARIA semantics, dark mode AI tokens for embed, "Thinking..." text vs dots consistency.

**Dashboard:** Remove "Avg Brief Quality" metric (replace with "AI Cost This Month" which is derivable from `generations` table), embed tab empty form state, nav-to-route active mapping, brief sidebar skeleton, reconcile token naming between dashboard and theme spec.

**Editor/onboarding:** Preview mode interactivity clarification (inputs work, submit disabled), scroll position restore on preview exit, mobile Sheet swipe/handle details, platform-aware keyboard shortcuts (Cmd→Ctrl), nested options drag visual spec.

**Motion/theme:** Add `--text-metric` and `--text-label` typography tokens, bouncy spring usage constraint note, confetti particle count limit (12 max, 6 on low-end), extract easing arrays to named constants, standardize dashboard one-off easing, add scrollbar tokens, add `--selection` highlight token.
