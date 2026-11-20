import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap', fallback: ['serif'] })
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex', display: 'swap', fallback: ['system-ui', 'sans-serif'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jdoutsourcing.com'),
  title: 'JD Outsourcing & Consulting Ltd',
  description: 'People, process, and performance. Register as a candidate with JD Outsourcing & Consulting Ltd.',
  icons: {
    icon: '/images/jd-logo.png',
    shortcut: '/images/jd-logo.png',
    apple: '/images/jd-logo.png',
  },
}
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#16303B' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
