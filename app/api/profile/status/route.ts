import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET: Compute hasUnpublishedChanges
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with draft and published profiles
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
        publishedProfile: {
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

    // If no published profile exists, there are no changes to compare
    if (!user.publishedProfile) {
      return NextResponse.json({
        hasUnpublishedChanges: false,
        isPublished: user.isPublished,
      })
    }

    if (!user.draftProfile) {
      return NextResponse.json({
        hasUnpublishedChanges: false,
        isPublished: user.isPublished,
      })
    }

    // Compare draft Profile fields vs published Profile fields
    const profileFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "graduationYear",
      "highSchool",
      "club",
      "otherTeams",
      "residence",
      "height",
      "primaryPosition",
      "secondaryPosition",
      "dominantHand",
      "standingTouch",
      "spikeTouch",
      "blockTouch",
      "gpa",
      "areaOfStudy",
      "careerGoals",
    ] as const

    const profileChanged = profileFields.some((field) => {
      const draftValue = user.draftProfile![field] || ""
      const publishedValue = user.publishedProfile![field] || ""
      return draftValue !== publishedValue
    })

    // Compare draft Profile Videos vs published Profile Videos
    const draftVideos = user.draftProfile!.videos || []
    const publishedVideos = user.publishedProfile!.videos || []

    // Check video count
    const videoCountChanged = draftVideos.length !== publishedVideos.length

    // Check video content (URLs, titles, order)
    let videoContentChanged = false
    if (!videoCountChanged) {
      // Same count, check content
      for (let i = 0; i < draftVideos.length; i++) {
        const draftVideo = draftVideos[i]
        const publishedVideo = publishedVideos[i]

        if (
          draftVideo.url !== publishedVideo.url ||
          (draftVideo.title || "") !== (publishedVideo.title || "") ||
          draftVideo.order !== publishedVideo.order
        ) {
          videoContentChanged = true
          break
        }
      }
    }

    const hasUnpublishedChanges =
      profileChanged || videoCountChanged || videoContentChanged

    return NextResponse.json({
      hasUnpublishedChanges,
      isPublished: user.isPublished,
      slug: user.slug,
    })
  } catch (error) {
    console.error("Error checking profile status:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to check profile status", details: errorMessage },
      { status: 500 }
    )
  }
}
