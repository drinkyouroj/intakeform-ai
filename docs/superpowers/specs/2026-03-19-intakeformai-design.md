# IntakeForm.ai — MVP Design Specification

## 1. Product Overview

IntakeForm.ai is an AI-powered intake form platform for service providers (therapists, coaches, lawyers, consultants). Providers create intake forms from profession-specific templates. Clients fill out the form; AI generates contextual follow-up questions in real-time based on answers. After completion, AI synthesizes a structured pre-read brief for the provider.

**Core value proposition:** Providers walk into every first call knowing exactly who they're talking to and what they need.

## 2. Architecture

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 App Router | Server Components, Server Actions, streaming, single deploy target |
| Deployment | Vercel | Zero-config, AI Gateway, Marketplace integrations |
| Database | Neon Postgres (Vercel Marketplace) | Serverless Postgres, free tier covers MVP |
| ORM | Drizzle | Lightweight, SQL-transparent, no cold-start penalty |
| Auth | Clerk (Vercel Marketplace) | Auto-provisioned, pre-built UI, proxy integration |
| AI | Vercel AI SDK v6 + AI Gateway (OIDC) | Unified provider interface, cost tracking, no manual API keys |
| Billing | Stripe | Subscription management, webhook integration |
| Styling | shadcn/ui + Geist + Framer Motion | Design-system primitives, adaptive dark/light theme |
| AI UI | AI Elements (MessageResponse) | Markdown rendering for AI-generated briefs |

### Deployment Architecture

