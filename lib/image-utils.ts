import sharp from 'sharp'
import { getSupabaseAdmin, PROFILE_IMAGES_BUCKET } from './supabase-storage'
import { generateUUID } from './uuid-utils'

/**
 * Validates an image file
 */
export async function validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.',
    }
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.',
    }
  }

  return { valid: true }
}

/**
 * Processes and resizes an image
 * Returns optimized image buffer
 */
export async function processImage(buffer: Buffer): Promise<Buffer> {
  try {
    // Resize to max 800x800px, maintain aspect ratio
    // Convert to JPEG with 85% quality for good compression
    const processed = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    return processed
  } catch (error) {
    throw new Error('Failed to process image')
  }
}

/**
 * Uploads an image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadToSupabase(
  buffer: Buffer,
  userId: string,
  originalFilename: string
): Promise<string> {
  const supabase = getSupabaseAdmin()

  // Generate unique filename
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${userId}/${generateUUID()}.${extension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: false, // Don't overwrite existing files
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filename)

  return publicUrl
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteFromSupabase(imageUrl: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Extract file path from URL
  // URL format: https://{project}.supabase.co/storage/v1/object/public/profile-images/{path}
  const urlParts = imageUrl.split('/')
  const pathIndex = urlParts.findIndex((part) => part === PROFILE_IMAGES_BUCKET)
  
  if (pathIndex === -1 || pathIndex === urlParts.length - 1) {
    throw new Error('Invalid image URL format')
  }

  const filePath = urlParts.slice(pathIndex + 1).join('/')

  // Delete from Supabase Storage
  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .remove([filePath])

  if (error) {
    // Don't throw if file doesn't exist (already deleted)
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return
    }
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}
