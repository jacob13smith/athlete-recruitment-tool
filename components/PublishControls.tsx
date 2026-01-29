"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import PublishModal from "./PublishModal"
import { toast } from "sonner"
import LoadingSpinner from "./LoadingSpinner"

interface PublishStatus {
  hasUnpublishedChanges: boolean
  isPublished: boolean
  emailVerified: boolean
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
  const [isResending, setIsResending] = useState(false)
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

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || "Verification email sent. Check your inbox.")
      } else {
        toast.error(data.error || "Failed to send verification email.")
      }
    } catch (err) {
      console.error("Resend verification error:", err)
      toast.error("Failed to send verification email.")
    } finally {
      setIsResending(false)
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
      <div className="min-h-[60px] flex items-center">
        <LoadingSpinner label="Loading publish status..." size="sm" inline />
      </div>
    )
  }

  if (!status) {
    return null
  }

  // Button text: "Publish Changes" if already published AND there are saved changes, otherwise "Publish"
  const buttonText = status.isPublished && status.hasUnpublishedChanges
    ? "Publish Changes"
    : "Publish"

  // Publish enabled only when email verified AND (has changes OR first-time publish)
  const isPublishEnabled =
    status.emailVerified && (status.hasUnpublishedChanges || !status.isPublished)

  return (
    <div className="space-y-4">
      {!status.emailVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Verify your email to publish your profile.
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="mt-2 text-sm font-medium text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
          >
            {isResending ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-shrink">
          <p className="text-sm font-medium text-gray-700">
            {status.isPublished ? "Published" : "Not Published"}
          </p>
          {status.isPublished && status.slug && (
            <a
              href={`/athlete/${status.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-blue-600 hover:text-blue-800 underline mt-2 block flex items-center gap-2 break-all"
            >
              <span className="break-words">{typeof window !== "undefined" ? window.location.origin : ""}/athlete/{status.slug}</span>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
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
