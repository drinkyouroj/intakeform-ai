# MVP Blueprint: IntakeForm.ai

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     IntakeForm.ai                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [FORM BUILDER — React] (provider-facing)                 │
│   ├── Template Library (therapist / coach / lawyer / etc.) │
│   ├── Form Question Editor (static + AI follow-up config)  │
│   ├── Follow-up Rules (triggers: keywords, sentiment, etc) │
│   └── Pre-read Brief Template Customization               │
│                                                             │
│   [INTAKE FORM — React] (client-facing, embeddable)        │
│   ├── Question Display + Answer Input                      │
│   ├── Real-time Follow-up Injection (AI determines next Q) │
│   └── Completion → brief generation trigger               │
│                                                             │
│   [Backend — Python/FastAPI]                               │
│   ├── /forms         → CRUD form configurations           │
│   ├── /session/start → initialize intake session          │
│   ├── /session/answer → process answer + generate follow-ups│
│   └── /brief/{session_id} → return completed brief        │
│                                                             │
│   [AI Processing Layer]                                    │
│   ├── Follow-up Generator: answer text → follow-up Q (or none)│
│   ├── Brief Synthesizer: full session → structured brief  │
│   └── Flag Detector: identify risk/complexity indicators  │
│                                                             │
│   [Storage]                                                │
│   ├── PostgreSQL: providers, form configs, sessions        │
│   └── Redis: active session state (fast read during intake)│
│                                                             │
│   [External]                                               │
│   ├── Claude API (claude-3-haiku for follow-ups, sonnet for briefs)│
│   └── Stripe (subscription billing)                       │
└─────────────────────────────────────────────────────────────┘
```

**Follow-up Decision Prompt (runs after each answer):**
```
Given this intake question: [QUESTION]
And this client answer: [ANSWER]
Context about this client type: [PERSONA_CONTEXT]

Should a follow-up question be asked? If yes, generate one specific, concise follow-up question.
If no, respond with null.

Rules: Only ask follow-up if the answer is vague, incomplete, or reveals complexity that 
needs clarification. Maximum 2 follow-ups per original question.

