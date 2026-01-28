"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import ProfileForm, { type ProfileFormRef } from "./ProfileForm"
import VideoManager, { type VideoManagerRef } from "./VideoManager"
import PublishControls, { type PublishControlsRef } from "./PublishControls"

export default function DashboardClient() {
  const profileFormRef = useRef<ProfileFormRef>({
    submit: () => {},
    isSaving: false,
  })
  const videoManagerRef = useRef<VideoManagerRef>(null)
  const publishControlsRef = useRef<PublishControlsRef>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasProfileChanges, setHasProfileChanges] = useState(false)
  const [hasVideoChanges, setHasVideoChanges] = useState(false)

  const hasChanges = hasProfileChanges || hasVideoChanges

  // Callback to update isSaving state
  const updateIsSaving = useCallback((saving: boolean) => {
    setIsSaving(saving)
  }, [])

  // Callback to update profile changes state
  const updateHasProfileChanges = useCallback((hasChanges: boolean) => {
    setHasProfileChanges(hasChanges)
  }, [])

  // Callback to update video changes state
  const updateHasVideoChanges = useCallback((hasChanges: boolean) => {
    setHasVideoChanges(hasChanges)
  }, [])

  // Browser route guard - warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        // Modern browsers ignore custom messages, but we still need to call preventDefault
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasChanges])

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    
    try {
      // Save profile changes
      if (hasProfileChanges && profileFormRef.current) {
        profileFormRef.current.submit()
        // Wait a bit for profile save to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Save video changes
      if (hasVideoChanges && videoManagerRef.current) {
        await videoManagerRef.current.saveChanges()
      }

      // Refresh publish status after saving to update button enabled/disabled state
      if (publishControlsRef.current) {
        await publishControlsRef.current.refreshStatus()
      }
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setIsSaving(false)
    }
  }, [hasProfileChanges, hasVideoChanges])

  // Refresh publish status after save (to update hasUnpublishedChanges)
  const handlePublishRefresh = async () => {
    // PublishControls handles its own refresh after publish/unpublish
    // This callback is kept for potential future use
  }

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (hasChanges && !isSaving) handleSaveDraft()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasChanges, isSaving, handleSaveDraft])

  return (
    <>
      <div className="space-y-8 pb-24">
        {/* Athlete Information Section */}
        <div data-onboarding="athlete-info">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Athlete Information
          </h2>
          <ProfileForm 
            formRef={profileFormRef} 
            onSaveStateChange={updateIsSaving}
            onHasChangesChange={updateHasProfileChanges}
            onImageChange={async () => {
              // Refresh publish status after image upload/delete
              if (publishControlsRef.current) {
                await publishControlsRef.current.refreshStatus()
              }
            }}
          />
        </div>

            {/* Videos Section */}
            <div className="pt-8 border-t border-gray-200" data-onboarding="videos">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Videos
              </h2>
              <VideoManager 
                onChangesChange={updateHasVideoChanges}
                ref={videoManagerRef}
              />
            </div>

            {/* Publish Status Section */}
            <div className="pt-8 border-t border-gray-200" data-onboarding="publish-status">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Publish Status
              </h2>
              <PublishControls ref={publishControlsRef} onPublish={handlePublishRefresh} />
            </div>
          </div>

      {/* Sticky Footer with Save Draft Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom" data-onboarding="save-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-end">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !hasChanges}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium min-w-[140px]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
