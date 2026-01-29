import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { resendVerificationLimiter, getClientIp, checkRateLimit } from "@/lib/ratelimit"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rateLimitResult = await checkRateLimit(
    `resend-verification:${session.user.id}:${ip}`,
    resendVerificationLimiter
  )

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many verification emails. Please try again later.",
        retryAfter: rateLimitResult.reset
          ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
          : undefined,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            : "900",
        },
      }
    )
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified." },
        { status: 400 }
      )
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await db.emailVerificationToken.deleteMany({ where: { userId: user.id } })
    await db.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const sent = await sendVerificationEmail(user.email, token)
    if (!sent.success) {
      console.error("Resend verification email failed:", sent.error)
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Verification email sent. Check your inbox." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