```
┌─ Vercel Platform ────────────────────────────────────┐
│                                                       │
│  Next.js 16 App Router                               │
│  ├── /dashboard/*    Provider dashboard (authed)      │
│  ├── /form/[formId]  Standalone intake form (public)  │
│  ├── /embed/[formId] Embeddable intake form (iframe)  │
│  ├── /api/session/*  Session management               │
│  ├── /api/ai/*       AI processing                    │
│  ├── /api/billing/*  Stripe webhooks                  │
│  └── Server Actions  Form CRUD, brief actions         │
│                                                       │
│  AI Layer (lib/ai/)                                   │
│  ├── follow-up.ts    streamText (fast model)          │
│  ├── brief.ts        generateText + Output.object()   │
│  ├── flags.ts        generateText (flag detection)    │
│  └── eval/           Model evaluation harness         │
│                                                       │
│  Data Layer (lib/db/)                                 │
│  ├── Drizzle ORM + Neon Postgres                     │
│  └── Schema: providers, forms, questions, sessions,   │
│       briefs, generations                             │
│                                                       │
│  Auth: Clerk (Vercel Marketplace)                     │
│  Billing: Stripe                                      │
│  AI: Vercel AI Gateway (OIDC)                        │
│  Theme: Adaptive (dark default, light toggle)         │
└───────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **No Python backend** — AI SDK v6 handles all LLM integration in TypeScript. The AI layer (`lib/ai/`) is isolated behind a clean module boundary for future extraction if ML capabilities are ever needed.

2. **No Redis** — Session state stored as JSONB in Postgres. At MVP scale (100 sessions/month, 2-3 concurrent max), Postgres handles this trivially. The ~10ms read/write overhead is negligible against ~200ms+ AI latency.

3. **No Turborepo/monorepo** — Single Next.js app. Monorepo adds complexity with no payoff for a solo developer building one application. Can migrate later if the project splits into multiple apps.

4. **Embeddable form strategy** — MVP launches with standalone branded links (`/form/[formId]`). Week 3 adds iframe embed support via `/embed/[formId]` with permissive headers and a lightweight script loader.

## 3. AI Layer

### Model Configuration

Models are configurable per-task via environment variables, defaulting to Groq for cost efficiency:

```ts
// lib/ai/config.ts
export const AI_MODELS = {
  followUp: process.env.AI_MODEL_FOLLOWUP ?? "groq/llama-3.3-70b-versatile",
  brief:    process.env.AI_MODEL_BRIEF    ?? "groq/llama-3.3-70b-versatile",
  flags:    process.env.AI_MODEL_FLAGS    ?? "groq/llama-3.3-70b-versatile",
} as const;
```

All models route through the Vercel AI Gateway (OIDC auth, no manual API keys). Swap any model by changing an env var — no code changes required.

### AI Processing Pipeline

**Follow-up generation** (per-answer, must be fast):
- Uses `streamText()` for time-to-first-token optimization
- Input: current question, client answer, persona context, prior follow-ups
- Output: JSON `{ ask_followup: boolean, question: string | null }`
- Constraint: max 2 follow-ups per original question
- Target latency: <2 seconds end-to-end

**Brief synthesis** (per-session, async after completion):
- Uses `generateText()` with `Output.object()` for structured output
- Input: full session transcript (all questions + answers + follow-ups)
- Output: structured brief (situation summary, key flags, first-call questions, background context)
- Runs asynchronously — latency is not user-facing

**Flag detection** (runs as part of brief synthesis):
- Uses `generateText()` with `Output.object()` for structured extraction
- Detects risk factors, complexity indicators, urgency signals
- Output embedded in the brief's "Key Flags" section

### AI Generation Persistence

Every AI call is tracked:
- Unique ID assigned before the call (`nanoid()`)
- Token usage, model name, estimated cost stored in `generations` table
- Enables cost tracking, debugging, and future billing accuracy

### Model Evaluation Phase

Before shipping, a structured evaluation compares models on 20+ intake scenarios:

| Model | Provider | Purpose |
|-------|----------|---------|
| `groq/llama-3.3-70b-versatile` | Groq | Baseline (default) |
| `groq/qwen-qwq-32b` | Groq | Smaller/cheaper alternative |
| `openai/gpt-oss-120b` | OpenAI via Gateway | Large open model quality check |
| `openai/gpt-oss-20b` | OpenAI via Gateway | Small open model speed check |
| `anthropic/claude-sonnet-4.6` | Anthropic | Quality ceiling reference |

Evaluation criteria per model:
1. Follow-up precision/recall (correct ask vs. skip decisions)
2. Follow-up relevance (specificity and usefulness)
3. Brief quality (structure, accuracy, actionability)
4. Flag detection accuracy (catch rate, false positive rate)
5. Latency (TTFT for follow-ups, total time for briefs)
6. Cost per call at projected volume

Results are stored and the evaluation script is re-runnable for new model releases.

### Prompt Templates

```
lib/ai/prompts/
├── follow-up.ts   — Follow-up decision prompt (per-answer)
├── brief.ts       — Brief synthesis prompt (per-session)
└── flags.ts       — Flag detection prompt (per-session)
```

Prompts are TypeScript template functions that accept typed inputs and return formatted strings. This keeps prompts version-controlled, testable, and type-safe.

## 4. Data Layer

### ORM: Drizzle

Drizzle over Prisma because:
- No query engine binary (avoids serverless cold-start overhead)
- SQL-transparent (what you write is what runs)
- First-class `@neondatabase/serverless` driver support
- Migrations via `drizzle-kit generate` / `drizzle-kit migrate`

### Database Schema

```sql
-- Enums
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE question_type AS ENUM ('text', 'select', 'multiselect', 'date', 'scale');

-- Providers (service professionals)
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  profession TEXT,
  settings JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  subscription_status subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form configurations
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template_slug TEXT,
  is_active BOOLEAN DEFAULT true,
  style_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions within forms
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  type question_type NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  sort_order INTEGER NOT NULL,
  ai_follow_up JSONB DEFAULT '{"enabled": true, "maxFollowUps": 2}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intake sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) NOT NULL,
  status session_status DEFAULT 'active',
  brief_status TEXT DEFAULT 'none' CHECK (brief_status IN ('none', 'pending', 'generating', 'completed', 'failed')),
  version INTEGER DEFAULT 1,
  state JSONB DEFAULT '{}',
  client_meta JSONB DEFAULT '{}',
  resume_token TEXT UNIQUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generated briefs
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  structured JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI generation tracking (every LLM call)
CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  task TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  estimated_cost_microcents BIGINT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Schema Decisions

- **`sessions.state` as JSONB** — Holds the live session: current question index, all answers, follow-up transcript. One read + one write per interaction. Shape: `{ currentIndex: number, answers: Answer[], followUps: Record<string, FollowUp[]> }`

