'use client'

import { useEffect, useState } from 'react'

/**
 * IntroCurtain — Opening splash that shows the JD logo + tagline
 * for 2 seconds then slides upward off the screen.
 *
 * Usage: drop it at the very top of a page and it handles itself.
 */
export default function IntroCurtain() {
  // 'in'  → curtain visible, animating logo+tagline in
  // 'hold' → logo+tagline fully shown, reader reads for ~2 s
  // 'exit' → curtain slides up and away
  // 'gone' → component unmounts entirely
  const [phase, setPhase] = useState<'in' | 'hold' | 'exit' | 'gone'>('in')

  useEffect(() => {
    // After logo + tagline finish fading in (~0.95 s total stagger),
    // hold for 2 s so the reader has time to read the tagline.
    const holdTimer = setTimeout(() => setPhase('exit'), 950 + 2000)
    return () => clearTimeout(holdTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'exit') return
    // Wait for the curtain exit animation (0.65 s) then unmount.
    const doneTimer = setTimeout(() => setPhase('gone'), 700)
    return () => clearTimeout(doneTimer)
  }, [phase])

  if (phase === 'gone') return null

  return (
    <div className={`intro-curtain${phase === 'exit' ? ' exit' : ''}`} aria-hidden="true">
      {/* Logo */}
      <div className="curtain-logo flex flex-col items-center gap-4">
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 20,
            overflow: 'hidden',
            border: '2px solid rgba(169,196,203,0.25)',
            background: 'rgba(255,255,255,0.05)',
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/images/jd-logo.png"
            alt="JD Outsourcing & Consulting Ltd"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
          <p
            style={{
              margin: 0,
              color: '#F5F7F6',
              fontFamily: 'var(--font-plex), system-ui, sans-serif',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            JD OUTSOURCING
          </p>
          <p
            style={{
              margin: 0,
              color: '#A9C4CB',
              fontFamily: 'var(--font-plex), system-ui, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            &amp; CONSULTING LTD
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 36,
          background: 'linear-gradient(to bottom, transparent, #A9C4CB55, transparent)',
        }}
        className="curtain-tagline"
      />

      {/* Tagline */}
      <p
        className="curtain-tagline"
        style={{
          margin: 0,
          color: '#A9C4CB',
          fontFamily: 'var(--font-fraunces), serif',
          fontSize: 'clamp(1.1rem, 3vw, 1.55rem)',
          fontStyle: 'italic',
          fontWeight: 400,
          letterSpacing: '0.01em',
          textAlign: 'center',
          maxWidth: 420,
          padding: '0 1.5rem',
          lineHeight: 1.5,
        }}
      >
        We Recruit. We Train. We Employ.
      </p>
    </div>
  )
}
