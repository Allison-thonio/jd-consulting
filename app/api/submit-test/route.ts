import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { getQuestionsFor } from '@/lib/questions'
import { sendCombinedRegistrationAndTestEmail } from '@/lib/email'
import { logTestResultToDb } from '@/lib/mongodb'
import { getRegistrationByEmail } from '@/lib/registration-store'

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

  // 2. Parse and Validate Request Body (supports multipart/form-data or application/json)
  const contentType = req.headers.get('content-type') || ''
  let fullName = ''
  let email = ''
  let position = ''
  let level: 'SSCE' | 'Graduate' | null = null
  let answers: Record<string, unknown> = {}
  let directPhone: string | undefined = undefined
  let directAge: number | string | undefined = undefined
  let directLocation: string | undefined = undefined
  let directEducation: string | undefined = undefined
  let directExperience: string | undefined = undefined
  let directAttachment: { filename: string; content: Buffer } | null = null

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid form data payload. Unable to process test submission.' },
        { status: 400 }
      )
    }

    fullName = String(formData.get('fullName') || '').trim().slice(0, 100)
    email = String(formData.get('email') || '').trim().slice(0, 254)
    position = String(formData.get('position') || '').trim().slice(0, 100)
    const rawLevel = String(formData.get('level') || '')
    level = rawLevel === 'SSCE' || rawLevel === 'Graduate' ? rawLevel : null

    const rawAnswers = formData.get('answers')
    if (typeof rawAnswers === 'string') {
      try {
        answers = JSON.parse(rawAnswers)
      } catch {
        answers = {}
      }
    }

    directPhone = typeof formData.get('phone') === 'string' ? String(formData.get('phone')).trim() : undefined
    const rawAge = formData.get('age')
    if (rawAge) directAge = String(rawAge)
    directLocation = typeof formData.get('location') === 'string' ? String(formData.get('location')).trim() : undefined
    directEducation = typeof formData.get('education') === 'string' ? String(formData.get('education')).trim() : undefined
    directExperience = typeof formData.get('experience') === 'string' ? String(formData.get('experience')).trim() : undefined

    const docEntry = formData.get('document')
    if (docEntry && docEntry instanceof File && docEntry.size > 0) {
      try {
        const arrayBuf = await docEntry.arrayBuffer()
        directAttachment = {
          filename: docEntry.name,
          content: Buffer.from(arrayBuf),
        }
        console.log(`[SubmitTest] Received direct file attachment in formData: ${docEntry.name} (${docEntry.size} bytes)`)
      } catch (err) {
        console.error('[SubmitTest] Error reading direct file attachment from formData:', err)
      }
    }
  } else {
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

    fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 100) : ''
    email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
    position = typeof body.position === 'string' ? body.position.trim().slice(0, 100) : ''
    level = body.level === 'SSCE' || body.level === 'Graduate' ? body.level : null
    answers = (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)) ? (body.answers as Record<string, unknown>) : {}

    directPhone = typeof (body as any).phone === 'string' ? (body as any).phone : undefined
    directAge = (body as any).age
    directLocation = typeof (body as any).location === 'string' ? (body as any).location : undefined
    directEducation = typeof (body as any).education === 'string' ? (body as any).education : undefined
    directExperience = typeof (body as any).experience === 'string' ? (body as any).experience : undefined

    if (typeof (body as any).documentBase64 === 'string' && typeof (body as any).documentFilename === 'string') {
      try {
        directAttachment = {
          filename: (body as any).documentFilename,
          content: Buffer.from((body as any).documentBase64, 'base64'),
        }
        console.log(`[SubmitTest] Received direct base64 attachment in JSON: ${(body as any).documentFilename}`)
      } catch (e) {
        console.error('[SubmitTest] Error parsing base64 document in JSON:', e)
      }
    }
  }

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

  // 4. Retrieve candidate registration details (including uploaded CV document)
  // First priority: direct values from the submission payload
  // Second priority: lookup from registration store (disk cache / memory / MongoDB)
  const registration = await getRegistrationByEmail(email, clientIp)

  const candidateFullName = fullName || registration?.fullName || 'Candidate'
  const candidatePosition = position || registration?.position || 'Applicant'
  const candidatePhone = directPhone || registration?.phone || ''
  const candidateAge = directAge || registration?.age || ''
  const candidateLocation = directLocation || registration?.location || ''
  const candidateEducation = directEducation || registration?.education || level
  const candidateExperience = directExperience || registration?.experience || ''

  let attachment: { filename: string; content: Buffer } | null = directAttachment

  if (!attachment && registration && registration.documentFilename && registration.documentBuffer && registration.documentBuffer.length > 0) {
    attachment = { filename: registration.documentFilename, content: registration.documentBuffer }
  }

  if (attachment) {
    console.log(`[SubmitTest] Attachment verified for ${email}: ${attachment.filename} (${attachment.content.length} bytes)`)
  } else {
    console.warn(`[SubmitTest] No document attachment found for ${email}`)
  }

  // 5. Send Combined Results + Candidate Registration + CV attachment via Resend Email
  const emailResult = await sendCombinedRegistrationAndTestEmail(
    {
      fullName: candidateFullName,
      email,
      phone: candidatePhone,
      age: candidateAge,
      location: candidateLocation,
      education: candidateEducation,
      position: candidatePosition,
      experience: candidateExperience,
      registeredAt: registration?.submittedAt,
      level,
      correct: correctCount,
      total: totalQuestions,
      percentage,
      breakdown,
      submittedAt,
      ip: clientIp,
    },
    attachment
  )

  if (!emailResult.success) {
    return NextResponse.json(
      { error: emailResult.error || 'Failed to dispatch test assessment results to hiring team.' },
      { status: 502 }
    )
  }

  // 6. Best-effort MongoDB write (never blocks or fails the request)
  await logTestResultToDb({
    fullName: candidateFullName,
    email,
    position: candidatePosition,
    level,
    correct: correctCount,
    total: totalQuestions,
    percentage,
    breakdown,
    submittedAt,
    ip: clientIp,
  })

  // 7. Return response to candidate
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