- **`questions.ai_follow_up` as JSONB** — Per-question AI configuration without a separate table. Shape: `{ enabled: boolean, maxFollowUps: number, systemPrompt?: string }`

- **`briefs.content` as TEXT + `briefs.structured` as JSONB** — Content is rendered markdown (for display). Structured is the parsed brief object (for programmatic access: flags, questions, sections).

- **`generations` table** — Every LLM call tracked for cost analysis and debugging. Links to session for per-session cost aggregation.

- **`forms.style_config` as JSONB** — Stores embed styling overrides (colors, fonts, logo URL) for when providers customize the form appearance.

### Data Flow: Complete Intake Session

1. **Client opens form link** → `GET /form/[formId]` → Server Component fetches form + questions from Postgres (cached with `'use cache'` + `cacheTag('form-{id}')`)
2. **Session starts** → Server Action: `INSERT INTO sessions` with `status='active'`, empty state, generated `resume_token` (nanoid). Token stored in client localStorage for session recovery.
3. **Client submits answer** → Route Handler `POST /api/session/answer`:
   - Optimistic concurrency: `UPDATE sessions SET state = $new, version = version + 1, updated_at = now() WHERE id = $id AND version = $current` — retry on 0 rows affected (conflict)
   - Call `streamText()` for follow-up decision (~200-800ms)
   - Stream follow-up question (or null) to client
   - Log generation to `generations` table (via `waitUntil`, non-blocking)
4. **Follow-up answered** → Same flow as step 3, incrementing follow-up count
5. **Session completes** → Server Action: `UPDATE sessions SET status='completed', brief_status='pending'`
6. **Brief generation** (async, via `waitUntil`):
   - Set `brief_status='generating'`
   - Read full `sessions.state`
   - Call `generateText()` with `Output.object()` for structured brief
   - Call flag detection
   - `INSERT INTO briefs` (both content and structured)
   - Set `brief_status='completed'`
   - Send email notification to provider (via Resend or similar)
   - On failure: set `brief_status='failed'` (cron job retries — see below)
7. **Provider views brief** → `/dashboard/briefs/[sessionId]` → Server Component renders brief with `<MessageResponse>` from AI Elements
8. **Session resume** → Client visits form, localStorage has `resume_token` → `GET /api/session/resume?token=xxx` → returns session state to continue where they left off

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Abandon stale sessions | Every hour | `UPDATE sessions SET status='abandoned' WHERE status='active' AND updated_at < now() - interval '24 hours'` |
| Retry failed briefs | Every 5 minutes | Find sessions with `brief_status='failed'` or `brief_status='pending'` older than 5 minutes, retry brief generation (max 3 attempts) |

### Input Validation & Security

- **Answer length limit:** 5,000 characters per answer (reject longer submissions)
- **Session rate limit:** Max 1 answer submission per second per session (enforced in handler)
- **Prompt injection mitigation:** All user input wrapped in `<client_answer>` delimiters in prompts. System prompt instructs model to treat content within delimiters as data, never as instructions.
- **Sanitization:** Strip HTML tags from answers before storage and prompt injection. Preserve unicode text.

### Migration Strategy

- Development: `drizzle-kit push` (applies schema diff directly)
- Production: `drizzle-kit generate` + `drizzle-kit migrate` (versioned SQL migrations committed to git)
- Migrations stored in `drizzle/migrations/`, committed with the code that depends on them

## 5. Authentication & Authorization

### Clerk Integration

