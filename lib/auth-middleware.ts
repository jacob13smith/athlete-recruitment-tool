// Lightweight auth check for middleware (Edge Runtime compatible)
// This avoids importing the database connection
import { NextRequest } from "next/server"

export function hasAuthSession(request: NextRequest): boolean {
  // NextAuth v5 stores session in cookies
  // Check for common NextAuth cookie names
  const cookies = request.cookies.getAll()
  
  return cookies.some(cookie => {
    const name = cookie.name.toLowerCase()
    return (
      name.includes('authjs') ||
      name.includes('session-token') ||
      name.includes('next-auth')
    )
  })
}
