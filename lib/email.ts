import { Resend } from 'resend'

/**
 * Escapes characters with special meaning in HTML to prevent XSS / script injection in email clients.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitizes attachment filename:
 * - Strips directory traversal / path separators (/ and \)
 * - Strips control characters
 * - Caps length to 150 characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'document'
  const clean = filename
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
  return clean.slice(0, 150) || 'document'
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export interface CandidateRegistrationEmailData {
  fullName: string
  phone: string
  email: string
  age: number | string
  location: string
  education: string
  position: string
  experience: string
  submittedAt: Date
  ip: string
}

export interface DocumentAttachment {
  filename: string
  content: Buffer
}

/**
 * Sends a candidate registration notification email with attachment to JD Outsourcing HR.
 */
export async function sendRegistrationEmail(
  data: CandidateRegistrationEmailData,
  attachment: DocumentAttachment
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return {
      success: false,
      error: 'Email service misconfigured: RESEND_API_KEY is not set.',
    }
  }

  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  const toEmail = process.env.RECIPIENT_EMAIL || 'jdoutsourcingconsultingltd@yahoo.com'
  const cleanFilename = sanitizeFilename(attachment.filename)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0d1e22; background-color: #f7f9f9; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 6px; border: 1px solid #e1e8e8; overflow: hidden; }
          .header { background: #0c1c20; color: #ffffff; padding: 24px; }
          .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #9bc6c7; }
          .content { padding: 24px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #edf2f2; font-size: 14px; }
          .data-table th { width: 35%; color: #4e7375; font-weight: 600; background: #fafcfc; }
          .data-table td { color: #0d1e22; }
          .footer { padding: 16px 24px; background: #fafcfc; border-top: 1px solid #edf2f2; font-size: 12px; color: #769697; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Candidate Registration</h2>
            <p>JD Outsourcing &amp; Consulting Ltd Staff Recruitment System</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0;">A new candidate registration has been submitted:</p>
            <table class="data-table">
              <tr><th>Full Name</th><td><strong>${escapeHtml(data.fullName)}</strong></td></tr>
              <tr><th>Position of Interest</th><td>${escapeHtml(data.position)}</td></tr>
              <tr><th>Education Level</th><td>${escapeHtml(data.education)}</td></tr>
              <tr><th>Years of Experience</th><td>${escapeHtml(data.experience)}</td></tr>
              <tr><th>Email Address</th><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
              <tr><th>Phone Number</th><td>${escapeHtml(data.phone)}</td></tr>
              <tr><th>Age</th><td>${escapeHtml(data.age)}</td></tr>
              <tr><th>Current Location</th><td>${escapeHtml(data.location)}</td></tr>
              <tr><th>CV / Document</th><td>${escapeHtml(cleanFilename)} (attached)</td></tr>
              <tr><th>Submission Time</th><td>${escapeHtml(data.submittedAt.toUTCString())}</td></tr>
              <tr><th>Client IP</th><td>${escapeHtml(data.ip)}</td></tr>
            </table>
          </div>
          <div class="footer">
            Sent automatically by JD Outsourcing candidate portal.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    let res = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: data.email,
      subject: `New staff registration — ${data.fullName}`,
      html: htmlContent,
      attachments: [
        {
          filename: cleanFilename,
          content: attachment.content,
        },
      ],
    })

    // If Resend is running in trial mode with default 'onboarding@resend.dev',
    // Resend restricts delivery to the account owner's email address until a domain is verified.
    if (res.error && (res.error as any).statusCode === 403 && (res.error as any).message?.includes('only send testing emails')) {
      const match = (res.error as any).message.match(/\(([^)]+)\)/)
      const fallbackTo = match ? match[1] : 'allisonfezyy@gmail.com'
      console.warn(`[Resend Sandbox] Retrying delivery to verified test recipient: ${fallbackTo}`)
      res = await resend.emails.send({
        from: fromEmail,
        to: fallbackTo,
        reply_to: data.email,
        subject: `[JD Outsourcing - Target: ${toEmail}] New staff registration — ${data.fullName}`,
        html: `<div style="padding:10px 14px;background:#fff3cd;color:#856404;border-bottom:1px solid #ffeeba;margin-bottom:15px;font-size:12px;font-family:sans-serif;"><strong>Resend Test Mode Note:</strong> Target recipient was <code>${toEmail}</code>. Delivered to verified address <code>${fallbackTo}</code>. To send directly to yahoo/corporate emails, verify your domain at resend.com.</div>` + htmlContent,
        attachments: [
          {
            filename: cleanFilename,
            content: attachment.content,
          },
        ],
      })
    }

    if (res.error) {
      console.error('[Resend] Registration email error:', res.error)
      return { success: false, error: res.error.message || 'Resend failed to deliver registration email' }
    }

    return { success: true }
  } catch (err) {
    console.error('[Resend] Registration email exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email provider failure',
    }
  }
}

