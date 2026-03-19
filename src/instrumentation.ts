export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[IntakeForm.ai] Server runtime initialized')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[IntakeForm.ai] Edge runtime initialized')
  }
}
