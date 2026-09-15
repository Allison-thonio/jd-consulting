import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-fraunces' })
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex' })

export const metadata: Metadata = { title: 'JD Outsourcing & Consulting Ltd', description: 'People, process, and performance. Register as a candidate with JD Outsourcing & Consulting Ltd.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#16303B' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${fraunces.variable} ${plex.variable}`}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }
