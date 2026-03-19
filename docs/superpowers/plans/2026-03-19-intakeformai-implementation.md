# IntakeForm.ai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build IntakeForm.ai — an AI-powered intake form platform where providers create forms, clients fill them out with real-time AI follow-up questions, and providers receive structured pre-read briefs.

**Architecture:** Next.js 16 App Router monolith on Vercel. AI SDK v6 + AI Gateway for LLM calls. Neon Postgres + Drizzle ORM. Clerk auth. Stripe billing. shadcn/ui + Geist + Framer Motion for UI.

**Tech Stack:** Next.js 16, TypeScript, Vercel AI SDK v6, Drizzle ORM, Neon Postgres, Clerk, Stripe, shadcn/ui, Framer Motion, Vitest, pnpm

**Specs:** All design specs in `docs/superpowers/specs/`. Errata in `2026-03-19-design-review-errata.md`. CLAUDE.md has the full operating instructions.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout: Clerk, themes, Analytics, SpeedInsights
│   ├── globals.css                         # Theme tokens from motion/theme spec
│   ├── page.tsx                            # Landing/marketing page (minimal for MVP)
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── onboarding/
│   │   ├── layout.tsx                      # Onboarding layout: progress bar, max-width, AnimatePresence
│   │   ├── profession/page.tsx             # Step 1: profession selection
│   │   ├── preview/page.tsx                # Step 2: template preview
│   │   └── success/page.tsx                # Step 3: success + share link
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Sidebar nav, auth guard
│   │   ├── dashboard/page.tsx              # Dashboard home: metrics + recent intakes
│   │   ├── dashboard/forms/page.tsx        # Forms list
│   │   ├── dashboard/forms/[formId]/
│   │   │   └── edit/page.tsx               # Form editor (split view)
│   │   ├── dashboard/briefs/page.tsx       # Briefs list
│   │   ├── dashboard/briefs/[sessionId]/page.tsx  # Brief viewer
│   │   └── dashboard/settings/page.tsx     # Settings (tabs)
│   ├── form/[formId]/page.tsx              # Standalone intake form (public)
│   ├── embed/[formId]/page.tsx             # Embeddable intake form (iframe)
│   └── api/
│       ├── session/
│       │   ├── start/route.ts              # POST: create session
│       │   ├── answer/route.ts             # POST: submit answer, get follow-up
│       │   └── resume/route.ts             # GET: resume session by token
│       ├── billing/
│       │   └── webhook/route.ts            # POST: Stripe webhook handler
│       └── embed.js/route.ts               # GET: embed script loader
├── components/
│   ├── ui/                                 # shadcn/ui primitives
│   ├── ai-elements/                        # AI Elements (installed via npx)
│   ├── intake/
│   │   ├── intake-form.tsx                 # Main intake form orchestrator
│   │   ├── question-display.tsx            # Single question renderer
│   │   ├── follow-up-region.tsx            # AI follow-up injection region
│   │   ├── progress-bar.tsx                # "5 of 12" progress
│   │   └── completion-screen.tsx           # Thank you screen
│   ├── dashboard/
│   │   ├── sidebar-nav.tsx                 # Collapsible sidebar
│   │   ├── metrics-row.tsx                 # 4-card metrics
│   │   ├── intakes-table.tsx               # Recent intakes data table
│   │   ├── forms-list.tsx                  # Forms grid/list
│   │   ├── brief-viewer.tsx                # Brief content + flags + checklist
│   │   ├── brief-sidebar.tsx               # Brief metadata panel
│   │   └── subscription-banner.tsx         # Trial/past-due/canceled banners
│   ├── editor/
│   │   ├── form-editor.tsx                 # Split-view editor orchestrator
│   │   ├── question-list.tsx               # Left panel: sortable question list
│   │   ├── question-detail.tsx             # Right panel: question config
│   │   ├── inline-edit.tsx                 # Click-to-edit text component
│   │   ├── ai-config-panel.tsx             # AI follow-up toggle + settings
│   │   └── form-settings-sheet.tsx         # Right Sheet: title, share, embed
│   └── onboarding/
│       ├── profession-cards.tsx            # 6 radio cards with icons
│       ├── template-preview.tsx            # Read-only template preview
│       └── activation-success.tsx          # Share link + tutorial strip
├── lib/
│   ├── ai/
│   │   ├── config.ts                       # AI_MODELS env-driven config
│   │   ├── follow-up.ts                    # streamText for follow-up decisions
│   │   ├── brief.ts                        # generateText + Output.object() for briefs
│   │   ├── flags.ts                        # Flag detection via generateText
│   │   ├── prompts/
│   │   │   ├── follow-up.ts               # Follow-up decision prompt template
│   │   │   ├── brief.ts                   # Brief synthesis prompt template
│   │   │   └── flags.ts                   # Flag detection prompt template
│   │   └── eval/
│   │       ├── runner.ts                  # Model eval runner
│   │       ├── fixtures.ts               # 20+ test scenarios
│   │       └── report.ts                 # Comparison report generator
│   ├── db/
│   │   ├── index.ts                       # Lazy-initialized Drizzle client
│   │   ├── schema.ts                      # Full Drizzle schema
│   │   └── seed.ts                        # 5 starter templates
│   ├── actions/
│   │   ├── forms.ts                       # Form CRUD Server Actions
│   │   ├── sessions.ts                    # Session lifecycle Server Actions
│   │   ├── briefs.ts                      # Brief actions (mark reviewed, etc.)
│   │   ├── onboarding.ts                  # Onboarding Server Actions
│   │   └── providers.ts                   # Provider profile actions
│   ├── motion.ts                          # Framer Motion variants (from theme spec)
│   └── utils.ts                           # cn(), nanoid, helpers
├── proxy.ts                               # Clerk middleware (Next.js 16 proxy)
└── instrumentation.ts                     # Monitoring initialization
```

---

## Phase 0: Project Scaffold + Git + CI

### Task 0.1: Initialize Next.js 16 + Git

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/justin/CascadeProjects/intakeform-ai
git init
```

