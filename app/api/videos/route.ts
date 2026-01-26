import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube-utils"
import { z } from "zod"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_VIDEOS = 10

// Video schema for validation
const videoSchema = z.object({
  url: z.string().min(1, "URL is required"),
  title: z.string().nullish(),
})

// GET: List Videos for user's draft Profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with draft profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.draftProfileId) {
      return NextResponse.json([])
    }

    // Fetch videos for draft profile, ordered by order field
    const videos = await db.video.findMany({
      where: { profileId: user.draftProfileId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    )
  }
}

// POST: Add Video to draft Profile
export async function POST(request: Request) {
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

    // Validate YouTube URL
    const youtubeValidation = validateYouTubeUrl(url)
    if (!youtubeValidation.isValid) {
      return NextResponse.json(
        { error: youtubeValidation.error || "Invalid YouTube URL" },
        { status: 400 }
      )
    }

    // Get user with draft profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ensure draft profile exists
    if (!user.draftProfileId) {
      // Create draft profile if it doesn't exist
      const newProfile = await db.profile.create({
        data: {
          email: user.email,
        },
      })

      await db.user.update({
        where: { id: user.id },
        data: { draftProfileId: newProfile.id },
      })

      // Use the new profile ID
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      })

      if (!updatedUser?.draftProfileId) {
        return NextResponse.json(
          { error: "Failed to create draft profile" },
          { status: 500 }
        )
      }

      // Check video count
      const videoCount = await db.video.count({
        where: { profileId: updatedUser.draftProfileId },
      })

      if (videoCount >= MAX_VIDEOS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_VIDEOS} videos allowed` },
          { status: 400 }
        )
      }

      // Check for duplicate video ID
      const newVideoId = youtubeValidation.videoId
      if (newVideoId) {
        const existingVideos = await db.video.findMany({
          where: { profileId: updatedUser.draftProfileId },
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

      // Get the highest order value
      const maxOrderVideo = await db.video.findFirst({
        where: { profileId: updatedUser.draftProfileId },
        orderBy: { order: "desc" },
      })

      const newOrder = maxOrderVideo ? maxOrderVideo.order + 1 : 0

      // Create video
      const newVideo = await db.video.create({
        data: {
          profileId: updatedUser.draftProfileId,
          url: youtubeValidation.videoId
            ? `https://www.youtube.com/watch?v=${youtubeValidation.videoId}`
            : url,
          title: title || null,
          order: newOrder,
        },
      })

      return NextResponse.json(newVideo)
    }

    // Check video count
    const videoCount = await db.video.count({
      where: { profileId: user.draftProfileId },
    })

    if (videoCount >= MAX_VIDEOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VIDEOS} videos allowed` },
        { status: 400 }
      )
    }

    // Check for duplicate video ID
    const newVideoId = youtubeValidation.videoId
    if (newVideoId) {
      const existingVideos = await db.video.findMany({
        where: { profileId: user.draftProfileId },
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

    // Get the highest order value
    const maxOrderVideo = await db.video.findFirst({
      where: { profileId: user.draftProfileId },
      orderBy: { order: "desc" },
    })

    const newOrder = maxOrderVideo ? maxOrderVideo.order + 1 : 0

    // Create video
    const newVideo = await db.video.create({
      data: {
        profileId: user.draftProfileId,
        url: youtubeValidation.videoId
          ? `https://www.youtube.com/watch?v=${youtubeValidation.videoId}`
          : url,
        title: title || null,
        order: newOrder,
      },
    })

    return NextResponse.json(newVideo)
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    )
  }
}