export interface QuestionResultItem {
  prompt: string
  candidateAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export interface CandidateTestEmailData {
  fullName: string
  email: string
  position: string
  level: string
  correct: number
  total: number
  percentage: number
  breakdown: QuestionResultItem[]
  submittedAt: Date
  ip: string
}

/**
 * Sends aptitude test results and full scoring breakdown to JD Outsourcing HR.
 */
export async function sendTestResultEmail(
  data: CandidateTestEmailData
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return {
      success: false,
      error: 'Email service misconfigured: RESEND_API_KEY is not set.',
    }
  }

  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  const toEmail = process.env.RECIPIENT_EMAIL || 'jdoutsourcingconsultingltd@yahoo.com'

  const breakdownRows = data.breakdown
    .map(
      (item, idx) => `
      <tr style="background-color: ${item.isCorrect ? '#f0f9f7' : '#fff5f5'};">
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px;">
          <strong>0${idx + 1}.</strong> ${escapeHtml(item.prompt)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; color: ${item.isCorrect ? '#0d6854' : '#c53030'};">
          ${escapeHtml(item.candidateAnswer)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; color: #2d3748;">
          ${escapeHtml(item.correctAnswer)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; font-weight: bold; text-align: center; color: ${item.isCorrect ? '#0d6854' : '#c53030'};">
          ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </td>
      </tr>
    `
    )
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0d1e22; background-color: #f7f9f9; margin: 0; padding: 24px; }
          .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 6px; border: 1px solid #e1e8e8; overflow: hidden; }
          .header { background: #0c1c20; color: #ffffff; padding: 24px; }
          .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #9bc6c7; }
          .content { padding: 24px; }
          .score-card { background: #f0f7f7; border: 1px solid #d2e4e4; border-radius: 6px; padding: 18px; margin-bottom: 20px; text-align: center; }
          .score-number { font-size: 32px; font-weight: 700; color: #0c5647; margin: 4px 0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .table th, .table td { padding: 10px; text-align: left; font-size: 13px; }
          .table th { background: #fafcfc; color: #4e7375; font-weight: 600; border-bottom: 1px solid #edf2f2; }
          .footer { padding: 16px 24px; background: #fafcfc; border-top: 1px solid #edf2f2; font-size: 12px; color: #769697; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Aptitude Assessment Result</h2>
            <p>JD Outsourcing &amp; Consulting Ltd Staff Recruitment System</p>
          </div>
          <div class="content">
            <div class="score-card">
              <div style="font-size: 13px; color: #4e7375; text-transform: uppercase; letter-spacing: 0.05em;">Final Score</div>
              <div class="score-number">${data.correct} / ${data.total} (${data.percentage}%)</div>
              <div style="font-size: 14px; color: #2d3748;">Candidate: <strong>${escapeHtml(data.fullName)}</strong> · Level: <strong>${escapeHtml(data.level)}</strong></div>
            </div>

            <h3 style="font-size: 15px; margin: 20px 0 8px;">Candidate Details</h3>
            <table class="table" style="margin-bottom: 24px;">
              <tr><td style="width: 30%; color: #4e7375;"><strong>Candidate Name</strong></td><td>${escapeHtml(data.fullName)}</td></tr>
              <tr><td style="color: #4e7375;"><strong>Email</strong></td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
              <tr><td style="color: #4e7375;"><strong>Position Applied</strong></td><td>${escapeHtml(data.position)}</td></tr>
              <tr><td style="color: #4e7375;"><strong>Assessment Level</strong></td><td>${escapeHtml(data.level)}</td></tr>
              <tr><td style="color: #4e7375;"><strong>Submission Time</strong></td><td>${escapeHtml(data.submittedAt.toUTCString())}</td></tr>
              <tr><td style="color: #4e7375;"><strong>Client IP</strong></td><td>${escapeHtml(data.ip)}</td></tr>
            </table>

            <h3 style="font-size: 15px; margin: 20px 0 8px;">Question Breakdown</h3>
            <table class="table" style="border: 1px solid #edf2f2;">
              <thead>
                <tr>
                  <th style="width: 45%;">Question</th>
                  <th style="width: 25%;">Candidate Selected</th>
                  <th style="width: 20%;">Correct Answer</th>
                  <th style="width: 10%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${breakdownRows}
              </tbody>
            </table>
          </div>
          <div class="footer">
            Sent automatically by JD Outsourcing candidate portal.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    let res = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: data.email,
      subject: `Aptitude test result — ${data.fullName} (${data.correct}/${data.total})`,
      html: htmlContent,
    })

    if (res.error && (res.error as any).statusCode === 403 && (res.error as any).message?.includes('only send testing emails')) {
      const match = (res.error as any).message.match(/\(([^)]+)\)/)
      const fallbackTo = match ? match[1] : 'allisonfezyy@gmail.com'
      console.warn(`[Resend Sandbox] Retrying test result delivery to verified test recipient: ${fallbackTo}`)
      res = await resend.emails.send({
        from: fromEmail,
        to: fallbackTo,
        reply_to: data.email,
        subject: `[JD Outsourcing - Target: ${toEmail}] Aptitude test result — ${data.fullName} (${data.correct}/${data.total})`,
        html: `<div style="padding:10px 14px;background:#fff3cd;color:#856404;border-bottom:1px solid #ffeeba;margin-bottom:15px;font-size:12px;font-family:sans-serif;"><strong>Resend Test Mode Note:</strong> Target recipient was <code>${toEmail}</code>. Delivered to verified address <code>${fallbackTo}</code>. To send directly to yahoo/corporate emails, verify your domain at resend.com.</div>` + htmlContent,
      })
    }

    if (res.error) {
      console.error('[Resend] Test result email error:', res.error)
      return { success: false, error: res.error.message || 'Resend failed to deliver assessment result email' }
    }

    return { success: true }
  } catch (err) {
    console.error('[Resend] Test result email exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email provider failure',
    }
  }
}

export interface CombinedEmailData {
  fullName: string
  phone?: string
  email: string
  age?: number | string
  location?: string
  education?: string
  position: string
  experience?: string
  registeredAt?: Date
  level: string
  correct: number
  total: number
  percentage: number
  breakdown: QuestionResultItem[]
  submittedAt: Date
  ip: string
}

/**
 * Sends a single unified email combining full candidate registration details, CV document attachment,
 * and complete aptitude assessment score breakdown to JD Outsourcing HR.
 */
export async function sendCombinedRegistrationAndTestEmail(
  data: CombinedEmailData,
  attachment?: DocumentAttachment | null
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    return {
      success: false,
      error: 'Email service misconfigured: RESEND_API_KEY is not set.',
    }
  }

  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  const toEmail = process.env.RECIPIENT_EMAIL || 'jdoutsourcingconsultingltd@yahoo.com'
  const cleanFilename = attachment ? sanitizeFilename(attachment.filename) : ''