- [ ] **Step 2: Create .gitignore**

```bash
# Add standard Next.js + env gitignore
```

Contents: `node_modules/`, `.next/`, `.env*.local`, `.vercel/`, `*.tsbuildinfo`

- [ ] **Step 3: Scaffold Next.js 16**

```bash
npx create-next-app@latest . --yes --force --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm
```

`--force` because directory has existing files (CLAUDE.md, docs/).

- [ ] **Step 4: Verify scaffold works**

```bash
pnpm dev
# Visit http://localhost:3000 — verify default Next.js page loads
# Ctrl+C to stop
```

- [ ] **Step 5: Create .env.example**

```bash
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI Gateway (auto-provisioned via vercel env pull)
AI_MODEL_FOLLOWUP=groq/llama-3.3-70b-versatile
AI_MODEL_BRIEF=groq/llama-3.3-70b-versatile
AI_MODEL_FLAGS=groq/llama-3.3-70b-versatile

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Commit scaffold**

```bash
git checkout -b feat/project-scaffold
git add -A
git commit -m "chore: scaffold Next.js 16 with TypeScript, Tailwind, ESLint"
```

### Task 0.2: Initialize shadcn/ui + Geist Font Fix

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/lib/utils.ts`, `src/components/ui/` (via shadcn CLI)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 2: Add baseline primitives**

```bash
npx shadcn@latest add button card input label textarea select switch tabs dialog alert-dialog sheet dropdown-menu badge separator skeleton table scroll-area tooltip avatar progress radio-group toggle-group sonner
```

- [ ] **Step 3: Apply Geist font fix in globals.css**

In `src/app/globals.css`, inside `@theme inline`, replace font declarations:

```css
--font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
--font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
```

- [ ] **Step 4: Move font classNames to html in layout.tsx**

```tsx
// src/app/layout.tsx
<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
  <body className="antialiased">
```

- [ ] **Step 5: Install next-themes for adaptive theme**

```bash
pnpm add next-themes
```

Add `ThemeProvider` wrapping children in layout.tsx with `attribute="class"` and `defaultTheme="dark"`.

- [ ] **Step 6: Install Framer Motion**

```bash
pnpm add framer-motion
```

- [ ] **Step 7: Verify — dev server loads with shadcn button**

Add a `<Button>` to the home page, verify it renders with correct styling.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add shadcn/ui, Geist font fix, next-themes, Framer Motion"
```

### Task 0.3: Vercel Link + AI Gateway + Integrations

**Files:**
- Create: `.vercel/project.json` (via CLI)

- [ ] **Step 1: Link to Vercel project**

```bash
vercel link
```

- [ ] **Step 2: Enable AI Gateway**

Go to `https://vercel.com/{team}/{project}/settings` → AI Gateway → Enable.

- [ ] **Step 3: Pull environment variables**

```bash
vercel env pull .env.local
```

- [ ] **Step 4: Install Neon via Marketplace**

```bash
vercel integration add neon
```

- [ ] **Step 5: Pull updated env (now includes DATABASE_URL)**

```bash
vercel env pull .env.local --yes
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: link Vercel project, configure AI Gateway and Neon"
```

### Task 0.4: Drizzle ORM Setup

**Files:**
- Create: `drizzle.config.ts`, `src/lib/db/index.ts`, `src/lib/db/schema.ts`

- [ ] **Step 1: Install Drizzle + Neon driver**

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit dotenv-cli
```

- [ ] **Step 2: Create drizzle.config.ts**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 3: Create lazy DB client (src/lib/db/index.ts)**

```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) _db = drizzle(neon(process.env.DATABASE_URL!), { schema })
  return _db
}
```

- [ ] **Step 4: Create schema (src/lib/db/schema.ts)**

Full schema from design spec Section 4: providers, forms, questions, sessions, briefs, generations tables with all enums, JSONB columns, version column on sessions, brief_status, resume_token, updated_at.

- [ ] **Step 5: Push schema to Neon (dev mode)**

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
```

- [ ] **Step 6: Verify schema in Neon dashboard**

Check tables exist at Neon console.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): add Drizzle schema with all tables, push to Neon"
```

### Task 0.5: Clerk Auth + Proxy

**Files:**
- Create: `src/proxy.ts`, `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install Clerk**

