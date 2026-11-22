import type { Metadata } from 'next'
import RecruitmentClient from './recruitment-client'

export const metadata: Metadata = {
  title: 'Official Recruitment Portal | JD Outsourcing & Consulting Ltd',
  description: 'Official recruitment portal for JD Outsourcing & Consulting Ltd (RC: 9646756). We recruit, we employ, and we train competent staff across Port Harcourt (Rivers State), Yenagoa (Bayelsa State), and nationwide. Apply now for verified positions.',
  keywords: ['JD Outsourcing Recruitment', 'Staff Vacancies Port Harcourt', 'Recruitment Rivers State', 'Jobs in Yenagoa', 'Bayelsa State Recruitment', 'Recruit Employ Train'],
  openGraph: {
    title: 'JD Outsourcing & Consulting Ltd — Official Staff Recruitment',
    description: 'We Recruit. We Employ. We Train. Verified positions now open for candidates aged 18–35.',
    images: [{ url: '/images/jd-logo.png', width: 878, height: 1024, alt: 'JD Outsourcing Logo' }]
  }
}

export default function RecruitmentPage() {
  return <RecruitmentClient />
}
