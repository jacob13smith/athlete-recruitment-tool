import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube-utils"
import { z } from "zod"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const videoSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(
      (url) => {
        // Basic URL format check
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      { message: "URL must be a valid URL format" }
    )
    .optional(),
  title: z.string().nullish(),
})

// PUT: Update Video
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = videoSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { url, title } = validationResult.data

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

    // Find the video and verify it belongs to user's draft profile
    const video = await db.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.profileId !== user.draftProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Prepare update data
    const updateData: { url?: string; title?: string | null } = {}

    if (url !== undefined) {
      // Validate YouTube URL if provided
      const youtubeValidation = validateYouTubeUrl(url)
      if (!youtubeValidation.isValid) {
        return NextResponse.json(
          { error: youtubeValidation.error || "Invalid YouTube URL" },
          { status: 400 }
        )
      }

      // Check for duplicate video ID (excluding current video)
      const newVideoId = youtubeValidation.videoId
      if (newVideoId) {
        const existingVideos = await db.video.findMany({
          where: {
            profileId: user.draftProfileId,
            id: { not: params.id }, // Exclude current video
          },
        })
        const existingVideoIds = existingVideos
          .map((v: { url: string }) => extractYouTubeVideoId(v.url))
          .filter(Boolean)
        if (existingVideoIds.includes(newVideoId)) {
          return NextResponse.json(
            { error: "This video is already in your profile" },
            { status: 400 }
          )
        }
      }

      updateData.url = youtubeValidation.videoId
        ? `https://www.youtube.com/watch?v=${youtubeValidation.videoId}`
        : url
    }

    if (title !== undefined) {
      updateData.title = title || null
    }

    // Update video
    const updatedVideo = await db.video.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedVideo)
  } catch (error) {
    console.error("Error updating video:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to update video", details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE: Remove Video
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Find the video and verify it belongs to user's draft profile
    const video = await db.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.profileId !== user.draftProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete video
    await db.video.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to delete video", details: errorMessage },
      { status: 500 }
    )
  }
}