  const breakdownRows = data.breakdown
    .map(
      (item, idx) => `
      <tr style="background-color: ${item.isCorrect ? '#f0f9f7' : '#fff5f5'};">
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px;">
          <strong>0${idx + 1}.</strong> ${escapeHtml(item.prompt)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; color: ${item.isCorrect ? '#0d6854' : '#c53030'};">
          ${escapeHtml(item.candidateAnswer)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; color: #2d3748;">
          ${escapeHtml(item.correctAnswer)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e1e8e8; font-size: 13px; font-weight: bold; text-align: center; color: ${item.isCorrect ? '#0d6854' : '#c53030'};">
          ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </td>
      </tr>
    `
    )
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0d1e22; background-color: #f7f9f9; margin: 0; padding: 24px; }
          .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 6px; border: 1px solid #e1e8e8; overflow: hidden; }
          .header { background: #0c1c20; color: #ffffff; padding: 24px; }
          .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #9bc6c7; }
          .content { padding: 24px; }
          .score-card { background: #f0f7f7; border: 1px solid #d2e4e4; border-radius: 6px; padding: 18px; margin-bottom: 24px; text-align: center; }
          .score-number { font-size: 34px; font-weight: 700; color: #0c5647; margin: 4px 0; }
          .section-title { font-size: 15px; font-weight: 700; color: #0c1c20; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0c1c20; text-transform: uppercase; letter-spacing: 0.04em; }
          .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .table th, .table td { padding: 10px; text-align: left; font-size: 13px; }
          .table th { background: #fafcfc; color: #4e7375; font-weight: 600; border-bottom: 1px solid #edf2f2; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #edf2f2; font-size: 13px; }
          .data-table th { width: 35%; color: #4e7375; font-weight: 600; background: #fafcfc; }
          .data-table td { color: #0d1e22; }
          .footer { padding: 16px 24px; background: #fafcfc; border-top: 1px solid #edf2f2; font-size: 12px; color: #769697; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Candidate Staff Registration &amp; Aptitude Assessment</h2>
            <p>JD Outsourcing &amp; Consulting Ltd Staff Recruitment System</p>
          </div>
          <div class="content">
            <div class="score-card">
              <div style="font-size: 13px; color: #4e7375; text-transform: uppercase; letter-spacing: 0.05em;">Aptitude Assessment Score</div>
              <div class="score-number">${data.correct} / ${data.total} (${data.percentage}%)</div>
              <div style="font-size: 14px; color: #2d3748;">Level: <strong>${escapeHtml(data.level)}</strong> · Position: <strong>${escapeHtml(data.position)}</strong></div>
            </div>

            <div class="section-title">Candidate Profile &amp; Registration Details</div>
            <table class="data-table">
              <tr><th>Full Name</th><td><strong>${escapeHtml(data.fullName)}</strong></td></tr>
              <tr><th>Email Address</th><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
              ${data.phone ? `<tr><th>Phone Number</th><td>${escapeHtml(data.phone)}</td></tr>` : ''}
              ${data.position ? `<tr><th>Applied Position</th><td>${escapeHtml(data.position)}</td></tr>` : ''}
              ${data.education ? `<tr><th>Education Level</th><td>${escapeHtml(data.education)}</td></tr>` : ''}
              ${data.experience ? `<tr><th>Years of Experience</th><td>${escapeHtml(data.experience)}</td></tr>` : ''}
              ${data.age ? `<tr><th>Age</th><td>${escapeHtml(data.age)}</td></tr>` : ''}
              ${data.location ? `<tr><th>Current Location</th><td>${escapeHtml(data.location)}</td></tr>` : ''}
              ${cleanFilename ? `<tr><th>CV / Attached Document</th><td><strong>${escapeHtml(cleanFilename)}</strong> (Attached)</td></tr>` : ''}
              <tr><th>Submission Time</th><td>${escapeHtml(data.submittedAt.toUTCString())}</td></tr>
              <tr><th>Candidate Client IP</th><td>${escapeHtml(data.ip)}</td></tr>
            </table>

            <div class="section-title">Aptitude Assessment Breakdown</div>
            <table class="table" style="border: 1px solid #edf2f2;">
              <thead>
                <tr>
                  <th style="width: 45%;">Question</th>
                  <th style="width: 25%;">Candidate Selected</th>
                  <th style="width: 20%;">Correct Answer</th>
                  <th style="width: 10%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${breakdownRows}
              </tbody>
            </table>
          </div>
          <div class="footer">
            Sent automatically by JD Outsourcing candidate portal upon test completion.
          </div>
        </div>
      </body>
    </html>
  `

  const attachments: Array<{ filename: string; content: Buffer }> = []
  if (attachment && attachment.content) {
    attachments.push({
      filename: cleanFilename,
      content: attachment.content,
    })
  }

  try {
    let res = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: data.email,
      subject: `New Registration & Assessment — ${data.fullName} (${data.correct}/${data.total} - ${data.percentage}%)`,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (res.error && (res.error as any).statusCode === 403 && (res.error as any).message?.includes('only send testing emails')) {
      const match = (res.error as any).message.match(/\(([^)]+)\)/)
      const fallbackTo = match ? match[1] : 'allisonfezyy@gmail.com'
      console.warn(`[Resend Sandbox] Retrying combined email delivery to verified test recipient: ${fallbackTo}`)
      res = await resend.emails.send({
        from: fromEmail,
        to: fallbackTo,
        reply_to: data.email,
        subject: `[JD Outsourcing - Target: ${toEmail}] New Registration & Assessment — ${data.fullName} (${data.correct}/${data.total} - ${data.percentage}%)`,
        html: `<div style="padding:10px 14px;background:#fff3cd;color:#856404;border-bottom:1px solid #ffeeba;margin-bottom:15px;font-size:12px;font-family:sans-serif;"><strong>Resend Test Mode Note:</strong> Target recipient was <code>${toEmail}</code>. Delivered to verified address <code>${fallbackTo}</code>. To send directly to yahoo/corporate emails, verify your domain at resend.com.</div>` + htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
    }

    if (res.error) {
      console.error('[Resend] Combined email error:', res.error)
      return { success: false, error: res.error.message || 'Resend failed to deliver combined registration & assessment email' }
    }

    return { success: true }
  } catch (err) {
    console.error('[Resend] Combined email exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email provider failure',
    }
  }
}

