"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import Image from "next/image"

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  onImageChange?: (imageUrl: string | null) => void
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageChange,
}: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, or WebP image.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Upload image
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      setImageUrl(data.imageUrl)
      onImageChange?.(data.imageUrl)
      toast.success('Profile image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!imageUrl) return

    if (!confirm('Are you sure you want to delete your profile image?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/profile/image', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      setImageUrl(null)
      onImageChange?.(null)
      toast.success('Profile image deleted successfully')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete image')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mb-6">
      <label className="block text-base font-medium text-gray-700 mb-3">
        Profile Image
      </label>
      
      <div className="flex items-start gap-6">
        {/* Image Preview */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="relative">
              <Image
                src={imageUrl}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-gray-300"
                unoptimized // Supabase URLs are already optimized
              />
            </div>
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={isUploading || isDeleting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUploading ? 'Uploading...' : imageUrl ? 'Replace Image' : 'Upload Image'}
            </button>
            
            {imageUrl && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            JPG, PNG, or WebP. Max 5MB. Image will be resized to 800x800px.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
