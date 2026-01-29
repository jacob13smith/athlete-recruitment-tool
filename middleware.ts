import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasAuthSession } from "@/lib/auth-middleware"
import { loginLimiter, getClientIp, checkRateLimit } from "@/lib/ratelimit"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit authentication endpoints (POST requests only)
  if (request.method === "POST" && pathname.startsWith("/api/auth/")) {
    // Skip rate limiting for these (handled in route handlers or one-time use)
    if (
      pathname === "/api/auth/signup" ||
      pathname === "/api/auth/forgot-password" ||
      pathname === "/api/auth/verify-email" ||
      pathname === "/api/auth/resend-verification"
    ) {
      return NextResponse.next()
    }
    
    // Rate limit login attempts (NextAuth routes)
    const ip = getClientIp(request)
    const rateLimitResult = await checkRateLimit(`login:${ip}`, loginLimiter)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : undefined
        },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : "900",
          }
        }
      )
    }
  }

  // Allow public access to athlete profile pages
  if (pathname.startsWith("/athlete/")) {
    return NextResponse.next()
  }

  // Check for auth session (Edge Runtime compatible - no database access)
  const hasSession = hasAuthSession(request)

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const url = new URL("/", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Allow home page to be accessible to everyone (no redirect)
  // The page component can handle showing login/signup or redirecting if needed

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * Also match /api/auth/* for rate limiting
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/auth/:path*",
  ],
}
