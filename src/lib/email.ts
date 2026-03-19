import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      console.warn('[email] RESEND_API_KEY not set — emails will be skipped')
      return null
    }
    _resend = new Resend(key)
  }
  return _resend
}
