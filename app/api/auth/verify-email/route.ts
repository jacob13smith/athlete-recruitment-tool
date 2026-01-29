import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = verifyEmailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token } = parsed.data

    const verificationToken = await db.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification link." },
        { status: 400 }
      )
    }

    if (verificationToken.expiresAt < new Date()) {
      await db.emailVerificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json(
        { error: "Verification link has expired. Request a new one from your dashboard." },
        { status: 400 }
      )
    }

    if (verificationToken.usedAt) {
      return NextResponse.json(
        { error: "This verification link has already been used." },
        { status: 400 }
      )
    }

    await db.$transaction([
      db.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
      db.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      db.emailVerificationToken.deleteMany({
        where: {
          userId: verificationToken.userId,
          id: { not: verificationToken.id },
        },
      }),
    ])

    return NextResponse.json(
      { message: "Email verified successfully. You can now publish your profile." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
