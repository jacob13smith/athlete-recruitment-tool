import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profileSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

// GET: Return user's draft Profile (create if doesn't exist)
export async function GET() {
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

    // If no draft profile exists, create one
    if (!user.draftProfileId) {
      const newProfile = await db.profile.create({
        data: {
          email: user.email, // Default to user's email
        },
      })

      await db.user.update({
        where: { id: user.id },
        data: { draftProfileId: newProfile.id },
      })

      return NextResponse.json(newProfile)
    }

    // Fetch the draft profile
    const draftProfile = await db.profile.findUnique({
      where: { id: user.draftProfileId },
    })

    if (!draftProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(draftProfile)
  } catch (error) {
    console.error("Error fetching draft profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT: Update draft Profile fields
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = profileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prepare update data (convert empty strings to null)
    const updateData: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(data)) {
      updateData[key] = value === "" ? null : value || null
    }

    // If no draft profile exists, create one
    if (!user.draftProfileId) {
      const newProfile = await db.profile.create({
        data: {
          ...updateData,
          email: updateData.email || user.email, // Default to user's email if not provided
        },
      })

      await db.user.update({
        where: { id: user.id },
        data: { draftProfileId: newProfile.id },
      })

      return NextResponse.json(newProfile)
    }

    // Update existing draft profile
    const updatedProfile = await db.profile.update({
      where: { id: user.draftProfileId },
      data: updateData,
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Error updating draft profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
