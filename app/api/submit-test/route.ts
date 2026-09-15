import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { getQuestionsFor } from '@/lib/questions'
import { sendTestResultEmail } from '@/lib/email'
import { logTestResultToDb } from '@/lib/mongodb'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SubmitTestPayload {
  fullName?: string
  email?: string
  position?: string
  level?: string
  answers?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 10 requests per IP per 10 minutes (600 seconds)
  const clientIp = getClientIp(req)
  const rateLimitResult = await checkRateLimit(`submit-test:${clientIp}`, 10, 600)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many test submission attempts from this IP. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000))),
        },
      }
    )
  }

  // 2. Parse and Validate JSON Body
  let body: SubmitTestPayload
  try {
    body = await req.json()
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON payload. Unable to process test submission.' },
      { status: 400 }
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Invalid request body format.' },
      { status: 400 }
    )
  }

  const rawFullName = body.fullName
  const rawEmail = body.email
  const rawPosition = body.position
  const rawLevel = body.level
  const answers = body.answers

  const fullName = typeof rawFullName === 'string' ? rawFullName.trim().slice(0, 100) : ''
  const email = typeof rawEmail === 'string' ? rawEmail.trim().slice(0, 254) : ''
  const position = typeof rawPosition === 'string' ? rawPosition.trim().slice(0, 100) : ''
  const level = rawLevel === 'SSCE' || rawLevel === 'Graduate' ? rawLevel : null

  if (!fullName) {
    return NextResponse.json({ error: 'Candidate name is required.' }, { status: 400 })
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Valid candidate email is required.' }, { status: 400 })
  }

  if (!position) {
    return NextResponse.json({ error: 'Applied position is required.' }, { status: 400 })
  }

  if (!level) {
    return NextResponse.json(
      { error: "Assessment level must be either 'SSCE' or 'Graduate'." },
      { status: 400 }
    )
  }

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return NextResponse.json(
      { error: 'Answers must be provided as a key-value mapping.' },
      { status: 400 }
    )
  }

  // 3. Server-Side Re-scoring
  // Load official question bank for the verified level
  const questions = getQuestionsFor(level)
  let correctCount = 0

  const breakdown = questions.map((q) => {
    const rawAnswer = answers[q.id]
    const isIntegerIndex =
      typeof rawAnswer === 'number' &&
      Number.isInteger(rawAnswer) &&
      rawAnswer >= 0 &&
      rawAnswer < q.options.length

    let candidateAnswerText = 'No answer / Invalid selection'
    let isCorrect = false

    if (isIntegerIndex) {
      candidateAnswerText = q.options[rawAnswer] || 'Invalid selection'
      isCorrect = rawAnswer === q.answerIndex
      if (isCorrect) {
        correctCount++
      }
    }

    const correctAnswerText = q.options[q.answerIndex] || 'Unknown'

    return {
      prompt: q.prompt,
      candidateAnswer: candidateAnswerText,
      correctAnswer: correctAnswerText,
      isCorrect,
    }
  })

  const totalQuestions = questions.length
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const submittedAt = new Date()

  // 4. Send Results via Resend Email
  const emailResult = await sendTestResultEmail({
    fullName,
    email,
    position,
    level,
    correct: correctCount,
    total: totalQuestions,
    percentage,
    breakdown,
    submittedAt,
    ip: clientIp,
  })

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || 'Failed to dispatch test assessment results to hiring team.' },
      { status: 502 }
    )
  }

  // 5. Best-effort MongoDB write (never blocks or fails the request)
  await logTestResultToDb({
    fullName,
    email,
    position,
    level,
    correct: correctCount,
    total: totalQuestions,
    percentage,
    breakdown,
    submittedAt,
    ip: clientIp,
  })

  // 6. Return response to candidate
  return NextResponse.json(
    {
      success: true,
      correct: correctCount,
      total: totalQuestions,
      percentage,
    },
    { status: 200 }
  )
}