```bash
pnpm add @clerk/nextjs
```

- [ ] **Step 2: Add Clerk env vars**

Either via `vercel integration add clerk` or manually add `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vercel env, then `vercel env pull .env.local --yes`.

Also add to `.env.local`:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

- [ ] **Step 3: Create proxy.ts (src/proxy.ts)**

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
```

- [ ] **Step 4: Wrap layout with ClerkProvider**

Add `<ClerkProvider>` in `src/app/layout.tsx` wrapping children inside `<body>`.

- [ ] **Step 5: Create sign-in and sign-up pages**

Standard Clerk `<SignIn />` and `<SignUp />` components in catch-all route segments.

- [ ] **Step 6: Verify auth flow — sign up, sign in, protected route redirects**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): add Clerk integration with proxy, sign-in/sign-up pages"
```

### Task 0.6: CI Pipeline + PR Template

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/pull_request_template.md`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test --run
      - run: pnpm build
```

- [ ] **Step 2: Create PR template**

As defined in design spec Section 9.

- [ ] **Step 3: Install Vitest + common dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react
pnpm add nanoid zod
```

Create `vitest.config.ts` with Next.js path aliases.

- [ ] **Step 4: Set up release-please**

Install `release-please-action` in `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
```

This automates version bumps, CHANGELOG.md updates, and GitHub Releases on merge to main.

- [ ] **Step 5: Add npm scripts to package.json**

```json
"scripts": {
  "type-check": "tsc --noEmit",
  "test": "vitest"
}
```

- [ ] **Step 5: Create a trivial passing test**

```ts
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'

describe('utils', () => {
  it('exists', () => {
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 6: Run full CI locally**

```bash
pnpm lint && pnpm type-check && pnpm test --run && pnpm build
```

- [ ] **Step 7: Commit, create PR, merge to main**

```bash
git add -A
git commit -m "chore(ci): add GitHub Actions CI pipeline, Vitest, PR template"
```

Push branch, create PR against main, merge. This establishes the PR-only workflow.

- [ ] **Step 8: Tag v0.1.0-alpha.1**

```bash
git checkout main
git pull
git tag -a v0.1.0-alpha.1 -m "chore: project scaffold with Next.js 16, shadcn, Clerk, Drizzle, CI"
git push origin v0.1.0-alpha.1
```

---

## Phase 1: Data Layer + Provider Onboarding

### Task 1.1: Seed Data — 5 Starter Templates

**Files:**
- Create: `src/lib/db/seed.ts`, `src/lib/db/templates/` (5 template JSON files)

- [ ] **Step 1: Write test for seed script**

```ts
// src/lib/db/__tests__/seed.test.ts
import { describe, it, expect } from 'vitest'
import { TEMPLATES } from '../templates'

