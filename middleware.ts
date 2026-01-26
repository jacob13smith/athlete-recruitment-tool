import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasAuthSession } from "@/lib/auth-middleware"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
