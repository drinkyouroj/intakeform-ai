import { pgTable, pgEnum, uuid, text, timestamp, jsonb, integer, boolean, bigint } from 'drizzle-orm/pg-core'

// Enums
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trialing', 'active', 'past_due', 'canceled'])
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'abandoned'])
export const questionTypeEnum = pgEnum('question_type', ['text', 'select', 'multiselect', 'date', 'scale'])

// Providers (service professionals)
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  profession: text('profession'),
  settings: jsonb('settings').default({}),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trialing'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Form configurations
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  templateSlug: text('template_slug'),
  isActive: boolean('is_active').default(true),
  styleConfig: jsonb('style_config').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Questions within forms
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  type: questionTypeEnum('type').notNull(),
  prompt: text('prompt').notNull(),
  options: jsonb('options'),
  sortOrder: integer('sort_order').notNull(),
  aiFollowUp: jsonb('ai_follow_up').default({ enabled: true, maxFollowUps: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Intake sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').references(() => forms.id).notNull(),
  status: sessionStatusEnum('status').default('active'),
  briefStatus: text('brief_status').default('none'),
  version: integer('version').default(1),
  state: jsonb('state').default({}),
  clientMeta: jsonb('client_meta').default({}),
  resumeToken: text('resume_token').unique(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Generated briefs
export const briefs = pgTable('briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull().unique(),
  content: text('content').notNull(),
  structured: jsonb('structured').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// AI generation tracking (every LLM call)
export const generations = pgTable('generations', {
  id: text('id').primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id),
  task: text('task').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  estimatedCostMicrocents: bigint('estimated_cost_microcents', { mode: 'number' }),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
