import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateUUID, generateShortId, slugify } from "@/lib/uuid-utils"
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

    // Generate or update slug based on name
    const firstName = user.draftProfile.firstName || ""
    const lastName = user.draftProfile.lastName || ""
    const nameSlug = slugify(`${firstName} ${lastName}`.trim())
    
    let slug = user.slug
    
    // Check if we need to generate/update slug
    if (!slug || !nameSlug) {
      // First publish or no name - generate slug
      if (nameSlug) {
        // Generate slug from name: firstName-lastName
        let baseSlug = nameSlug
        let attempts = 0
        const maxAttempts = 10
        
        while (attempts < maxAttempts) {
          const existingUser = await db.user.findUnique({
            where: { slug: baseSlug },
            select: { id: true }, // Only check if it exists, ignore if it's the current user
          })
          
          // If slug doesn't exist, or it's the current user's slug, use it
          if (!existingUser || existingUser.id === user.id) {
            slug = baseSlug
            break
          }
          
          // Slug exists for another user, append short ID
          const shortId = generateShortId()
          baseSlug = `${nameSlug}-${shortId}`
          attempts++
        }
        
        // Fallback to UUID if we couldn't generate a unique name-based slug
        if (!slug) {
          slug = generateUUID()
        }
      } else {
        // No name available, use UUID
        slug = generateUUID()
      }
      } else {
        // User has existing slug - check if name changed
        const oldFirstName = user.publishedProfile?.firstName || ""
        const oldLastName = user.publishedProfile?.lastName || ""
        const oldNameSlug = slugify(`${oldFirstName} ${oldLastName}`.trim())
        
        // If name changed, regenerate slug
        if (nameSlug !== oldNameSlug && nameSlug) {
        let baseSlug = nameSlug
        let attempts = 0
        const maxAttempts = 10
        
        while (attempts < maxAttempts) {
          const existingUser = await db.user.findUnique({
            where: { slug: baseSlug },
            select: { id: true },
          })
          
          // If slug doesn't exist, or it's the current user's slug, use it
          if (!existingUser || existingUser.id === user.id) {
            slug = baseSlug
            break
          }
          
          // Slug exists for another user, append short ID
          const shortId = generateShortId()
          baseSlug = `${nameSlug}-${shortId}`
          attempts++
        }
        
        // Fallback: keep old slug if we can't generate a new unique one
        if (!slug) {
          slug = user.slug || generateUUID()
        }
      }
    }

    // Store old published profile ID before we update
    const oldPublishedProfileId = user.publishedProfileId

    // Create published Profile snapshot (copy of draft Profile)
    const publishedProfile = await db.profile.create({
      data: {
        firstName: user.draftProfile.firstName,
        lastName: user.draftProfile.lastName,
        email: user.draftProfile.email,
        phone: user.draftProfile.phone,
        graduationYear: user.draftProfile.graduationYear,
        highSchool: user.draftProfile.highSchool,
        club: user.draftProfile.club,
        otherTeams: user.draftProfile.otherTeams,
        residence: user.draftProfile.residence,
        height: user.draftProfile.height,
        primaryPosition: user.draftProfile.primaryPosition,
        secondaryPosition: user.draftProfile.secondaryPosition,
        dominantHand: user.draftProfile.dominantHand,
        standingTouch: user.draftProfile.standingTouch,
        spikeTouch: user.draftProfile.spikeTouch,
        blockTouch: user.draftProfile.blockTouch,
        gpa: user.draftProfile.gpa,
        areaOfStudy: user.draftProfile.areaOfStudy,
        careerGoals: user.draftProfile.careerGoals,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to publish profile", details: errorMessage },
      { status: 500 }
    )
  }
}
