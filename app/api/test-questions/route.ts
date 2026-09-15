import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { getQuestionsFor } from '@/lib/questions'

export async function GET(req: NextRequest) {
  // 1. Rate Limiting: 20 requests per IP per 10 minutes (600 seconds)
  const clientIp = getClientIp(req)
  const rateLimitResult = await checkRateLimit(`questions:${clientIp}`, 20, 600)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests for test questions. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000))),
        },
      }
    )
  }

  // 2. Validate Level Parameter
  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level')

  if (level !== 'SSCE' && level !== 'Graduate') {
    return NextResponse.json(
      { error: "Invalid or missing level parameter. Expected 'SSCE' or 'Graduate'." },
      { status: 400 }
    )
  }

  // 3. Load Question Bank & Strip Answer Key
  const rawQuestions = getQuestionsFor(level)

  // Explicitly map only id, prompt, and options — answerIndex must NEVER be sent to the client
  const clientQuestions = rawQuestions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
  }))

  return NextResponse.json({ questions: clientQuestions }, { status: 200 })
}
