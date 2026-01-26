"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import PublishModal from "./PublishModal"
import { toast } from "sonner"

interface PublishStatus {
  hasUnpublishedChanges: boolean
  isPublished: boolean
  slug: string | null
}

interface PublishControlsProps {
  onPublish?: () => Promise<void>
}

export interface PublishControlsRef {
  refreshStatus: () => Promise<void>
}

const PublishControls = forwardRef<PublishControlsRef, PublishControlsProps>(
  ({ onPublish }, ref) => {
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  // Expose refresh method to parent via ref
  useImperativeHandle(ref, () => ({
    refreshStatus: loadStatus,
  }), [])

  const loadStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        toast.error("Failed to load publish status")
      }
    } catch (error) {
      console.error("Error loading status:", error)
        toast.error("Failed to load publish status")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)

    try {
      const response = await fetch("/api/profile/publish", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        // Reload status to get updated slug
        await loadStatus()
        setShowModal(true)
        toast.success("Profile published successfully!")
        // Call onPublish callback if provided (to trigger parent refresh)
        if (onPublish) {
          await onPublish()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to publish profile")
      }
    } catch (error) {
      console.error("Error publishing profile:", error)
      toast.error("Failed to publish profile")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm("Are you sure you want to unpublish your profile? It will no longer be publicly accessible.")) {
      return
    }

    setIsUnpublishing(true)

    try {
      const response = await fetch("/api/profile/unpublish", {
        method: "POST",
      })

      if (response.ok) {
        await loadStatus()
        toast.success("Profile unpublished successfully")
        // Call onPublish callback if provided (to trigger parent refresh)
        if (onPublish) {
          await onPublish()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to unpublish profile")
      }
    } catch (error) {
      console.error("Error unpublishing profile:", error)
      toast.error("Failed to unpublish profile")
    } finally {
      setIsUnpublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 min-h-[60px] flex items-center">Loading publish status...</div>
    )
  }

  if (!status) {
    return null
  }

  // Button text: "Publish Changes" if already published AND there are saved changes, otherwise "Publish"
  const buttonText = status.isPublished && status.hasUnpublishedChanges
    ? "Publish Changes"
    : "Publish"

  // Button enabled: only if there are saved changes in the draft profile (hasUnpublishedChanges)
  // OR if not published yet (first time publishing)
  const isPublishEnabled = status.hasUnpublishedChanges || !status.isPublished

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {status.isPublished ? "Published" : "Not Published"}
          </p>
          {status.isPublished && status.slug && (
            <a
              href={`/athlete/${status.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/athlete/{status.slug}
            </a>
          )}
        </div>

        <div className="flex gap-2">
          {status.isPublished && (
            <button
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[110px]"
            >
              {isUnpublishing ? "Unpublishing..." : "Unpublish"}
            </button>
          )}

          <button
            onClick={handlePublish}
            disabled={isPublishing || !isPublishEnabled}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[130px]"
          >
            {isPublishing ? "Publishing..." : buttonText}
          </button>
        </div>
      </div>

      {showModal && status.slug && (
        <PublishModal
          slug={status.slug}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
})

PublishControls.displayName = "PublishControls"

export default PublishControls
