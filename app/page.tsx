'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ArrowUpRight, Upload, X, Phone, Mail, MapPin } from 'lucide-react'

type Question = { id: string; prompt: string; options: string[] }
type Step = 'form' | 'loading' | 'load-failed' | 'test' | 'submitting' | 'done'

const tags = [
  'Recruitment & Talent Acquisition',
  'Staff Placement',
  'Payroll Management',
  'HR Advisory & Consulting',
  'Employee Training & Development',
  'Business Process Outsourcing (BPO)',
]

const values = [
  { title: 'Integrity', desc: 'We uphold honesty, transparency, and ethical business practices.' },
  { title: 'Excellence', desc: 'We consistently deliver high-quality services that exceed client expectations.' },
  { title: 'Professionalism', desc: 'Every engagement is handled with competence, respect, and accountability.' },
  { title: 'Innovation', desc: 'We embrace modern HR practices and innovative business solutions.' },
  { title: 'Partnership', desc: 'We build long-term relationships founded on trust and mutual success.' },
  { title: 'Customer Focus', desc: 'Our clients remain at the center of every solution we provide.' },
]

const services = [
  { title: 'Human Resource Outsourcing', desc: 'Providing businesses with skilled professionals while managing HR administration efficiently.' },
  { title: 'Recruitment & Talent Acquisition', desc: 'Finding qualified candidates for permanent, temporary, and contract positions.' },
  { title: 'Executive Search', desc: 'Identifying and recruiting high-level executives and specialized professionals.' },
  { title: 'Staff Placement', desc: 'Connecting employers with competent personnel across various sectors.' },
  { title: 'Payroll Management', desc: 'Helping organizations manage employee salaries, statutory deductions, and payroll administration.' },
  { title: 'HR Advisory & Consulting', desc: 'Providing expert guidance on HR policies, compliance, organizational development, and workforce planning.' },
  { title: 'Employee Training & Development', desc: 'Organizing capacity-building programs to improve workforce productivity and leadership skills.' },
  { title: 'Performance Management', desc: 'Developing systems that improve employee performance and organizational effectiveness.' },
  { title: 'Business Process Outsourcing (BPO)', desc: 'Managing selected operational functions to help businesses reduce operational costs and improve efficiency.' },
  { title: 'Organizational Development', desc: 'Supporting organizations through restructuring, change management, and strategic workforce planning.' },
]

const industries = [
  'Oil & Gas',
  'Financial Services',
  'Retail & FMCG',
  'Construction',
  'Telecommunications',
  'Government Agencies',
  'Manufacturing',
  'Hospitality',
  'NGOs',
  'Healthcare',
  'Education',
  'Logistics & Transportation',
  'Information Technology',
]

const reasons = [
  'Experienced HR Professionals',
  'Fast Recruitment Process',
  'Tailored Business Solutions',
  'Industry Best Practices',
  'Confidentiality Guaranteed',
  'Reliable Talent Pool',
  'Cost-Effective Services',
  'Client-Centered Approach',
  'Nationwide Service Delivery',
  'Commitment to Excellence',
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/images/jd-logo.png" alt="JD Outsourcing Logo" className="h-10 w-10 object-contain" />
      <span className="text-sm font-semibold tracking-tight">
        JD Outsourcing<br />
        <span className="font-normal text-[11px] tracking-[.14em] uppercase opacity-70">& Consulting Ltd</span>
      </span>
    </div>
  )
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
    >
      {children}
    </motion.div>
  )
}

