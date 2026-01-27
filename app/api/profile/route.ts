import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profileSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
        data: { 
          draftProfileId: newProfile.id
        } as any, // Type assertion needed for Prisma 7 compatibility
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch profile", details: errorMessage },
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
    // Use Prisma's Prisma.ProfileUpdateInput type for type safety
    const updateData: {
      firstName?: string | null
      lastName?: string | null
      email?: string | null
      phone?: string | null
      graduationYear?: string | null
      highSchool?: string | null
      club?: string | null
      otherTeams?: string | null
      residence?: string | null
      province?: string | null
      height?: string | null
      primaryPosition?: string | null
      secondaryPosition?: string | null
      dominantHand?: string | null
      standingTouch?: string | null
      spikeTouch?: string | null
      blockTouch?: string | null
      gpa?: string | null
      areaOfStudy?: string | null
      careerGoals?: string | null
    } = {}
    
    // Type-safe assignment of validated data
    if (data.firstName !== undefined) updateData.firstName = data.firstName === "" ? null : data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName === "" ? null : data.lastName
    if (data.email !== undefined) updateData.email = data.email === "" ? null : data.email
    if (data.phone !== undefined) updateData.phone = data.phone === "" ? null : data.phone
    if (data.graduationYear !== undefined) updateData.graduationYear = data.graduationYear === "" ? null : data.graduationYear
    if (data.highSchool !== undefined) updateData.highSchool = data.highSchool === "" ? null : data.highSchool
    if (data.club !== undefined) updateData.club = data.club === "" ? null : data.club
    if (data.otherTeams !== undefined) updateData.otherTeams = data.otherTeams === "" ? null : data.otherTeams
    if (data.residence !== undefined) updateData.residence = data.residence === "" ? null : data.residence
    if (data.province !== undefined) updateData.province = data.province === "" ? null : data.province
    if (data.height !== undefined) updateData.height = data.height === "" ? null : data.height
    if (data.primaryPosition !== undefined) updateData.primaryPosition = data.primaryPosition === "" ? null : data.primaryPosition
    if (data.secondaryPosition !== undefined) updateData.secondaryPosition = data.secondaryPosition === "" ? null : data.secondaryPosition
    if (data.dominantHand !== undefined) updateData.dominantHand = data.dominantHand === "" ? null : data.dominantHand
    if (data.standingTouch !== undefined) updateData.standingTouch = data.standingTouch === "" ? null : data.standingTouch
    if (data.spikeTouch !== undefined) updateData.spikeTouch = data.spikeTouch === "" ? null : data.spikeTouch
    if (data.blockTouch !== undefined) updateData.blockTouch = data.blockTouch === "" ? null : data.blockTouch
    if (data.gpa !== undefined) updateData.gpa = data.gpa === "" ? null : data.gpa
    if (data.areaOfStudy !== undefined) updateData.areaOfStudy = data.areaOfStudy === "" ? null : data.areaOfStudy
    if (data.careerGoals !== undefined) updateData.careerGoals = data.careerGoals === "" ? null : data.careerGoals

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
        data: { 
          draftProfileId: newProfile.id
        } as any, // Type assertion needed for Prisma 7 compatibility
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to update profile", details: errorMessage },
      { status: 500 }
    )
  }
}
