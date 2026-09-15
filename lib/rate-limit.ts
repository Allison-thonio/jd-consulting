import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * In-Memory Sliding Window Rate Limiter (Fallback)
 * 
 * NOTE: This in-memory fallback is best-effort only. It does NOT persist across
 * serverless function cold starts and does NOT synchronize across multiple instances.
 * For production persistence across multi-region / multi-instance deployments,
 * set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
interface MemoryWindowEntry {
  timestamps: number[]
}

const memoryRateLimitStore = new Map<string, MemoryWindowEntry>()

// Clean up stale memory store entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryRateLimitStore.entries()) {
      // Remove timestamps older than 1 hour
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 3600000)
      if (entry.timestamps.length === 0) {
        memoryRateLimitStore.delete(key)
      }
    }
  }, 300000) // Every 5 minutes
}

let upstashRedisClient: Redis | null = null
let isUpstashConfigured = false

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    upstashRedisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isUpstashConfigured = true
  } catch (err) {
    console.warn('[RateLimit] Failed to initialize Upstash Redis client. Falling back to in-memory.', err)
  }
}

/**
 * Extracts candidate IP address from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    const trimmed = realIp.trim()
    if (trimmed) return trimmed
  }

  return 'unknown'
}

/**
 * Checks rate limit for a specific key (IP + route identifier)
 * @param key Unique key e.g. "register:192.168.1.1"
 * @param limit Max requests allowed in the window
 * @param windowSec Window duration in seconds (e.g. 600 for 10 minutes)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now()
  const windowMs = windowSec * 1000

  // 1. Upstash Redis + Ratelimit branch
  if (isUpstashConfigured && upstashRedisClient) {
    try {
      const ratelimit = new Ratelimit({
        redis: upstashRedisClient,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        analytics: false,
        prefix: '@jd_ratelimit',
      })

      const res = await ratelimit.limit(key)
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      }
    } catch (error) {
      console.warn('[RateLimit] Upstash limit check failed. Falling back to in-memory store.', error)
      // Fall through to in-memory limiter
    }
  }

  // 2. In-Memory Sliding Window Fallback
  let entry = memoryRateLimitStore.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    memoryRateLimitStore.set(key, entry)
  }

  const windowStart = now - windowMs
  // Filter timestamps within current sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  if (entry.timestamps.length >= limit) {
    const oldestTimestamp = entry.timestamps[0] || now
    const resetTime = oldestTimestamp + windowMs
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(resetTime / 1000),
    }
  }

  // Record this request timestamp
  entry.timestamps.push(now)

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset: Math.ceil((now + windowMs) / 1000),
  }
}