export default function Page() {
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('form')
  const [fileName, setFileName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<{ correct: number; total: number; percentage: number } | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    position: '',
    level: 'Graduate' as 'SSCE' | 'Graduate',
  })

  const level = () => ((new FormData(formRef.current!).get('education') as string) === 'SSCE' ? 'SSCE' : 'Graduate') as 'SSCE' | 'Graduate'

  async function loadQuestions(selectedLevel = formData.level) {
    setError('')
    setStep('loading')
    try {
      const res = await fetch(`/api/test-questions?level=${selectedLevel}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Questions could not be loaded.')
      setQuestions(data.questions)
      setStep('test')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Questions could not be loaded.')
      setStep('load-failed')
    }
  }

  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const required = ['fullName', 'phone', 'email', 'age', 'location', 'education', 'position', 'experience']
    if (required.some(k => !String(fd.get(k) || '').trim()) || !fd.get('document')) {
      setError('Please complete every field and attach your CV or document.')
      return
    }

    const candidateLevel = level()
    const candidateData = {
      fullName: String(fd.get('fullName')),
      email: String(fd.get('email')),
      position: String(fd.get('position')),
      level: candidateLevel,
    }
    setFormData(candidateData)

    setStep('loading')
    try {
      const res = await fetch('/api/register', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration could not be submitted.')
      await loadQuestions(candidateLevel)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration could not be submitted.')
      setStep('form')
    }
  }

  async function submitTest() {
    if (Object.keys(answers).length !== questions.length) {
      setError('Please answer every question before submitting.')
      return
    }
    setError('')
    setStep('submitting')
    try {
      const res = await fetch('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Assessment could not be submitted.')
      setTestResult({
        correct: data.correct,
        total: data.total,
        percentage: data.percentage,
      })
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assessment could not be submitted.')
      setStep('test')
    }
  }

  function removeFile() {
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <main className="bg-paper text-navy min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Logo />
          <a href="#register" className="btn">
            Register <ArrowUpRight size={15} />
          </a>
        </div>
      </nav>

      {/* Hero Section with Corporate Skyscraper Background */}
      <section className="hero relative overflow-hidden bg-navy">
        <img
          src="/images/jd-hero-bg.jpg"
          alt="Corporate skyscraper architecture"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/75 to-navy/40 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-36">
          <p className="eyebrow text-tealSoft">Port Harcourt · Rivers State · Nigeria</p>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[.95] text-paper md:text-8xl">
            People. Process.<br />
            <em>Performance.</em>
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-tealSoft">
            We connect capable people with the organisations shaping what comes next — through thoughtful outsourcing, consulting, and workforce partnerships.
          </p>
          <a href="#register" className="btn mt-9">
            Register as a candidate <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* Who We Are */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="eyebrow">Who we are</p>
          <p className="mt-5 max-w-3xl font-display text-3xl leading-tight md:text-5xl">
            A leading human resource and business consulting company committed to providing organizations with exceptional workforce solutions that drive productivity, efficiency, and sustainable growth.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map(t => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Candidate Registration & Assessment */}
      <section id="register" className="border-y border-line bg-[#eaf0f0] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[.85fr_1.15fr]">
          <div className="hidden min-h-[620px] overflow-hidden md:block relative">
            <img className="h-full w-full object-cover grayscale" src="/images/jd-interview.jpg" alt="Candidate speaking with a hiring professional" />
            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-navy/90 to-transparent text-paper">
              <p className="font-display text-3xl">
                Your next chapter<br />
                <em>starts here.</em>
              </p>
              <p className="text-sm text-tealSoft mt-2">Connecting qualified candidates to top employers across Nigeria.</p>
            </div>
          </div>

          <div className="rounded-sm bg-paper p-6 md:p-10">
            <p className="eyebrow">Candidate registration</p>
            <h2 className="mt-3 font-display text-4xl">Let&apos;s get to know you.</h2>

            <AnimatePresence mode="wait">
              {step === 'done' ? (
                <motion.div key="done" className="py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navyLight text-tealSoft">
                    <Check size={30} />
                  </div>
                  <h3 className="mt-6 font-display text-4xl">Assessment Complete!</h3>
                  
                  {testResult && (
                    <div className="my-6 p-5 rounded bg-[#eaf0f0] border border-line inline-block text-center min-w-[240px]">
                      <p className="text-xs uppercase tracking-wider text-teal font-semibold">Your Score ({formData.level})</p>
                      <p className="text-3xl font-bold text-navy mt-1">
                        {testResult.correct} / {testResult.total}
                        <span className="text-base font-normal text-teal ml-2">({testResult.percentage}%)</span>
                      </p>
                    </div>
                  )}

                  <p className="mx-auto mt-2 max-w-md leading-relaxed text-teal">
                    Thank you, <strong>{formData.fullName}</strong>. Both your registration profile (with CV) and your assessment scores have been sent directly to the JD Outsourcing HR team.
                  </p>
                  <button
                    className="text-link mt-8 block mx-auto text-sm"
                    onClick={() => {
                      setStep('form')
                      setAnswers({})
                      setTestResult(null)
                      setError('')
                    }}
                  >
                    Start another registration
                  </button>
                </motion.div>
              ) : step === 'test' || step === 'submitting' ? (
                <motion.div key="test">
                  <div className="mt-8 border-b border-line pb-5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Assessment ({formData.level})</span>
                      <span>
                        {Object.keys(answers).length} of {questions.length} answered
                      </span>
                    </div>
                    <div className="mt-3 h-2 bg-line">
                      <div
                        className="h-full bg-teal transition-all duration-300"
                        style={{
                          width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-7 space-y-8">
                    {questions.map((q, i) => (
                      <fieldset key={q.id}>
                        <legend className="font-semibold leading-relaxed">
                          <span className="mr-2 text-teal">0{i + 1}.</span>
                          {q.prompt}
                        </legend>
                        <div className="mt-3 grid gap-2">
                          {q.options.map((o, n) => (
                            <label
                              key={o}
                              className={`option ${answers[q.id] === n ? 'selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={answers[q.id] === n}
                                onChange={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                              />
                              <span>{o}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>

                  {error && <p className="error mt-4">{error}</p>}
                  <button
                    className="btn mt-8 w-full justify-center"
                    disabled={step === 'submitting'}
                    onClick={submitTest}
                  >
                    {step === 'submitting' ? 'Submitting assessment…' : 'Submit assessment'}
                  </button>
                </motion.div>
              ) : step === 'load-failed' ? (
                <motion.div key="failed" className="py-20 text-center">
                  <p className="eyebrow">Registration received</p>
                  <h3 className="mt-3 font-display text-4xl">One more step.</h3>
                  <p className="mt-4 text-teal">Your registration is safely with us. We couldn&apos;t load the assessment just now.</p>
                  {error && <p className="error mt-4">{error}</p>}
                  <button className="btn mt-8" onClick={() => loadQuestions(formData.level)}>
                    Retry assessment
                  </button>
                </motion.div>
              ) : (
                <form ref={formRef} onSubmit={register} className="mt-8 grid gap-5 md:grid-cols-2">
                  {[
                    ['fullName', 'Full name', 'text'],
                    ['phone', 'Phone number', 'tel'],
                    ['email', 'Email address', 'email'],
                    ['age', 'Age', 'number'],
                    ['location', 'Current location', 'text'],
                    ['position', 'Position of interest', 'text'],
                  ].map(([name, label, type]) => (
                    <label className="field" key={name}>
                      {label}
                      <input name={name} type={type} placeholder={label} required />
                    </label>
                  ))}

                  <label className="field">
                    Education Level
                    <select name="education" defaultValue="" required>
                      <option value="" disabled>
                        Select your level
                      </option>
                      <option value="SSCE">SSCE</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </label>

                  <label className="field">
                    Experience
                    <select name="experience" defaultValue="" required>
                      <option value="" disabled>
                        Select experience
                      </option>
                      <option value="0–2 years">0–2 years</option>
                      <option value="3–5 years">3–5 years</option>
                      <option value="6+ years">6+ years</option>
                    </select>
                  </label>

                  <label className="field md:col-span-2">
                    CV or Supporting Document (PDF / DOCX)
                    <div className="upload">
                      <Upload size={17} />
                      <span>{fileName || 'Choose a PDF, DOC, or DOCX document'}</span>
                      <input
                        ref={fileRef}
                        name="document"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={e => setFileName(e.target.files?.[0]?.name || '')}
                        required
                      />
                      {fileName && (
                        <button type="button" onClick={removeFile} aria-label="Remove selected file">
                          <X size={17} />
                        </button>
                      )}
                    </div>
                  </label>

                  <label className="md:col-span-2 flex items-start gap-3 text-sm text-teal">
                    <input name="consent" type="checkbox" className="mt-1" required />
                    I consent to JD Outsourcing &amp; Consulting Ltd using my information for recruitment and placement purposes.
                  </label>

                  {error && <p className="error md:col-span-2">{error}</p>}

                  <button className="btn md:col-span-2 md:w-fit" disabled={step === 'loading'}>
                    {step === 'loading' ? 'Processing registration…' : 'Submit registration'}{' '}
                    <ArrowUpRight size={16} />
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="card bg-paper">
              <p className="eyebrow">Our mission</p>
              <p className="mt-5 font-display text-2xl md:text-3xl leading-snug">
                To become Africa&apos;s most trusted outsourcing and consulting partner, empowering businesses through innovative human capital solutions.
              </p>
            </article>
            <article className="card bg-navy text-paper relative overflow-hidden">
              <img
                src="/images/jd-brand-wall.png"
                alt="JD Outsourcing brand wall"
                className="absolute inset-0 h-full w-full object-cover opacity-15 pointer-events-none"
              />
              <div className="relative z-10">
                <p className="eyebrow text-tealSoft">Our vision</p>
                <p className="mt-5 font-display text-2xl md:text-3xl leading-snug">
                  To deliver professional recruitment, outsourcing, and consulting services that connect organizations with exceptional talent while creating sustainable career opportunities for individuals.
                </p>
              </div>
            </article>
          </div>
        </section>
      </Reveal>

      {/* Core Values */}
      <Reveal>
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <p className="eyebrow">Our Core Values</p>
            <h2 className="mt-3 font-display text-4xl">Principles that guide our work</h2>
            <div className="mt-10 grid gap-x-8 gap-y-7 md:grid-cols-3">
              {values.map((v, i) => (
                <div key={v.title} className="border-t border-line pt-4">
                  <span className="text-sm font-semibold text-teal">0{i + 1}</span>
                  <p className="mt-2 text-xl font-bold">{v.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-teal">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* What We Do / Services */}
      <Reveal>
        <section className="bg-navy text-paper">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <p className="eyebrow text-tealSoft">What we do</p>
            <h2 className="mt-3 font-display text-4xl">Our Services</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {services.map((s, i) => (
                <div className="border-t border-teal/40 pt-4" key={s.title}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-tealSoft">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-tealSoft pl-8">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Industries We Serve */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="eyebrow">Across sectors</p>
          <h2 className="mt-3 font-display text-4xl">Industries We Serve</h2>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {industries.map(x => (
              <span className="pill" key={x}>
                {x}
              </span>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Why Choose Us */}
      <Reveal>
        <section className="border-t border-line bg-[#eaf0f0]">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <p className="eyebrow">The JD Advantage</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl">Why Choose Us?</h2>
            <div className="mt-10 grid gap-x-10 gap-y-3 md:grid-cols-2">
              {reasons.map((r, idx) => (
                <p className="border-t border-line py-3.5 text-base md:text-lg flex items-center gap-3" key={r}>
                  <span className="text-teal font-semibold">✓</span>
                  <span>{r}</span>
                </p>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer with Official Contact Details */}
      <footer className="bg-navy text-paper border-t border-teal/20">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="grid gap-10 md:grid-cols-3 pb-12 border-b border-teal/30">
            <div>
              <Logo />
              <p className="mt-4 text-xs leading-relaxed text-tealSoft">
                People · Process · Performance<br />
                We outsource the tasks, you focus on growth.
              </p>
              <p className="mt-2 text-[11px] text-tealSoft/80">
                Company Registration No. 9646756
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tealSoft">Head Office</p>
              <div className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-tealSoft">
                <MapPin size={16} className="mt-1 shrink-0 text-tealSoft" />
                <span>
                  House 1, JD Outsourcing &amp; Consulting Ltd Office,<br />
                  Ada George Road, Port Harcourt,<br />
                  Rivers State, Nigeria.
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tealSoft">Contact Us</p>
              <div className="mt-3 space-y-2 text-sm text-tealSoft">
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="shrink-0" />
                  <a href="mailto:jdoutsourcingconsultingltd@yahoo.com" className="hover:underline">
                    jdoutsourcingconsultingltd@yahoo.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="shrink-0" />
                  <span>08063909078 · 08063500707</span>
                </div>
                <p className="text-xs text-tealSoft/80 pt-1">
                  Social: @JDCONSULTINGLTD
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-tealSoft gap-4">
            <p>© 2026 JD Outsourcing &amp; Consulting Ltd. All rights reserved.</p>
            <p>Federal Republic of Nigeria — RC No. 9646756</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
