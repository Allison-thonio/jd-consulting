let hasLoggedTurnstileWarning = false

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

/**
 * Verifies a Cloudflare Turnstile CAPTCHA response token server-side.
 * 
 * If TURNSTILE_SECRET_KEY is not configured in the environment, verification is skipped
 * with a single startup/first-run warning logged. This allows local development without
 * breaking, while maintaining strict server-side protection in production.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ ok: boolean; reason?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    if (!hasLoggedTurnstileWarning) {
      console.warn(
        '[Security Warning] TURNSTILE_SECRET_KEY is unset in environment variables. ' +
        'CAPTCHA verification is currently bypassed in dev-mode fallback. ' +
        'Set TURNSTILE_SECRET_KEY in production to enforce bot protection.'
      )
      hasLoggedTurnstileWarning = true
    }
    return { ok: true }
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { ok: false, reason: 'CAPTCHA token is missing or invalid' }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token.trim())
    if (remoteIp && remoteIp !== 'unknown') {
      formData.append('remoteip', remoteIp)
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!res.ok) {
      return { ok: false, reason: `Turnstile verification request failed with status ${res.status}` }
    }

    const data = (await res.json()) as TurnstileVerifyResponse

    if (data.success) {
      return { ok: true }
    } else {
      const errorCodes = data['error-codes']?.join(', ') || 'Verification failed'
      return { ok: false, reason: errorCodes }
    }
  } catch (err) {
    console.error('[Turnstile] Error during verification fetch:', err)
    return { ok: false, reason: 'Turnstile verification service unreachable' }
  }
}
