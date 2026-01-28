import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/utils"
import { z } from "zod"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = resetPasswordSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, newPassword } = parsedData.data

    // Find token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      })
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "This reset token has already been used" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
      },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    })

    // Delete all other reset tokens for this user (cleanup)
    await db.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    })

    return NextResponse.json(
      {
        message: "Password reset successfully. You can now sign in with your new password.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
