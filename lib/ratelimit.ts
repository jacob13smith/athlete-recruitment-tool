import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Only initialize if Upstash credentials are provided
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limiters for different endpoints
export const signupLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, "15 m"), // 3 requests per 15 minutes
      analytics: true,
    })
  : null

export const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, "15 m"), // 5 requests per 15 minutes
      analytics: true,
    })
  : null

export const forgotPasswordLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, "15 m"), // 3 requests per 15 minutes
      analytics: true,
    })
  : null

export const resendVerificationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, "15 m"), // 3 requests per 15 minutes per user
      analytics: true,
    })
  : null

/**
 * Get client IP from request headers
 * Works with Vercel and other proxies
 */
export function getClientIp(request: Request | { headers: Headers | { get: (key: string) => string | null } }): string {
  let headers: { get: (key: string) => string | null }
  
  if (request instanceof Request) {
    headers = request.headers
  } else if (request.headers instanceof Headers) {
    headers = request.headers
  } else {
    headers = { get: (key: string) => request.headers.get?.(key) || null }
  }
  
  // Check common proxy headers
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }
  
  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }
  
  // Fallback (won't work in production behind proxy, but useful for local dev)
  return "unknown"
}

/**
 * Check rate limit for a given identifier and limiter
 * Returns { success: true } if allowed, { success: false, limit, remaining, reset } if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  if (!limiter) {
    // If rate limiting is not configured, allow all requests
    return { success: true }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // If rate limiting fails, log error but allow request (fail open)
    console.error("Rate limit check failed:", error)
    return { success: true }
  }
}