Respond as JSON: {"ask_followup": true/false, "question": "..." or null}
```

**Brief Structure Output:**
```
## Client Situation Summary
[2-3 sentence synthesis of the client's core situation]

## Key Flags
- [Risk factor 1]: [Evidence from intake]
- [Complexity indicator 1]: [Evidence]

## Questions to Ask in First Call
1. [Specific question based on gaps or ambiguities in the intake]
2. ...
3. ...

## Background Context
[Relevant background the provider should know before the call]
```

## Week-by-Week Build Plan

**Week 1: Template-Based Form Builder + Follow-up Engine**
- Design 5 starter templates: therapist initial intake, business coach discovery call, freelance consultant project scope, financial advisor first meeting, attorney client intake
- Build form configuration schema (questions, types, AI follow-up enabled/disabled per question)
- Implement the follow-up decision API: answer in → follow-up question out (or null)
- Test on 20 simulated client answers to validate follow-up quality and false positive rate
- Build basic form renderer (client-facing): shows questions, injects follow-ups dynamically

**Week 2: Brief Synthesizer + Provider Dashboard**
- Build brief generation pipeline: full session transcript → structured brief
- Provider dashboard: list of completed intakes, brief viewer, date/client filters
- Form embed code generator (iframe or JavaScript snippet for embedding in provider websites)
- Email notification to provider when intake is completed (with brief summary)
- Test with 3 volunteer service providers (therapists, coaches from personal network or communities)

**Week 3: Builder UI + Billing**
- Form builder UI: question editor, follow-up configuration, template selection, preview mode
- Stripe integration: $29/mo (up to 10 active forms) and $79/mo (unlimited + team)
- Account management: provider login, form library management
- Embeddable form styling customization (match provider's website colors)

**Week 4: Beta Launch**
- Record demo video (walk through a coach's intake setup → client completing form → provider viewing brief)
- Land 5 beta customers via direct outreach to service professionals
- Product Hunt launch
- Set up feedback collection (Canny or Typeform)

## API & Tool Stack

| Service | Purpose | Cost Estimate |
|---------|---------|---------------|
| Claude API (claude-3-haiku) | Follow-up Q generation (per answer, real-time) | ~$0.0001 per follow-up decision (haiku is 25x cheaper than sonnet) |
| Claude API (claude-3-5-sonnet) | Brief synthesis (once per session) | ~$0.02–0.05 per completed brief |
| PostgreSQL (Railway) | Form configs, sessions, briefs | $5/mo |
| Redis (Upstash) | Active session state | Free tier |
| Stripe | Subscription billing | 2.9% + $0.30 |
| Render | Backend | $7/mo |
| Vercel | Frontend | Free |
| **Per-session API cost** | | ~$0.03–0.08 total (follow-ups + brief) |
| **At $29/mo for 10 forms, 100 sessions/mo** | | $3–8 API costs vs. $29 revenue → healthy |

**Latency consideration:** Follow-up question generation must be fast (<2 seconds). Claude-3-haiku achieves this reliably. The brief synthesis (sonnet) runs asynchronously after form completion — latency doesn't matter.

## Monetization Implementation

**Pricing:**
```
Starter              Professional         Team
───────              ────────────         ────
$29/month            $79/month            Contact us
Up to 10 forms       Unlimited forms      Multi-provider
Unlimited intakes    Team member access   White-label
Email notifications  Priority support     Custom integrations
```

**Onboarding Flow:**
1. Provider signs up → selects their profession (therapist / coach / consultant / lawyer / other)
2. Pre-loaded template for their profession appears immediately
3. One-click "activate this form" → gets embed code
4. 14-day free trial (credit card required to prevent abuse)
5. Upgrade prompt when: form submitted 10+ times (success signal) or approaching trial end

**Trial Hook:** The embed code works during free trial, giving the provider a live form they can send to actual clients during the trial period. They experience real value (seeing the brief) before they pay.

## Launch Strategy

**Where to Post:**
1. Therapist communities: Therapist Directory communities, Therapy Den, Facebook groups for private practice therapists
2. Business coach communities: ICF (International Coaching Federation) forums, coach Facebook groups
3. Freelance consultant communities: Consultants Collective, r/consulting
4. Product Hunt (time for maximum traffic — 12:01 AM PST Tuesday)
5. LinkedIn: publish "I analyzed 100 client intake forms — here's what they all miss" article

**Cold Outreach — Service Providers:**
```
Subject: Your clients are showing up underprepared — this fixes it

Hi [Name],

I've built an intake form tool that asks your clients smart follow-up questions 
based on their answers (instead of a static form), then summarizes their responses 
into a pre-read brief for you before the call.

The result: you walk into every first call knowing exactly who you're talking to 
and what they need.

Would you test it with 5 clients this week? Free trial, 5 minutes to set up.
[URL]
```

**First 10 Customers Path:**
1. Direct DMs to 30 therapists/coaches in private practice (LinkedIn + Twitter)
2. Post in 3 coaching/therapy Facebook groups with a value-first post ("here's what great client intake looks like")
3. Offer to personally help set up the first form for the first 5 beta users (done-for-you onboarding)
4. Ask beta users for referrals to their professional peer groups (therapists know other therapists)

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Form builder UI scope creep — building a full drag-and-drop builder takes 8+ weeks** | High | High | MVP uses template-based forms only (not a builder) — providers select a template and edit the question text. The drag-and-drop builder is V1. This constraint is explicitly communicated in the MVP and is actually a feature (faster setup than a full builder). |
| **Follow-up latency kills UX — clients abandon forms that feel slow** | Medium | High | claude-3-haiku achieves 400–800ms response times. Pre-generate follow-up questions on the previous answer submission (start processing while user reads the next question). Add a subtle loading indicator ("Preparing your next question...") for cases over 1 second. |
| **HIPAA compliance requirement from therapist early customers** | Medium | Medium | MVP explicitly excludes healthcare (HIPAA-regulated) providers from initial launch — target coaches, consultants, and lawyers first. Healthcare tier with HIPAA BAA is a V2 feature requiring AWS HIPAA-eligible services and legal review. Communicate clearly in onboarding. |
