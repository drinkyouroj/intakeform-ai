import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getDb } from '@/lib/db'
import { providers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = getDb()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.customer) {
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
        // Check if subscription has a trial
        const subscription = session.subscription
          ? await stripe.subscriptions.retrieve(
              typeof session.subscription === 'string' ? session.subscription : session.subscription.id
            )
          : null

        const isTrial = subscription?.status === 'trialing'
        const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end * 1000) : null

        await db.update(providers)
          .set({
            subscriptionStatus: isTrial ? 'trialing' : 'active',
            trialEndsAt: trialEnd,
          })
          .where(eq(providers.stripeCustomerId, customerId))
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const statusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled'> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      }
      const newStatus = statusMap[sub.status] ?? 'active'
      await db.update(providers)
        .set({ subscriptionStatus: newStatus })
        .where(eq(providers.stripeCustomerId, customerId))
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      await db.update(providers)
        .set({ subscriptionStatus: 'canceled' })
        .where(eq(providers.stripeCustomerId, customerId))
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id
        await db.update(providers)
          .set({ subscriptionStatus: 'past_due' })
          .where(eq(providers.stripeCustomerId, customerId))
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
