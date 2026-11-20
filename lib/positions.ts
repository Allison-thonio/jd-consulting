export interface JobRole {
  id: string
  rank: number
  title: string
  department: string
  levelBadge: string
  salaryTier: string
  educationRequired: 'SSCE' | 'Graduate'
  experienceRequired: string
  shortSummary: string
  keyDuties: string[]
  idealFor: string
}

/**
 * Official Positions Directory — Arranged strictly in descending hierarchy
 * from highest earning / executive level down to entry level.
 * 
 * Strict Constraint: Marketing Officer is placed before Supervisor as commanded.
 */
export const RECRUITMENT_POSITIONS: JobRole[] = [
  {
    id: 'manager',
    rank: 1,
    title: 'Manager',
    department: 'Executive Operations & Management',
    levelBadge: 'Executive Tier · Top Position',
    salaryTier: 'Level 1 — Highest Earnings & Executive Package',
    educationRequired: 'Graduate',
    experienceRequired: '3–5+ years proven management experience',
    shortSummary: 'Oversee full branch/division operations, team performance, client relationship management, and commercial milestones.',
    keyDuties: [
      'Spearhead business unit operations and direct departmental heads and staff.',
      'Manage client outsourcing relationships, contracts, and service level agreements (SLAs).',
      'Drive revenue targets, budget efficiency, and operational profitability.',
      'Report directly to executive directors on performance metrics and expansion strategies.'
    ],
    idealFor: 'Experienced corporate managers, senior business leads, and operational heads.'
  },
  {
    id: 'accountant',
    rank: 2,
    title: 'Accountant / Office Accountant',
    department: 'Finance & Corporate Accounts',
    levelBadge: 'Professional Tier · Senior Finance',
    salaryTier: 'Level 2 — High Compensation & Professional Allowance',
    educationRequired: 'Graduate',
    experienceRequired: '2–5+ years in accounting, auditing, or bookkeeping',
    shortSummary: 'Lead financial reporting, bookkeeping, payroll schedules, tax compliance, bank reconciliations, and internal audits.',
    keyDuties: [
      'Maintain comprehensive general ledgers, accounts payable, and accounts receivable.',
      'Process monthly payroll, PAYE deductions, pensions, and statutory compliance filings.',
      'Prepare quarterly and annual management financial statements and budget analyses.',
      'Coordinate external audits and implement robust internal fiscal controls.'
    ],
    idealFor: 'B.Sc/HND Accounting or Finance graduates with strong spreadsheet and analytical skills.'
  },
  {
    id: 'marketing-officer',
    rank: 3,
    title: 'Marketing Officer',
    department: 'Strategic Marketing & Growth',
    levelBadge: 'Officer Tier · Brand & Market Strategy',
    salaryTier: 'Level 3 — Officer Grade (Ranked Above Supervisory)',
    educationRequired: 'Graduate',
    experienceRequired: '1–4 years in marketing, client acquisition, or communications',
    shortSummary: 'Drive company brand visibility, design lead-generation initiatives, execute corporate marketing campaigns, and acquire new corporate accounts.',
    keyDuties: [
      'Design and deploy targeted B2B and B2C marketing campaigns across digital and field channels.',
      'Draft persuasive corporate marketing proposals, pitch decks, and service brochures.',
      'Monitor market trends, competitor activities, and prospective client acquisition pipelines.',
      'Collaborate with the management team to position JD Outsourcing as the premier HR partner.'
    ],
    idealFor: 'Dynamic, persuasive communicators with a track record in growth marketing and branding.'
  },
  {
    id: 'supervisor',
    rank: 4,
    title: 'Supervisor',
    department: 'Operations & Field Supervision',
    levelBadge: 'Supervisory Tier · Operations Oversight',
    salaryTier: 'Level 4 — Supervisory Compensation & Shift Allowances',
    educationRequired: 'Graduate',
    experienceRequired: '2–4 years in team supervision or shift coordination',
    shortSummary: 'Directly manage on-site team productivity, enforce standard operating procedures (SOPs), coordinate shift schedules, and ensure service excellence.',
    keyDuties: [
      'Supervise daily frontline workflows, task allocations, and attendance compliance.',
      'Inspect service quality, resolve immediate workplace bottlenecks, and mentor junior personnel.',
      'Ensure health, safety, and corporate operational standards are met at all times.',
      'Submit daily shift performance and incident reports to the Manager.'
    ],
    idealFor: 'Natural leaders with operational acumen and strong team coordination ability.'
  },
  {
    id: 'office-secretary',
    rank: 5,
    title: 'Office Secretary',
    department: 'Corporate Administration & Secretarial',
    levelBadge: 'Administrative Tier · Office Operations',
    salaryTier: 'Level 5 — Administrative Compensation',
    educationRequired: 'Graduate',
    experienceRequired: '1–3 years in executive assistance, front desk, or secretarial duties',
    shortSummary: 'Manage executive correspondence, maintain official records, coordinate calendar appointments, and manage front office administrative flow.',
    keyDuties: [
      'Draft official memos, emails, letters, and meeting minutes with high confidentiality.',
      'Organize and maintain company filing systems, both digital and physical archives.',
      'Receive official visitors, manage phone inquiries, and route communication to proper desks.',
      'Coordinate executive meetings, itineraries, and office logistics supplies.'
    ],
    idealFor: 'Polished, organized administrative professionals with proficient typing and Microsoft Office skills.'
  },
  {
    id: 'sales-representative',
    rank: 6,
    title: 'Sales Representative',
    department: 'Commercial & Direct Field Sales',
    levelBadge: 'Commercial Tier · Target & Field Sales',
    salaryTier: 'Level 6 — Base Salary + Performance Commissions',
    educationRequired: 'SSCE',
    experienceRequired: '1–3 years in direct field sales, FMCG, or retail distribution',
    shortSummary: 'Prospect prospective customers, conduct direct field pitches, present company products/services, and achieve monthly sales targets.',
    keyDuties: [
      'Identify and visit commercial prospects, building long-term business relationships.',
      'Conduct energetic product presentations and negotiate win-win sales orders.',
      'Follow up on inbound sales inquiries and expand existing client accounts.',
      'Meet and exceed established monthly revenue and customer acquisition quotas.'
    ],
    idealFor: 'Target-driven, ambitious sales individuals with high energy and persuasive presence.'
  },
  {
    id: 'sales-attendant',
    rank: 7,
    title: 'Sales Attendant',
    department: 'Retail Sales & Customer Frontline',
    levelBadge: 'Frontline Tier · Store & Counter Services',
    salaryTier: 'Level 7 — Competitive Frontline Salary & Allowances',
    educationRequired: 'SSCE',
    experienceRequired: '0–2 years (Fresh school leavers are welcomed & will be trained)',
    shortSummary: 'Attend to walk-in customers, handle product inquiries, process cash/POS checkout transactions, and maintain clean display shelves.',
    keyDuties: [
      'Greet customers warmly and assist them in finding products matching their needs.',
      'Process customer billing accurately via POS, cash, or electronic transfer.',
      'Ensure shelves, counters, and merchandise displays remain orderly and stocked.',
      'Perform daily opening and closing stock audits alongside the supervisor.'
    ],
    idealFor: 'Courteous, honest, and energetic individuals eager to start a thriving retail career.'
  },
  {
    id: 'eyeshadow-specialist',
    rank: 8,
    title: 'Eyeshadow / Beauty Specialist',
    department: 'Beauty, Cosmetics & Makeup Artistry',
    levelBadge: 'Specialized Tier · Beauty & Cosmetics Artistry',
    salaryTier: 'Level 8 — Competitive Base + Artistry Incentives',
    educationRequired: 'SSCE',
    experienceRequired: '0–2 years (Knowledge of makeup or beauty passion; training provided)',
    shortSummary: 'Provide eye makeup styling, eyeshadow blending, cosmetic advisory, and professional beauty product demonstrations for clients.',
    keyDuties: [
      'Consult with clients to recommend complementary eyeshadow palettes and cosmetic products.',
      'Perform delicate eyeshadow and facial cosmetic applications with hygiene and precision.',
      'Demonstrate cosmetic product usage, care routines, and application techniques to buyers.',
      'Maintain impeccably clean, sanitized makeup stations, brushes, and testing palettes.'
    ],
    idealFor: 'Passionate makeup artists, beauty enthusiasts, and cosmetics consultants.'
  }
]

export const ELIGIBILITY_RULES = [
  {
    num: '1',
    rule: 'Age Bracket (Strict Mandatory Rule)',
    desc: 'Applicants for ALL positions must be between the age of 18 and 35 years at the time of application.'
  },
  {
    num: '2',
    rule: 'Educational Qualifications',
    desc: 'Candidates must possess relevant academic certificates: minimum SSCE / O\'Level for attendant and beauty roles; OND / HND / B.Sc for administrative, supervisory, accounting, and managerial roles.'
  },
  {
    num: '3',
    rule: 'Location & Immediate Availability',
    desc: 'Must reside in Rivers State (Port Harcourt & environs) or be genuinely prepared to resume work immediately upon completion of screening.'
  },
  {
    num: '4',
    rule: 'Trainability & Professional Conduct',
    desc: 'Must exhibit integrity, neat personal presentation, good communication ability, and willingness to undergo JD Outsourcing\'s professional orientation and workforce training.'
  },
  {
    num: '5',
    rule: 'Zero Fee Guarantee',
    desc: 'Recruitment and assessment with JD Outsourcing & Consulting Ltd are 100% FREE. Under no circumstance should any applicant pay money to anyone for application, test, or placement.'
  }
]
