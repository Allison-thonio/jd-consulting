import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { savePendingRegistration } from '@/lib/registration-store'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+]?[\d\s-]{7,20}$/

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
])

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream'])

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : ''
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 5 requests per IP per 10 minutes (600 seconds)
  const clientIp = getClientIp(req)
  const rateLimitResult = await checkRateLimit(`register:${clientIp}`, 5, 600)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many registration requests from this IP. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000))),
        },
      }
    )
  }

  // 2. Parse Multipart Form Data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid form data. Please ensure your submission is properly formatted.' },
      { status: 400 }
    )
  }

  // Extract and silently cap field lengths
  const rawFullName = formData.get('fullName')
  const rawPhone = formData.get('phone')
  const rawEmail = formData.get('email')
  const rawAge = formData.get('age')
  const rawLocation = formData.get('location')
  const rawEducation = formData.get('education')
  const rawPosition = formData.get('position')
  const rawExperience = formData.get('experience')
  const turnstileToken = formData.get('cf-turnstile-response')
  const documentEntry = formData.get('document')

  const fullName = typeof rawFullName === 'string' ? rawFullName.trim().slice(0, 100) : ''
  const phone = typeof rawPhone === 'string' ? rawPhone.trim().slice(0, 20) : ''
  const email = typeof rawEmail === 'string' ? rawEmail.trim().slice(0, 254) : ''
  const location = typeof rawLocation === 'string' ? rawLocation.trim().slice(0, 100) : ''
  const position = typeof rawPosition === 'string' ? rawPosition.trim().slice(0, 100) : ''
  const education = typeof rawEducation === 'string' ? rawEducation.trim().slice(0, 30) : ''
  const experience = typeof rawExperience === 'string' ? rawExperience.trim().slice(0, 30) : ''
  const turnstileTokenStr = typeof turnstileToken === 'string' ? turnstileToken.trim() : ''

  // 3. Server-Side Turnstile Verification
  const turnstileResult = await verifyTurnstileToken(turnstileTokenStr, clientIp)
  if (!turnstileResult.ok) {
    return NextResponse.json(
      { error: 'CAPTCHA verification failed. Please refresh and try again.' },
      { status: 400 }
    )
  }

  // 4. Field Validations
  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  }

  const parsedAge = parseInt(String(rawAge || ''), 10)
  if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 70) {
    return NextResponse.json(
      { error: 'Please enter a valid age between 16 and 70.' },
      { status: 400 }
    )
  }

  if (education !== 'SSCE' && education !== 'Graduate') {
    return NextResponse.json(
      { error: 'Education level must be either SSCE or Graduate.' },
      { status: 400 }
    )
  }

  if (!location) {
    return NextResponse.json({ error: 'Current location is required.' }, { status: 400 })
  }

  if (!position) {
    return NextResponse.json({ error: 'Position of interest is required.' }, { status: 400 })
  }

  if (!experience) {
    return NextResponse.json({ error: 'Experience level is required.' }, { status: 400 })
  }

  // 5. File Validation
  if (!documentEntry || !(documentEntry instanceof File)) {
    return NextResponse.json(
      { error: 'Please attach your CV or supporting document.' },
      { status: 400 }
    )
  }

  const file = documentEntry
  if (file.size === 0) {
    return NextResponse.json(
      { error: 'Uploaded file is empty (0 bytes). Please select a valid document.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Attached document exceeds the 4MB limit.' },
      { status: 400 }
    )
  }

  const mimeType = file.type?.toLowerCase() || ''
  const ext = getFileExtension(file.name)

  const isMimeAllowed = ALLOWED_MIME_TYPES.has(mimeType)
  const isGenericMimeWithAllowedExt = GENERIC_MIME_TYPES.has(mimeType) && ALLOWED_EXTENSIONS.has(ext)

  if (!isMimeAllowed && !isGenericMimeWithAllowedExt) {
    return NextResponse.json(
      { error: 'Invalid document type. Allowed formats are PDF, JPEG, JPG, and PNG.' },
      { status: 400 }
    )
  }

  // Read file content
  let fileBuffer: Buffer
  try {
    const arrayBuf = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuf)
  } catch (err) {
    return NextResponse.json(
      { error: 'Unable to read the uploaded document. Please re-select the file.' },
      { status: 400 }
    )
  }

  const submittedAt = new Date()

  // 6. Save registration details and CV document to store (to be combined in email upon test completion)
  await savePendingRegistration({
    fullName,
    phone,
    email,
    age: parsedAge,
    location,
    education: education as 'SSCE' | 'Graduate',
    position,
    experience,
    documentFilename: file.name,
    documentBuffer: fileBuffer,
    submittedAt,
    ip: clientIp,
  })

  // 7. Respond with 200 Success
  return NextResponse.json({ success: true, message: 'Registration saved. Please complete the assessment.' }, { status: 200 })
}