describe('seed templates', () => {
  it('has 5 templates', () => { expect(TEMPLATES).toHaveLength(5) })
  it('each template has 8-15 questions', () => {
    TEMPLATES.forEach(t => {
      expect(t.questions.length).toBeGreaterThanOrEqual(8)
      expect(t.questions.length).toBeLessThanOrEqual(15)
    })
  })
  it('each question has ai_follow_up config', () => {
    TEMPLATES.forEach(t => t.questions.forEach(q => {
      expect(q.aiFollowUp).toBeDefined()
      expect(q.aiFollowUp.enabled).toBeDefined()
    }))
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

- [ ] **Step 3: Create 5 template definitions**

Create `src/lib/db/templates/index.ts` exporting `TEMPLATES` array with:
1. Therapist Initial Intake (12 questions)
2. Business Coach Discovery (10 questions)
3. Freelance Consultant Scope (10 questions)
4. Financial Advisor First Meeting (11 questions)
5. Attorney Client Intake (12 questions)

Each question: `{ prompt, type, sortOrder, aiFollowUp: { enabled, maxFollowUps, systemPrompt? } }`

- [ ] **Step 4: Run test — verify it passes**

- [ ] **Step 5: Create seed script**

`src/lib/db/seed.ts` that inserts template forms and questions for a given provider ID.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(db): add 5 starter templates with seed script"
```

### Task 1.2: Provider Onboarding Flow

**Files:**
- Create: `src/app/onboarding/layout.tsx`, `src/app/onboarding/profession/page.tsx`, `src/app/onboarding/preview/page.tsx`, `src/app/onboarding/success/page.tsx`, `src/lib/actions/onboarding.ts`, `src/lib/actions/providers.ts`, `src/components/onboarding/profession-cards.tsx`, `src/components/onboarding/template-preview.tsx`, `src/components/onboarding/activation-success.tsx`

- [ ] **Step 1: Create provider Server Actions**

`src/lib/actions/providers.ts`:
- `createProvider(clerkUserId, email, name)` — inserts into providers table
- `getProvider(clerkUserId)` — fetches provider record
- `updateProvider(id, data)` — updates provider fields

- [ ] **Step 2: Create onboarding Server Actions**

`src/lib/actions/onboarding.ts`:
- `selectProfession(profession: string)` — writes to `providers.profession` immediately (survives refresh), redirects to `/onboarding/preview`
- `activateForm(formId: string)` — sets form `is_active = true` AND sets `onboardingComplete` in settings in a **single DB transaction**. On failure: returns error (no redirect). Redirects to `/onboarding/success` on success.

- [ ] **Step 3: Create onboarding layout**

`src/app/onboarding/layout.tsx`: progress indicator (3 steps), `max-w-2xl` centered container, `AnimatePresence` for step transitions.

- [ ] **Step 4: Create profession selection page**

6 radio cards (Lucide icons) in a 2x3 grid. On selection + Continue → calls `selectProfession` Server Action.

- [ ] **Step 5: Create template preview page**

Reads `providers.profession`, shows matching template questions in read-only list. Two CTAs: "Activate this form" (primary) and "Customize first" (outline → editor).

- [ ] **Step 6: Create success page** (`/onboarding/success`)

Copy-to-clipboard share link, 3-step tutorial strip, "Go to Dashboard" + "Edit Form" buttons.

- [ ] **Step 7: Add onboarding guard to dashboard layout**

In `(dashboard)/layout.tsx`: check `providers` record exists + `onboardingComplete`. Missing record → redirect to `/onboarding/profession`. Record exists but incomplete → redirect to appropriate step.

- [ ] **Step 8: Test full flow manually**

Sign up → profession → preview → activate → success → dashboard. Also test: refresh mid-onboarding, back button, failed transaction retry.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(onboarding): add 3-step provider onboarding with profession selection and template activation"
```

- [ ] **Step 10: Tag v0.1.0-alpha.2, create PR, merge**

---

## Phase 2: Form Editor

### Task 2.1: Form Editor — Split View Layout

**Files:**
- Create: `src/lib/actions/forms.ts`, `src/app/(dashboard)/dashboard/forms/[formId]/edit/page.tsx`, `src/components/editor/form-editor.tsx`, `src/components/editor/question-list.tsx`, `src/components/editor/question-detail.tsx`

- [ ] **Step 1: Install dnd-kit**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Create form CRUD Server Actions**

`src/lib/actions/forms.ts` — the backbone of the editor:
- `getForm(formId)` — fetch form + questions (ordered by sort_order)
- `updateForm(formId, data)` — update title, description, is_active, style_config. Includes `updated_at` check for concurrent tab conflict detection.
- `updateQuestion(questionId, data)` — update prompt, type, options, ai_follow_up
- `reorderQuestions(formId, orderedIds)` — bulk update sort_order
- `addQuestion(formId, data)` — insert with next sort_order
- `deleteQuestion(questionId)` — delete + auto-deactivate form if last question removed
- `toggleFormActive(formId, active)` — validates all questions have non-empty prompts before activating

- [ ] **Step 3: Create form editor page (Server Component)**

Fetches form + questions from DB. Passes to client `<FormEditor>`.

- [ ] **Step 3: Create FormEditor orchestrator (Client Component)**

Split view: 400px left panel (QuestionList) + flex-1 right panel (QuestionDetail). State: `selectedQuestionId`.

- [ ] **Step 4: Create QuestionList with drag-and-drop reorder**

`@dnd-kit/sortable` with `SortableContext`. Each row: grip handle, truncated prompt, type Badge, AI sparkle indicator, hover-reveal delete button. On reorder → Server Action to update `sort_order`.

- [ ] **Step 5: Create QuestionDetail panel**

Textarea for prompt (inline edit), Select for question type, conditional options editor, AI config toggle + settings. All changes → debounced auto-save (800ms) via Server Action.

- [ ] **Step 6: Create auto-save with visual indicator**

Three states: Saved (check icon), Saving... (spinner), Unsaved (dot). Debounced at 800ms. On save failure: exponential backoff (max 3), then toast with retry.

- [ ] **Step 7: Add add/remove question functionality**

Add button (bottom + between items). Delete with AlertDialog confirmation. Handle last-question deletion (empty state + auto-deactivate).

- [ ] **Step 8: Create form settings Sheet**

Right Sheet with: title, description, active toggle, share link + copy, embed code (placeholder for Phase 5).

- [ ] **Step 9: Test manually — edit questions, reorder, toggle AI, auto-save**

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(form-builder): add split-view form editor with drag reorder, inline editing, auto-save"
```

### Task 2.2: Form Preview Mode

**Files:**
- Modify: `src/components/editor/form-editor.tsx`
- Reuse: intake form components (created in Phase 3, stub for now)

- [ ] **Step 1: Add preview toggle button to editor toolbar**

- [ ] **Step 2: Preview renders static question list (full intake form component added in Phase 3)**

For now: renders a read-only question list matching the client-facing layout. Questions with AI enabled show "AI follow-up active" Badge. Phase 3 will upgrade this to use the actual `<IntakeForm>` component with `preview={true}` prop (inputs interactive, submit disabled).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(form-builder): add form preview mode"
```

- [ ] **Step 4: Tag v0.2.0-alpha.1, create PR, merge**

---

## Phase 3: AI Follow-up Engine + Intake Form

### Task 3.1: AI Configuration + Prompt Templates

**Files:**
- Create: `src/lib/ai/config.ts`, `src/lib/ai/prompts/follow-up.ts`, `src/lib/ai/prompts/brief.ts`, `src/lib/ai/prompts/flags.ts`

- [ ] **Step 1: Write test for AI config**

```ts
// src/lib/ai/__tests__/config.test.ts
describe('AI config', () => {
  it('reads models from env with defaults', () => {
    const { AI_MODELS } = require('../config')
    expect(AI_MODELS.followUp).toBe('groq/llama-3.3-70b-versatile')
  })
})
```

- [ ] **Step 2: Create AI config (src/lib/ai/config.ts)**

```ts
export const AI_MODELS = {
  followUp: process.env.AI_MODEL_FOLLOWUP ?? "groq/llama-3.3-70b-versatile",
  brief:    process.env.AI_MODEL_BRIEF    ?? "groq/llama-3.3-70b-versatile",
  flags:    process.env.AI_MODEL_FLAGS    ?? "groq/llama-3.3-70b-versatile",
} as const
```

- [ ] **Step 3: Create prompt templates**

TypeScript functions returning formatted prompt strings. Follow-up prompt wraps answer in `<client_answer>` tags. Brief prompt uses `<session_transcript>` tags.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ai): add configurable model config and prompt templates"
```

### Task 3.2: Follow-up Generation Pipeline

**Files:**
- Create: `src/lib/ai/follow-up.ts`
- Install: `ai@^6.0.0`

- [ ] **Step 1: Install AI SDK**

```bash
pnpm add ai@^6.0.0
```

- [ ] **Step 2: Write test for follow-up function**

Mock the AI call, test that it returns `{ askFollowUp: boolean, question: string | null }`.

- [ ] **Step 3: Create follow-up.ts**

Uses `streamText()` with `AI_MODELS.followUp` and `Output.object()` with Zod schema:

```ts
import { streamText, Output } from 'ai'
import { z } from 'zod'

const followUpSchema = z.object({
  ask_followup: z.boolean(),
  question: z.string().nullable(),
})
```

Includes: generation ID tracking (`nanoid`), latency measurement, token usage logging.

- [ ] **Step 4: Run test — verify it passes**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ai): add follow-up generation pipeline with streamText"
```

### Task 3.3: Session API Routes + Actions

**Files:**
- Create: `src/app/api/session/start/route.ts`, `src/app/api/session/answer/route.ts`, `src/app/api/session/resume/route.ts`, `src/lib/actions/sessions.ts`

- [ ] **Step 1: Create session Server Actions**

`src/lib/actions/sessions.ts`:
- `completeSession(sessionId)` — sets `status='completed'`, `brief_status='pending'`. Triggers brief generation via `waitUntil`.
- `getSessionForProvider(sessionId, providerId)` — provider-scoped session fetch for dashboard

- [ ] **Step 2: Create POST /api/session/start**

Creates session record with `status='active'`, empty state, generated `resume_token` (nanoid). Returns `{ sessionId, resumeToken }`.

- [ ] **Step 3: Create POST /api/session/answer**

The latency-critical path — broken into sub-steps:
1. **Input validation** — answer length ≤ 5000 chars, strip HTML tags
2. **Session read + version check** — fetch session, verify `status='active'`
3. **Optimistic concurrency update** — `UPDATE SET state=$new, version=version+1, updated_at=now() WHERE id=$id AND version=$current`. Retry once on 0 rows (conflict).
4. **AI follow-up call** — `streamText()` with answer wrapped in `<client_answer>` delimiters
5. **Stream response** — return streaming follow-up question (or null) to client
6. **Generation logging** — track to `generations` table via `waitUntil` (non-blocking)

- [ ] **Step 4: Create GET /api/session/resume**

Accepts `?token=xxx`, returns session state for form pre-fill.

- [ ] **Step 5: Write unit tests for session routes**

Test: valid answer submission, empty answer rejection, version conflict handling, answer length limit enforcement.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(session): add session start, answer, resume routes and actions with optimistic concurrency"
```

### Task 3.4: Client-Facing Intake Form UI

**Files:**
- Create: `src/app/form/[formId]/page.tsx`, `src/components/intake/intake-form.tsx`, `src/components/intake/question-display.tsx`, `src/components/intake/follow-up-region.tsx`, `src/components/intake/progress-bar.tsx`, `src/components/intake/completion-screen.tsx`

- [ ] **Step 1: Create form page (Server Component)**

Fetches form + questions. Renders `<IntakeForm>` with form data. Uses `'use cache'` + `cacheTag`.

- [ ] **Step 2: Create IntakeForm orchestrator (Client Component)**

Manages session state. On mount: creates session via `/api/session/start` or resumes via localStorage token. Tracks answered questions, follow-ups, progress.

- [ ] **Step 3: Create QuestionDisplay**

Renders question prompt + appropriate input (Textarea, RadioGroup, Select, DatePicker, ToggleGroup for scale). Auto-resize textarea. Validation on Continue.

- [ ] **Step 4: Create FollowUpRegion (the signature interaction)**

After answer blur/selection → calls `/api/session/answer` → if follow-up returned:
- 400ms delay before showing loader (prevent flash)
- Height expansion animation (350ms spring from motion spec)
- Content fade-in (100ms delay)
- Indented region with left accent border
- Focus moves to new input after animation

Use `followUpReveal` variant from motion spec.

- [ ] **Step 5: Create ProgressBar**

"5 of 12" format. Follow-ups don't inflate denominator. 6px height shadcn Progress.

- [ ] **Step 6: Create CompletionScreen**

Checkmark stroke animation, "Thank you" heading, context text. Triggers brief generation via Server Action (sets `brief_status='pending'`).

- [ ] **Step 7: Add session resume via localStorage**

On mount: check for `resume_token` in localStorage. If found, call `/api/session/resume` and pre-fill answers.

- [ ] **Step 8: Test full intake flow manually**

Open form → answer questions → see AI follow-ups → complete → see thank-you.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(intake-form): add client-facing intake form with AI follow-up injection and session management"
```

### Task 3.5: AI Generation Tracking

**Files:**
- Modify: `src/lib/ai/follow-up.ts` (already has tracking)
- Create: `src/lib/ai/track.ts`

- [ ] **Step 1: Create generation tracking utility**

```ts
export async function trackGeneration(data: {
  id: string, sessionId: string, task: string, model: string,
  promptTokens: number, completionTokens: number, latencyMs: number
}) {
  const costMicrocents = estimateCost(data.model, data.promptTokens, data.completionTokens)
  await getDb().insert(generations).values({ ...data, estimatedCostMicrocents: costMicrocents })
}
```

- [ ] **Step 2: Integrate into follow-up pipeline (already started in 3.2)**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ai): add generation tracking with cost estimation"
```

- [ ] **Step 4: Tag v0.3.0-alpha.1, create PR, merge**

---

## Phase 4: Brief Synthesis + Dashboard

### Task 4.1: Brief Generation Pipeline

**Files:**
- Create: `src/lib/ai/brief.ts`, `src/lib/ai/flags.ts`, `src/lib/actions/briefs.ts`

- [ ] **Step 1: Create brief synthesis function**

Uses `generateText()` with `Output.object()` and Zod schema for structured brief:

```ts
const briefSchema = z.object({
  situationSummary: z.string(),
  keyFlags: z.array(z.object({ label: z.string(), severity: z.enum(['risk', 'complexity', 'info']), evidence: z.string() })),
  firstCallQuestions: z.array(z.string()),
  backgroundContext: z.string(),
})
```

- [ ] **Step 2: Create flag detection function**

Separate `generateText()` call focused on risk/complexity/urgency detection.

- [ ] **Step 3: Create brief generation Server Action**

Called by `waitUntil` after session completion:
1. Set `brief_status='generating'`
2. Read full session state
3. Call brief synthesis + flag detection
4. Insert into `briefs` table (content markdown + structured JSONB)
5. Set `brief_status='completed'`
6. On failure: set `brief_status='failed'`

- [ ] **Step 4: Test brief generation with a mock session**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(brief): add brief synthesis and flag detection pipelines"
```

### Task 4.2: Provider Dashboard — Layout + Navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/sidebar-nav.tsx`, `src/components/dashboard/subscription-banner.tsx`

- [ ] **Step 1: Create dashboard layout with collapsible sidebar**

240px expanded / 48px icon rail. Clerk UserButton at bottom. Route links: Dashboard, Forms, Briefs, Settings. Active state via pathname matching.

- [ ] **Step 2: Create subscription banner**

Shows trial countdown, past-due warning, or canceled notice based on `providers.subscription_status`.

- [ ] **Step 3: Mobile responsive — Sheet sidebar**

Below md breakpoint: hamburger icon, Sheet slides from left, auto-closes on navigation.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add collapsible sidebar layout with subscription banners"
```

### Task 4.3: Dashboard Home + Forms List + Briefs List

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/forms/page.tsx`, `src/app/(dashboard)/dashboard/briefs/page.tsx`, `src/components/dashboard/metrics-row.tsx`, `src/components/dashboard/intakes-table.tsx`, `src/components/dashboard/forms-list.tsx`

- [ ] **Step 1: Create dashboard home page**

4-card metrics row: total intakes, active forms, completion rate, AI cost this month. (Note: dashboard spec says "Avg Brief Quality" — per errata, replaced with "AI Cost This Month" which is derivable from `generations` table.) Recent intakes table (10 rows, link to brief). Three quick action buttons: Create Form, View All Briefs, Manage Billing.

- [ ] **Step 2: Install @tanstack/react-table for data tables**

```bash
pnpm add @tanstack/react-table
```

Create a reusable `DataTable` component with sorting, filtering, and pagination (10 rows default, "Showing 1-10 of N" format). Apply to all list views.

- [ ] **Step 3: Create forms list page**

Grid/list toggle. Form cards with title, template badge, active dot, intake count. Actions: edit, preview, copy link, toggle active, delete (AlertDialog). Pagination via DataTable.

- [ ] **Step 4: Create briefs list page**

Table: client name, form, date, status badge, duration, view action. Sorting by date (default), filtering by form and status, pagination (20 per page). Empty search state: "No results for [query]" + "Clear filters" button.

- [ ] **Step 5: Add breadcrumbs to dashboard layout**

Breadcrumb component in `(dashboard)/layout.tsx`. Routing map: `/dashboard` → "Dashboard", `/dashboard/forms/*` → "Dashboard > Forms", `/dashboard/briefs/*` → "Dashboard > Briefs > [Session]", etc.

- [ ] **Step 6: Add empty states for all three pages**

- [ ] **Step 7: Add loading skeletons for all three pages**

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add dashboard home, forms list, briefs list with metrics and data tables"
```

### Task 4.4: Brief Viewer

**Files:**
- Create: `src/app/(dashboard)/dashboard/briefs/[sessionId]/page.tsx`, `src/components/dashboard/brief-viewer.tsx`, `src/components/dashboard/brief-sidebar.tsx`

- [ ] **Step 1: Install AI Elements for MessageResponse**

```bash
npx ai-elements@latest add message
```

- [ ] **Step 2: Create brief viewer page**

Two-column layout (2/3 content + 1/3 metadata sidebar). Content rendered with `<MessageResponse>` from AI Elements. Flags as color-coded Badges. First-call questions as checkable list (persisted via Server Action).

- [ ] **Step 3: Create brief sidebar**

Session metadata: date, form used, duration, answer count, follow-up count, AI cost.

- [ ] **Step 4: Add action bar — print, export, mark reviewed**

- [ ] **Step 5: Handle edge cases — empty sections, generating status, failed status**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add brief viewer with AI Elements, flag badges, checkable questions"
```

### Task 4.5: Email Notification

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Install Resend**

```bash
pnpm add resend
```

- [ ] **Step 2: Create email send function**

Sends brief completion notification with summary to provider's email.

- [ ] **Step 3: Integrate into brief generation pipeline (waitUntil)**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(notifications): add email notification on brief completion via Resend"
```

### Task 4.6: Cron Jobs

**Files:**
- Create: `src/app/api/cron/abandon-sessions/route.ts`, `src/app/api/cron/retry-briefs/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create abandon stale sessions cron**

Runs hourly. Marks sessions as abandoned if `updated_at` > 24h and `status='active'`.

- [ ] **Step 2: Create retry failed briefs cron**

Runs every 5 minutes. Finds sessions with `brief_status='failed'` or `brief_status='pending'` older than 5 min. Retries brief generation (max 3 attempts tracked in `briefs.metadata`).

- [ ] **Step 3: Configure cron in vercel.json**

```json
{
  "crons": [
    { "path": "/api/cron/abandon-sessions", "schedule": "0 * * * *" },
    { "path": "/api/cron/retry-briefs", "schedule": "*/5 * * * *" }
  ]
}
```

- [ ] **Step 4: Add CRON_SECRET verification**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add cron jobs for session abandonment and brief retry"
```

- [ ] **Step 6: Tag v0.4.0-alpha.1, create PR, merge**

---

## Phase 5: Billing + Embed

### Task 5.1: Stripe Integration

**Files:**
- Create: `src/lib/stripe.ts`, `src/app/api/billing/webhook/route.ts`, `src/lib/actions/billing.ts`

- [ ] **Step 1: Install Stripe**

```bash
pnpm add stripe
```

- [ ] **Step 2: Create Stripe client (lazy init)**

- [ ] **Step 3: Create checkout session action**

Creates Stripe Checkout session for Starter ($29) or Professional ($79) with 14-day trial.

- [ ] **Step 4: Create Stripe webhook handler**

Handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Updates `providers.subscription_status`.

- [ ] **Step 5: Create billing portal action**

Returns Stripe Customer Portal URL for self-service management.

- [ ] **Step 6: Add billing tab to settings page**

Current plan display, usage stats, upgrade CTA (Starter), manage billing button (portal link).

- [ ] **Step 7: Add form limit enforcement**

Count active forms vs plan limit (10 for Starter, unlimited for Professional).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(billing): add Stripe integration with checkout, webhooks, portal, plan enforcement"
```

### Task 5.2: Embeddable Form

**Files:**
- Create: `src/app/embed/[formId]/page.tsx`, `src/app/api/embed.js/route.ts`

- [ ] **Step 1: Create embed page**

Same intake form but with permissive headers:
- `X-Frame-Options: ALLOWALL`
- `Content-Security-Policy: frame-ancestors *`
- Condensed header, no provider nav

- [ ] **Step 2: Create embed script loader**

`GET /api/embed.js` returns JavaScript that creates an iframe pointing to `/embed/[formId]`. Handles responsive sizing via `postMessage`.

- [ ] **Step 3: Add style customization to form settings Sheet**

Accent color picker (6 presets + custom hex input), persisted to `forms.style_config`. Embed form reads `style_config` and applies custom accent via CSS variables. Logo upload deferred to post-MVP.

- [ ] **Step 4: Add embed code generator to form settings Sheet**

Select box for form, code snippet with copy button, live preview iframe.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(embed): add iframe embed system with style customization, script loader, and code generator"
```

- [ ] **Step 5: Tag v0.5.0-beta.1, create PR, merge**

---

## Phase 6: Model Evaluation + Polish

### Task 6.1: Model Evaluation Harness

**Files:**
- Create: `src/lib/ai/eval/runner.ts`, `src/lib/ai/eval/fixtures.ts`, `src/lib/ai/eval/report.ts`

- [ ] **Step 1: Create 20+ test fixtures**

Cover: vague answers, complete answers, risk indicators, multi-topic answers, adversarial inputs. Each fixture has expected behavior (should/shouldn't trigger follow-up).

- [ ] **Step 2: Create eval runner**

Runs each fixture against a specified model. Measures: accuracy (precision/recall), latency (TTFT, total), quality score (manual rubric), cost.

- [ ] **Step 3: Create comparison report generator**

Outputs markdown table comparing models across all criteria.

- [ ] **Step 4: Run eval across all candidate models**

```bash
npx dotenv -e .env.local -- npx tsx src/lib/ai/eval/runner.ts
```

Models: `groq/llama-3.3-70b-versatile`, `groq/qwen-qwq-32b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `anthropic/claude-sonnet-4.6`

- [ ] **Step 5: Save results and update AI_MODELS defaults if needed**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ai): add model evaluation harness with 20+ fixtures and comparison report"
```

### Task 6.2: UI/UX Polish Pass

- [ ] **Step 1: Apply motion variants from theme spec**

Add Framer Motion animations to: page transitions, card hovers, list staggers, AI follow-up injection, completion screen.

- [ ] **Step 2: Verify dark/light theme consistency**

Check all surfaces in both themes. Fix any token mismatches.

- [ ] **Step 3: Create instrumentation.ts**

`src/instrumentation.ts`: minimal monitoring init. Structured JSON logging helper for API routes.

- [ ] **Step 4: Add Vercel Analytics + Speed Insights**

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

Add `<Analytics />` and `<SpeedInsights />` to root layout.

- [ ] **Step 4: Accessibility audit**

Check: focus management, ARIA attributes, contrast ratios, keyboard nav, reduced motion.

- [ ] **Step 5: Performance check**

Run Lighthouse. Check bundle size. Verify <2s follow-up latency.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: UI/UX polish — motion variants, theme consistency, analytics, a11y audit"
```

- [ ] **Step 7: Tag v0.6.0-beta.1, create PR, merge**

---

## Phase 7: Settings + Final Launch Prep

### Task 7.1: Settings Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings page with 4 tabs**

Account (profile, profession), Billing (Stripe portal), Notifications (email preferences), Embed (code generator).

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add settings page with account, billing, notifications, embed tabs"
```

### Task 7.2: Rate Limiting + Security

- [ ] **Step 1: Configure Vercel Firewall rate limits**

Via dashboard or API: session creation (10/hr/IP), answer submission (60/min/IP), form pages (100/min/IP).

- [ ] **Step 2: Verify Clerk proxy protects all dashboard routes**

- [ ] **Step 3: Verify all session/brief queries are provider-scoped**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(security): configure Vercel Firewall rate limits, verify auth scoping"
```

### Task 7.3: Final Testing + Tag

- [ ] **Step 1: End-to-end test**

Provider signs up → onboarding → creates form → client fills form with AI follow-ups → brief generated → provider views brief.

- [ ] **Step 2: Tag v1.0.0-rc.1**

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Tag v1.0.0, create PR, merge**

```bash
git tag -a v1.0.0 -m "feat: IntakeForm.ai MVP — AI-powered intake forms with brief synthesis"
git push origin v1.0.0
```

---

## Summary

| Phase | Tasks | Key Deliverable | Tag |
|-------|-------|----------------|-----|
| 0 | 6 | Project scaffold, auth, DB, CI, release-please | v0.1.0-alpha.1 |
| 1 | 2 | Seed data, provider onboarding + actions | v0.1.0-alpha.2 |
| 2 | 2 | Form editor with drag reorder + CRUD actions | v0.2.0-alpha.1 |
| 3 | 5 | AI follow-up engine, intake form UI, session actions | v0.3.0-alpha.1 |
| 4 | 6 | Brief synthesis, dashboard with pagination + breadcrumbs, crons | v0.4.0-alpha.1 |
| 5 | 2 | Stripe billing, iframe embed + style customization | v0.5.0-beta.1 |
| 6 | 2 | Model eval, UI polish + instrumentation | v0.6.0-beta.1 |
| 7 | 3 | Settings, security, launch | v1.0.0 |
| **Total** | **28 tasks** | | |

### Review Errata Applied

All 5 critical and 9 medium issues from plan review resolved:
- C1: Fixed `/onboarding/success` route name
- C2: Added `onboarding/layout.tsx`
- C3: Added `release-please` setup to Task 0.6
- C4: Added `forms.ts` Server Actions to Task 2.1
- C5: Added `providers.ts` Server Actions to Task 1.2
- M1: Clarified Task 2.2 preview is static until Phase 3 upgrade
- M2: Added `sessions.ts` Server Actions to Task 3.3
- M3: Schema tests deferred (structural, no DB needed)
- M4: Added errata note to Task 4.3 metrics
- M5: Added @tanstack/react-table + reusable DataTable to Task 4.3
- M6: Added style customization to Task 5.2
- M7: Added instrumentation.ts to Task 6.2
- M8: Data cleanup crons deferred to post-MVP (documented)
- M9: Zod installed in Task 0.6
