# Changelog

## [0.1.0](https://github.com/drinkyouroj/intakeform-ai/compare/v0.0.1...v0.1.0) (2026-03-19)


### Features

* add cron jobs for session abandonment and brief retry ([a51f622](https://github.com/drinkyouroj/intakeform-ai/commit/a51f62268c6572097f8033e3a038e04e93e278cb))
* add shadcn/ui, Geist font fix, next-themes, Framer Motion ([68c21fa](https://github.com/drinkyouroj/intakeform-ai/commit/68c21fa81b0ef0611a8109132436d293a3f9b58b))
* **ai:** add configurable model config and prompt templates ([14fe8ec](https://github.com/drinkyouroj/intakeform-ai/commit/14fe8ec618f910bfe23c61e0b6db9de0d6947a75))
* **ai:** add follow-up generation pipeline with AI SDK v6 and generation tracking ([392d807](https://github.com/drinkyouroj/intakeform-ai/commit/392d80792305d989cdf4fc23f09be2fa8048495a))
* **auth:** add Clerk integration with proxy, sign-in/sign-up pages ([304cc86](https://github.com/drinkyouroj/intakeform-ai/commit/304cc8665cc241087ec252462155ba50ae36eed3))
* **billing:** add Stripe integration with checkout, webhooks, portal ([c6005ca](https://github.com/drinkyouroj/intakeform-ai/commit/c6005ca8fef32fac675b80c2057ef77679ae921d))
* **brief:** add brief synthesis and flag detection pipelines with async generation ([442a425](https://github.com/drinkyouroj/intakeform-ai/commit/442a42566453784011b456c97885fa03106c2e4f))
* **dashboard:** add brief viewer with flag badges and metadata sidebar ([b3b7742](https://github.com/drinkyouroj/intakeform-ai/commit/b3b7742ed8f67042cbb86a79f8050e20e070687e))
* **dashboard:** add collapsible sidebar layout with subscription banners ([64e2791](https://github.com/drinkyouroj/intakeform-ai/commit/64e2791580e32d81ead85db3e6403732d491f24d))
* **dashboard:** add dashboard home with metrics, forms list, briefs list ([4507f4d](https://github.com/drinkyouroj/intakeform-ai/commit/4507f4dd869ec556631d64d7d9bfb914a8a3a691))
* **db:** add 5 starter templates with seed script ([274a29e](https://github.com/drinkyouroj/intakeform-ai/commit/274a29e056c99109a1e5fbccd9aaa895a314523b))
* **db:** add Drizzle schema with all tables, push to Neon ([ad8d4a9](https://github.com/drinkyouroj/intakeform-ai/commit/ad8d4a997b60de87a2af1aa132886716029e42d2))
* **embed:** add iframe embed system with style customization and script loader ([3909ddc](https://github.com/drinkyouroj/intakeform-ai/commit/3909ddcd6d62b33196b4e5694ce0b7ae84907bf5))
* **form-builder:** add form preview mode ([9fa30f4](https://github.com/drinkyouroj/intakeform-ai/commit/9fa30f44dd573a10c0a4489cac6f79a0a4bd1320))
* **form-builder:** add split-view form editor with drag reorder, inline editing, auto-save ([8db5434](https://github.com/drinkyouroj/intakeform-ai/commit/8db543416b8c16b8af288570ce7e7775c558d71a))
* initial commit ([43e9162](https://github.com/drinkyouroj/intakeform-ai/commit/43e9162e9edbaaf986ce683b72d23adcc19a80ba))
* **intake-form:** add client-facing intake form with AI follow-up injection and session management ([56f2a0e](https://github.com/drinkyouroj/intakeform-ai/commit/56f2a0efd572bbeb05196486b622d392614f94cd))
* **notifications:** add email notification on brief completion via Resend ([f4e81e9](https://github.com/drinkyouroj/intakeform-ai/commit/f4e81e96593b55d3d8b3b5f990a86363b6ee336e))
* **onboarding:** add 3-step provider onboarding with profession selection and template activation ([7932cbf](https://github.com/drinkyouroj/intakeform-ai/commit/7932cbf8be82793f253ee426f36a0738a32a6a41))
* Phase 0 — project scaffold with Next.js 16, shadcn, Clerk, Drizzle, CI ([e410eb2](https://github.com/drinkyouroj/intakeform-ai/commit/e410eb29925a34651815cd12ccc728d09c34aa69))
* Phase 1 — starter templates + provider onboarding flow ([5267ff6](https://github.com/drinkyouroj/intakeform-ai/commit/5267ff6e998e7639e1f30227860d3d3901e90350))
* Phase 2 — form editor with drag reorder, inline editing, auto-save, preview ([77922b2](https://github.com/drinkyouroj/intakeform-ai/commit/77922b2d4c650e25f822a02f6da9595c203434fc))
* Phase 3 — AI follow-up engine + client intake form ([f7fac1b](https://github.com/drinkyouroj/intakeform-ai/commit/f7fac1bc053ec16d022cfab47ebc33371e0ec511))
* Phase 4 — brief synthesis, provider dashboard, email notifications, cron jobs ([9ac7095](https://github.com/drinkyouroj/intakeform-ai/commit/9ac7095913a3c13f5c1d86561eb5e07c657ab232))
* Phase 5 — Stripe billing + embeddable form system ([205f32c](https://github.com/drinkyouroj/intakeform-ai/commit/205f32c51021fca30e80a12f1920910e9d4259a8))
* **session:** add session start, answer, resume routes and actions with optimistic concurrency ([b164fd5](https://github.com/drinkyouroj/intakeform-ai/commit/b164fd53c30f4c36006681f1f2fa637f12196754))


### Bug Fixes

* **ai:** install @ai-sdk/gateway and wrap model with gateway() for OIDC auth ([7ccd9c4](https://github.com/drinkyouroj/intakeform-ai/commit/7ccd9c476dc40d0f6bb7476b0b85e2a0ead00f61))
* **ai:** use plain generateText + JSON parse instead of Output.object() ([4679e56](https://github.com/drinkyouroj/intakeform-ai/commit/4679e562021b566268c71708d8ae54cbb6b37470))
* **brief:** handle array-format session state in transcript builder, add manual trigger API ([1d27402](https://github.com/drinkyouroj/intakeform-ai/commit/1d27402bbfc71f1297510ed59d4ded0367bc79c2))
* **brief:** show generating/failed state instead of 404 when brief doesn't exist yet ([4601a26](https://github.com/drinkyouroj/intakeform-ai/commit/4601a261cbc5ebe19b1cb541d5a53900757fe8bf))
* change cron schedules to daily for Hobby plan compatibility ([66d57d9](https://github.com/drinkyouroj/intakeform-ai/commit/66d57d9c88d2b2187a9aa1ae6ea46644af9e5922))
* **ci:** add packageManager field for pnpm/action-setup ([a66b203](https://github.com/drinkyouroj/intakeform-ai/commit/a66b2034ede119c2a4f8f2abcdfe2b242e5e374d))
* **embed:** derive app URL from request instead of env var for correct preview deployment URLs ([318682c](https://github.com/drinkyouroj/intakeform-ai/commit/318682c48d0c99f7ad6be91b03f0db13a26eaed6))
* **embed:** exclude /api/embed.js from Clerk middleware matcher ([2ed5dfb](https://github.com/drinkyouroj/intakeform-ai/commit/2ed5dfb458ee604a27e69b780c40815c2a5eef24))
* resolve all lint errors — unused imports, prefer-const, setState-in-effect, refs-during-render ([e7c340d](https://github.com/drinkyouroj/intakeform-ai/commit/e7c340d50470b83d37917e7cf300d01bdaf6d152))
* resolve lint errors — remove unused imports, replace useEffect state sync with key-driven remount ([c290d9d](https://github.com/drinkyouroj/intakeform-ai/commit/c290d9d236150b078549f4d403e662219e9cc9b8))
