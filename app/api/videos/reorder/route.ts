import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const reorderSchema = z.object({
  videoIds: z.array(z.string()).min(1, "At least one video ID is required"),
})

// PUT: Update Video order
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = reorderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { videoIds } = validationResult.data

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.draftProfileId) {
      return NextResponse.json(
        { error: "Draft profile not found" },
        { status: 404 }
      )
    }

    // Verify all videos belong to user's draft profile
    const videos = await db.video.findMany({
      where: {
        id: { in: videoIds },
        profileId: user.draftProfileId,
      },
    })

    if (videos.length !== videoIds.length) {
      return NextResponse.json(
        { error: "Some videos not found or unauthorized" },
        { status: 403 }
      )
    }

    // Update order for each video
    const updatePromises = videoIds.map((videoId, index) =>
      db.video.update({
        where: { id: videoId },
        data: { order: index },
      })
    )

    await Promise.all(updatePromises)

    // Return updated videos in new order
    const updatedVideos = await db.video.findMany({
      where: { id: { in: videoIds } },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(updatedVideos)
  } catch (error) {
    console.error("Error reordering videos:", error)
    return NextResponse.json(
      { error: "Failed to reorder videos" },
      { status: 500 }
    )
  }
}
