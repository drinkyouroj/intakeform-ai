'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getStripe } from '@/lib/stripe'

const PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL ?? '',
}

export async function createCheckoutSession(plan: 'starter' | 'professional') {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [provider] = await db.select().from(providers).where(eq(providers.clerkUserId, userId))
  if (!provider) throw new Error('Provider not found')

  const stripe = getStripe()

  // Get or create Stripe customer
  let customerId = provider.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: provider.email,
      name: provider.name,
      metadata: { providerId: provider.id, clerkUserId: userId },
    })
    customerId = customer.id
    await db.update(providers)
      .set({ stripeCustomerId: customerId })
      .where(eq(providers.id, provider.id))
  }

  const priceId = PRICES[plan]
  if (!priceId) throw new Error(`Price not configured for plan: ${plan}`)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`,
  })

  redirect(session.url!)
}

export async function createPortalSession() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const db = getDb()
  const [provider] = await db.select().from(providers).where(eq(providers.clerkUserId, userId))
  if (!provider?.stripeCustomerId) throw new Error('No Stripe customer')

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: provider.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`,
  })

  redirect(session.url)
}
