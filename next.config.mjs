/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

// In production, unsafe-eval is strictly prohibited.
// Only in development is unsafe-eval conditionally enabled for Next.js hot-reloader / dev-tools.
const scriptSrcPolicy = `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ''}https://challenges.cloudflare.com;`

const cspHeader = `
  default-src 'self';
  ${scriptSrcPolicy}
  frame-src 'self' https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, ' ')
  .trim()

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Explicitly set this project directory as the tracing root to silence
  // Next.js warnings about multiple lockfiles (pnpm-lock.yaml vs parent package-lock.json)
  outputFileTracingRoot: new URL('.', import.meta.url).pathname.replace(/\/$/, '').replace(/^\/([A-Z]:)/, '$1'),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ]
  },
}

export default nextConfig
