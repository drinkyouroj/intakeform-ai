'use server'

import { getResend } from '@/lib/email'

interface BriefNotificationInput {
  providerEmail: string
  providerName: string
  formTitle: string
  sessionId: string
  briefSummary: string
}

export async function sendBriefCompletionEmail(input: BriefNotificationInput) {
  const resend = getResend()
  if (!resend) return // Skip if no API key

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://intakeform.ai'
  const briefUrl = `${appUrl}/dashboard/briefs/${input.sessionId}`

  try {
    await resend.emails.send({
      from: 'IntakeForm.ai <onboarding@resend.dev>',
      to: input.providerEmail,
      subject: `New intake completed — ${input.formTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #18181b; margin-bottom: 8px;">New Intake Completed</h2>
          <p style="color: #71717a; margin-bottom: 24px;">Hi ${input.providerName},</p>
          <p style="color: #3f3f46; line-height: 1.6;">
            A client has completed your <strong>${input.formTitle}</strong> intake form.
            Here's a quick summary:
          </p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #3f3f46; margin: 0; line-height: 1.6;">${input.briefSummary}</p>
          </div>
          <a href="${briefUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 8px;">
            View Full Brief
          </a>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">
            IntakeForm.ai — AI-powered intake forms for service professionals
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[email] Failed to send brief completion email:', error)
    // Non-fatal — don't crash brief generation
  }
}
