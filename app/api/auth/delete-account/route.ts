import { NextRequest, NextResponse } from "next/server"
import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsedData = deleteAccountSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.errors[0].message },
        { status: 400 }
      )
    }

    const { password } = parsedData.data

    // Get user and verify password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify password
    const { verifyPassword } = await import("@/lib/utils")
    const passwordsMatch = await verifyPassword(password, user.password)

    if (!passwordsMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      )
    }

    // Delete user (cascade will delete profiles, videos, reset tokens, etc.)
    await db.user.delete({
      where: { id: user.id },
    })

    // Sign out the user
    await signOut({ redirect: false })

    return NextResponse.json(
      {
        message: "Account deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