- Installed via Vercel Marketplace (`vercel integration add clerk`)
- Auto-provisions `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Manual env vars: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

### Auth Flow

1. `proxy.ts` (Next.js 16's rename of `middleware.ts`, runs on Node.js runtime only; placed at `src/proxy.ts` if using `--src-dir`) calls `clerkMiddleware()` — protects `/dashboard/*` routes
2. Public routes: `/form/*`, `/embed/*`, `/api/session/*` (client-facing, no auth)
3. Provider routes: `/dashboard/*`, `/api/billing/*` (require Clerk session)
4. After sign-up, provider selects profession → creates `providers` record linked to `clerk_user_id`

### Authorization Rules

| Route Pattern | Auth Required | Who |
|--------------|---------------|-----|
| `/form/[formId]` | No | Clients filling out forms |
| `/embed/[formId]` | No | Embedded form on provider sites |
| `/api/session/*` | No | Session management during intake |
| `/dashboard/*` | Yes | Provider (form owner) |
| `/api/billing/*` | Webhook secret | Stripe |
| `/api/ai/*` | Internal only | Called by session handlers |

### Rate Limiting (Vercel Firewall)

Public endpoints require rate limiting to prevent abuse and cost overruns:

| Endpoint | Limit | Window | Key | Action |
|----------|-------|--------|-----|--------|
| `POST /api/session/start` | 10 requests | 1 hour | IP | deny (429) |
| `POST /api/session/answer` | 60 requests | 1 minute | IP | deny (429) |
| `/form/*` | 100 requests | 1 minute | IP | challenge |

Configured via Vercel Firewall WAF custom rules (up to 40 rules on Pro plan). Rate limits propagate globally in <300ms with no redeployment.

### Data Deletion Strategy

- **Forms:** Soft delete only (`is_active = false`). Sessions and briefs are preserved for provider records.
- **Providers:** Account deletion removes the `providers` record. Forms are soft-deleted. Sessions/briefs are anonymized (clear `client_meta`) but retained for 90 days, then hard-deleted via cron.
- **Sessions:** Auto-abandoned after 24h inactivity. Abandoned sessions are cleaned up after 30 days.
- **No cascade deletes** from forms → sessions → briefs. This is intentional: completed intakes have value even if the form template is later modified or deactivated.

### Observability

- **Structured logging** — JSON-formatted `console.log` in every API route and Server Action (request ID, timing, error details)
- **Vercel Analytics** — `@vercel/analytics` for pageview and custom event tracking (form completions, brief views)
- **Vercel Speed Insights** — `@vercel/speed-insights` for Core Web Vitals per route
- **Error tracking** — Structured error logging with route context. Sentry integration deferred to post-MVP.
- **AI cost dashboard** — Query `generations` table for per-model, per-task cost aggregation (built into provider dashboard)

## 6. Billing

### Stripe Integration

**Pricing tiers:**
- **Starter** — $29/month: up to 10 active forms, unlimited intakes, email notifications
- **Professional** — $79/month: unlimited forms, team member access, priority support

**Implementation:**
- Stripe Checkout for subscription creation
- Stripe Customer Portal for self-service management
- Webhook handler at `/api/billing/webhook` for subscription lifecycle events
- 14-day free trial (credit card required)
- `providers.subscription_status` tracks current state
- Form activation checks: count active forms vs. plan limit

### Trial Hook

The embed code works during the free trial. Providers experience real value (seeing the brief) before paying. Upgrade prompt appears when: form submitted 10+ times OR approaching trial end.

## 7. Embeddable Forms

### Phase 1 (MVP): Standalone Branded Links

- Route: `/form/[formId]`
- Provider shares link with clients (email, website button, etc.)
- Server Components render the form — fast initial load, no client JS waterfall
- URL format: `https://intakeform.ai/form/[formId]` or custom domain later

### Phase 2 (Week 3): Iframe Embed

- Route: `/embed/[formId]` with permissive headers:
  - `X-Frame-Options: ALLOWALL`
  - `Content-Security-Policy: frame-ancestors *`
- Lightweight `<script>` loader hosted at `/api/embed.js`:
  - Creates iframe pointing to `/embed/[formId]`
  - Handles responsive sizing via `postMessage` communication
  - Provider gets a code snippet: `<script src="https://intakeform.ai/api/embed.js" data-form-id="xxx"></script>`
- Embed form uses `forms.style_config` for provider branding (colors, logo)

## 8. UI/UX Design

### Design System

- **Component library:** shadcn/ui (new-york style) + custom extensions
- **Typography:** Geist Sans (interface), Geist Mono (data, IDs, timestamps)
- **Theme:** Adaptive — dark mode default, light mode toggle via `next-themes`
- **Motion:** Framer Motion for page transitions, form interactions, AI response reveals
- **Icons:** Lucide React (consistent with shadcn defaults)

### Aesthetic Direction

**Provider dashboard (dark default):**
- Linear/Vercel-inspired: clean, dense, monochrome with one accent color
- zinc/neutral base palette, sharp borders, restrained accents
- Geist Mono for metrics (session counts, costs, dates)

**Intake form (light default, adaptive):**
- Traditional form with AI enhancement — professional and trustworthy
- Multi-question pages with progress indicator
- AI follow-ups slide in smoothly beneath relevant answers
- Must feel premium — therapists' and lawyers' clients are the end users
- Subtle loading states during AI processing ("Preparing your next question...")

### Form Builder (Template + Light Editing)

MVP form builder capabilities:
- Select from 5 profession templates (therapist, coach, consultant, lawyer, financial advisor)
- Edit question text inline
- Reorder questions via drag handle
- Add/remove questions
- Toggle AI follow-up per question
- Preview mode (see form as client would)
- NOT a full drag-and-drop builder (that's V1 post-MVP)

### Key Surfaces

1. **Onboarding** — Sign up → select profession → pre-loaded template appears → one-click activate
2. **Dashboard home** — List of forms, recent intakes, brief summaries, key metrics
3. **Form editor** — Template with inline editing, question reordering, AI config toggles
4. **Brief viewer** — Structured brief rendered with AI Elements `<MessageResponse>`, flag badges, first-call questions
5. **Intake form** — Client-facing, multi-question with AI follow-up injection, progress bar, completion state
6. **Settings** — Account, billing (Stripe portal), notification preferences, embed code generator

### UI/UX Design Specifications (Completed)

Detailed design specs have been produced for every surface. Each is a standalone implementable document:

| Spec | File | Key Decisions |
|------|------|---------------|
| **Client Intake Form** | `client-intake-form-design.md` | Single-column flush layout (max-w-2xl), oklch light palette, AI follow-ups in indented indigo-tinted regions with 3px left border, height-first animation (350ms expand → 100ms fade-in), progress as "5 of 12" (follow-ups don't inflate count), restrained completion (no confetti — professional context) |
| **Provider Dashboard** | `provider-dashboard-design.md` | Collapsible sidebar (240px / 48px icon rail), violet accent (oklch hue 265), zinc base, 4-card metrics row, brief viewer with flag badges (red/amber/blue), checkable first-call questions, Geist Mono for all data values |
| **Form Editor + Onboarding** | `2026-03-19-form-editor-onboarding-design.md` | 3-step onboarding (profession → template preview → activate), split-view editor (400px question list + detail panel), @dnd-kit/sortable drag reorder, 800ms debounced auto-save, click-to-edit inline pattern, settings in right Sheet |
| **Motion & Theme System** | `2026-03-19-motion-theme-spec.md` | 6-tier duration scale (120ms–800ms), 5 easing curves, 4 spring presets, 9 Framer Motion variant sets, 5-phase AI follow-up injection sequence, full oklch color architecture for dark+light (independently designed), 10-token typography scale, WCAG 2.1 AA compliance |

| **Design Review Errata** | `2026-03-19-design-review-errata.md` | 10 critical, 24 medium, 23 low issues found and resolved. Token canonicalization, subscription states, pagination, session resume, validation, edge cases. All patches documented. |

#### Token Authority

**The motion/theme spec is the single source of truth for all design tokens.** Surface specs reference token names — they do not define their own oklch values. Any conflicts between specs are resolved in the errata document.

#### Cross-Surface Design Decisions

- **Accent color:** Violet (oklch hue 265) across dashboard. Indigo (oklch hue 270) for AI-specific elements.
- **Theme strategy:** Dashboard defaults dark, intake form defaults light. Both independently designed (not inverted). Toggle via `next-themes` with `data-theme` attribute.
- **AI visual language:** AI-generated content always has an indigo-tinted surface + left accent border. Sparkle icon (✦) used as AI indicator throughout.
- **Typography:** Geist Sans for all interface text. Geist Mono for metrics, IDs, dates, costs, code. Seven-level heading scale from 36px display to 12px caption.
- **Motion philosophy:** Purposeful, not decorative. Micro-interactions < 200ms. Layout animations 300-600ms. All respect `prefers-reduced-motion`. The AI follow-up injection is the signature animation — a 5-phase sequence that makes AI enhancement feel natural.
- **Accessibility:** WCAG 2.1 AA contrast ratios, `aria-live="polite"` for dynamic AI content, focus management after follow-up injection, 44px minimum touch targets, full keyboard navigation.

## 9. Git Workflow & DevOps

### Branch Strategy: GitHub Flow

- `main` is protected — no direct commits
- All work on feature branches, merged via squash-merge PRs
- Branch naming: `<type>/<short-description>` (e.g., `feat/form-builder`, `fix/follow-up-latency`)

### Commit Convention: Conventional Commits

```
<type>(<scope>): <imperative description>

feat(form-builder): add question reordering via drag handle
fix(ai): handle null response from follow-up generation
docs(api): add session endpoint reference
test(brief): add synthesis quality validation
chore(ci): configure GitHub Actions pipeline
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`
Scopes: `form-builder`, `intake-form`, `dashboard`, `ai`, `db`, `billing`, `ci`, `auth`, `embed`

### Version Tagging

Semantic versioning with pre-release tags throughout MVP development:

```
v0.1.0-alpha.1   — Project scaffold + auth + database
v0.2.0-alpha.1   — Form templates + editor
v0.3.0-alpha.1   — AI follow-up engine
v0.4.0-alpha.1   — Brief synthesis + dashboard
v0.5.0-beta.1    — Billing + embed
v0.6.0-beta.1    — Model evaluation + polish
v1.0.0-rc.1      — Release candidate
v1.0.0           — Public launch
```

Automated via `release-please` on merge to main.

### CI Pipeline

```yaml
# On PR:
- pnpm install --frozen-lockfile
- pnpm lint
- pnpm type-check (tsc --noEmit)
- pnpm test (Vitest)
- pnpm build
- Vercel preview deployment (automatic)

# On merge to main:
- release-please creates Release PR (bumps version, updates CHANGELOG)
- Merge Release PR → GitHub Release + version tag
- Vercel production deployment (automatic)
```

### PR Template

```markdown
## What
<!-- One sentence: what does this PR do? -->

## Why
<!-- Context: why is this change needed? -->

## How to test
<!-- Steps or commands to verify -->

## Docs
- [ ] Documentation updated or not needed
```

### Documentation Strategy

- `/docs/` directory in repo for architecture decisions and API reference
- ADRs (Architecture Decision Records) in `/docs/adr/` for significant choices
- Inline JSDoc/TSDoc for public interfaces
- Documentation updated in the same PR as the code it describes

## 10. Starter Templates

Five profession-specific templates ship with the MVP:

1. **Therapist Initial Intake** — Personal history, current concerns, therapy goals, insurance/logistics
2. **Business Coach Discovery** — Business overview, challenges, goals, budget/timeline expectations
3. **Freelance Consultant Scope** — Project background, objectives, constraints, decision-making process
4. **Financial Advisor First Meeting** — Financial overview, goals, risk tolerance, existing planning
5. **Attorney Client Intake** — Legal matter overview, parties involved, timeline, prior legal history

Each template includes 8-15 questions with profession-appropriate AI follow-up configuration and persona context for the AI prompts.

## 11. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Form builder scope creep | MVP is template + light editing only. Full builder is V1. |
| Follow-up latency | Groq models achieve ~200ms TTFT. Streaming shows response appearing <1s. Loading indicator for >1s. |
| HIPAA compliance | MVP explicitly excludes healthcare providers. Target coaches, consultants, lawyers first. Clear communication in onboarding. |
| AI quality variance | Model evaluation phase before ship. Configurable models per-task. Easy to swap if quality drops. |
| Vercel vendor lock-in | Next.js is open-source, runs on Node.js anywhere. Neon uses standard Postgres wire protocol. Drizzle works with any Postgres provider. |
| Session data loss | Optimistic concurrency (version column) prevents write conflicts. Resume token in localStorage enables session recovery after browser crash. |
| Brief generation failure | `brief_status` tracks generation state. Cron job retries failed briefs (max 3 attempts). Provider sees "generating..." status instead of empty brief. |
| Abuse of public endpoints | Vercel Firewall rate limiting on session creation (10/hr/IP) and answer submission (60/min/IP). Input length limits (5K chars). Prompt injection delimiters. |
| Function duration limits | Brief synthesis uses `waitUntil` for async processing. Streaming resets timeout window for follow-ups. |

## 12. Cost Projections

### Infrastructure (MVP, 100 sessions/month)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro | $20 |
| Neon Postgres | Free | $0 |
| Clerk | Free (up to 10K MAU) | $0 |
| Stripe | 2.9% + $0.30 per transaction | ~$2-5 |
| AI (Groq default) | ~$0.003/session | ~$0.30 |
| **Total** | | **~$22-25/month** |

### AI Cost per Session (Groq default)

| Operation | Calls | Cost/Call | Total |
|-----------|-------|-----------|-------|
| Follow-up decisions | ~10/session | ~$0.0001 | $0.001 |
| Brief synthesis | 1/session | ~$0.002 | $0.002 |
| Flag detection | 1/session | ~$0.001 | $0.001 |
| **Per session** | | | **~$0.004** |

At $29/month revenue per provider doing 100 sessions/month → $0.40 AI cost vs $29 revenue. Extremely healthy margins.

### Cost Sensitivity by Model (per session, 100 sessions/month)

If the model evaluation phase recommends upgrading from Groq defaults:

| Model Configuration | Per Session | Per 100 Sessions | Margin on $29/mo |
|---------------------|------------|-------------------|-------------------|
| All Groq Llama 3.3 70B (default) | $0.004 | $0.40 | 98.6% |
| Groq follow-ups + Groq Qwen 32B briefs | $0.003 | $0.30 | 99.0% |
| Groq follow-ups + Claude Sonnet briefs | $0.035 | $3.50 | 87.9% |
| All Claude Sonnet (quality ceiling) | $0.06 | $6.00 | 79.3% |
| Groq follow-ups + GPT-OSS-120B briefs | ~$0.01 | ~$1.00 | 96.6% |

**Conclusion:** Business model holds across all model combinations. Even the most expensive configuration (all Claude Sonnet) maintains ~79% margin. The default Groq configuration provides a 30-150x cost advantage that can be traded for quality when the eval results justify it.

## 13. Development Phases

> **Note on Phase 7 (UI/UX Design):** This phase starts on Day 1 and runs in parallel with Phases 0-2. Design outputs (wireframes, component specs, motion language) inform Phase 2+ implementation. Listed separately for clarity.

### Phase 0: Project Setup + Git + CI (Day 1)
- Initialize Next.js 16, shadcn/ui, Drizzle, Clerk, Stripe skeleton
- Set up GitHub repo, branch protection, CI pipeline
- `vercel link` + AI Gateway + `vercel env pull`
- Tag: `v0.1.0-alpha.1`

### Phase 1: Data Layer + Auth (Days 2-3)
- Database schema + migrations
- Clerk integration + proxy
- Provider onboarding flow
- Tag: `v0.1.0-alpha.2`

### Phase 2: Form Templates + Editor (Days 4-6)
- 5 starter templates (seed data)
- Form editor with inline editing, reorder, add/remove
- Form preview mode
- Tag: `v0.2.0-alpha.1`

### Phase 3: AI Follow-up Engine (Days 7-9)
- Follow-up generation pipeline (streamText)
- Session management (state machine)
- Client-facing intake form UI
- AI generation tracking
- Tag: `v0.3.0-alpha.1`

### Phase 4: Brief Synthesis + Dashboard (Days 10-13)
- Brief generation pipeline (generateText + Output.object())
- Flag detection
- Provider dashboard (form list, brief viewer, metrics)
- Email notification on completion
- Tag: `v0.4.0-alpha.1`

### Phase 5: Billing + Embed (Days 14-16)
- Stripe integration (checkout, portal, webhooks)
- Iframe embed system + script loader
- Form styling customization
- Tag: `v0.5.0-beta.1`

### Phase 6: Model Evaluation + Polish (Days 17-19)
- Model evaluation harness
- Run eval across Groq, OpenAI, Anthropic models
- UI/UX polish pass
- Performance optimization
- Tag: `v0.6.0-beta.1`

### Phase 7: UI/UX Design Phase (Dedicated)
- Detailed mockups for all surfaces
- Motion design language
- Theme finalization
- Accessibility audit
- This phase runs in parallel with early implementation phases

### Phase 8: Beta Launch (Days 20-21)
- Final testing
- Demo video recording
- Beta outreach to 5 service providers
- Tag: `v1.0.0-rc.1` → `v1.0.0`
