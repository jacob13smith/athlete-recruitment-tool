import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST: Unpublish profile
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.isPublished) {
      return NextResponse.json(
        { error: "Profile is not published" },
        { status: 400 }
      )
    }

    // Set User.isPublished = false
    // Keep User.slug (immutable)
    // Keep published Profile and Videos (for future republish)
    await db.user.update({
      where: { id: user.id },
      data: {
        isPublished: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile unpublished successfully",
    })
  } catch (error) {
    console.error("Error unpublishing profile:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to unpublish profile", details: errorMessage },
      { status: 500 }
    )
  }
}
