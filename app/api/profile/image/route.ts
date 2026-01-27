import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateImage, processImage, uploadToSupabase, deleteFromSupabase } from '@/lib/image-utils'

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/profile/image
 * Upload a profile image
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate image
    const validation = await validateImage(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get user's draft profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { draftProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete old image if exists
    if (user.draftProfile?.profileImageUrl) {
      try {
        await deleteFromSupabase(user.draftProfile.profileImageUrl)
      } catch (error) {
        // Log but don't fail if old image deletion fails
        console.error('Failed to delete old image:', error)
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image (resize, optimize)
    const processedBuffer = await processImage(buffer)

    // Upload to Supabase Storage
    const imageUrl = await uploadToSupabase(processedBuffer, user.id, file.name)

    // Create or update draft profile with image URL
    if (!user.draftProfileId) {
      // Create new draft profile
      const newProfile = await db.profile.create({
        data: {
          profileImageUrl: imageUrl,
        },
      })

      await db.user.update({
        where: { id: user.id },
        data: { draftProfileId: newProfile.id },
      })
    } else {
      // Update existing draft profile
      await db.profile.update({
        where: { id: user.draftProfileId },
        data: { profileImageUrl: imageUrl },
      })
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to upload image', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/image
 * Delete the profile image
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's draft profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { draftProfile: true },
    })

    if (!user || !user.draftProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const imageUrl = user.draftProfile.profileImageUrl

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 })
    }

    // Delete from Supabase Storage
    try {
      await deleteFromSupabase(imageUrl)
    } catch (error) {
      // Log but continue to update database even if storage deletion fails
      console.error('Failed to delete image from storage:', error)
    }

    // Clear image URL from profile
    await db.profile.update({
      where: { id: user.draftProfileId! },
      data: { profileImageUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete image', details: errorMessage },
      { status: 500 }
    )
  }
}
