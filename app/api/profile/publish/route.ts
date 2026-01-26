import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateUUID } from "@/lib/uuid-utils"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST: Publish draft Profile → create published Profile snapshot
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with draft profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        draftProfile: {
          include: {
            videos: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.draftProfile) {
      return NextResponse.json(
        { error: "No draft profile found. Please create a profile first." },
        { status: 400 }
      )
    }

    // Generate slug on first publish (if user.slug is null)
    let slug = user.slug
    if (!slug) {
      slug = generateUUID()
    }

    // Store old published profile ID before we update
    const oldPublishedProfileId = user.publishedProfileId

    // Create published Profile snapshot (copy of draft Profile)
    const publishedProfile = await db.profile.create({
      data: {
        firstName: user.draftProfile.firstName,
        lastName: user.draftProfile.lastName,
        email: user.draftProfile.email,
        graduationYear: user.draftProfile.graduationYear,
        highSchool: user.draftProfile.highSchool,
        club: user.draftProfile.club,
        residence: user.draftProfile.residence,
        height: user.draftProfile.height,
        primaryPosition: user.draftProfile.primaryPosition,
        secondaryPosition: user.draftProfile.secondaryPosition,
        gpa: user.draftProfile.gpa,
        standingTouch: user.draftProfile.standingTouch,
        spikeTouch: user.draftProfile.spikeTouch,
      },
    })

    // Copy all Videos from draft Profile to published Profile
    if (user.draftProfile.videos && user.draftProfile.videos.length > 0) {
      await Promise.all(
        user.draftProfile.videos.map((video: { url: string; title: string | null }, index: number) =>
          db.video.create({
            data: {
              profileId: publishedProfile.id,
              url: video.url,
              title: video.title,
              order: index,
            },
          })
        )
      )
    }

    // CRITICAL: Update User FIRST before deleting old profile
    // This ensures User.publishedProfileId points to the new profile BEFORE we delete the old one
    // This prevents any cascade delete issues that could delete the User
    await db.user.update({
      where: { id: user.id },
      data: {
        publishedProfileId: publishedProfile.id,
        isPublished: true,
        publishedAt: new Date(),
        slug, // Set slug (only if it was null, otherwise keep existing)
      },
    })

    // Delete old published profile AFTER updating User (now safe since User points to new profile)
    if (oldPublishedProfileId && oldPublishedProfileId !== publishedProfile.id) {
      await db.profile.delete({
        where: { id: oldPublishedProfileId },
      })
    }

    return NextResponse.json({
      success: true,
      slug,
      message: "Profile published successfully",
    })
  } catch (error) {
    console.error("Error publishing profile:", error)
    return NextResponse.json(
      { error: "Failed to publish profile" },
      { status: 500 }
    )
  }
}
