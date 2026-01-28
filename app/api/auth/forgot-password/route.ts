import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { forgotPasswordLimiter, getClientIp, checkRateLimit } from "@/lib/ratelimit"
import { z } from "zod"
import crypto from "crypto"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request)
  const rateLimitResult = await checkRateLimit(`forgot-password:${ip}`, forgotPasswordLimiter)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: "Too many password reset requests. Please try again later.",
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

  try {
    const body = await request.json()
    const parsedData = forgotPasswordSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const { email } = parsedData.data

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    })

    // Always return the same message to prevent email enumeration
    // If user exists, send reset email; if not, just return success
    if (user) {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString("hex")
      
      // Set expiry to 1 hour from now
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      // Delete any existing tokens for this user
      await db.passwordResetToken.deleteMany({
        where: { userId: user.id },
      })

      // Create new token
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // Send email
      await sendPasswordResetEmail(email, token)
    }

    // Always return success message (don't reveal if email exists)
    return NextResponse.json(
      {
        message: "If an account with that email exists, you will receive a password reset link.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
