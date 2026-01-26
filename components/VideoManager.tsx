"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react"
import { validateYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube-utils"
import VideoEmbed from "./VideoEmbed"
import { toast } from "sonner"

interface Video {
  id: string
  url: string
  title: string | null
  order: number
}

interface VideoManagerProps {
  onChangesChange?: (hasChanges: boolean) => void
}

export interface VideoManagerRef {
  saveChanges: () => Promise<boolean>
}

const MAX_VIDEOS = 10

const VideoManager = forwardRef<VideoManagerRef, VideoManagerProps>(
  ({ onChangesChange }, ref) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [originalVideos, setOriginalVideos] = useState<Video[]>([])
  const [deletedVideoIds, setDeletedVideoIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)

  // Form state
  const [videoUrl, setVideoUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)


  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/videos")
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
        setOriginalVideos(data)
        setDeletedVideoIds(new Set())
      } else {
        toast.error("Failed to load videos")
      }
    } catch (error) {
      console.error("Error loading videos:", error)
      toast.error("Failed to load videos")
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  // Check if there are pending video changes
  const hasVideoChanges = useCallback((): boolean => {
    // Check for deletions
    if (deletedVideoIds.size > 0) return true

    // Check for additions (videos in current list but not in original)
    const currentIds = new Set(videos.map(v => v.id))
    const originalIds = new Set(originalVideos.map(v => v.id))
    const hasAdditions = videos.some(v => !originalIds.has(v.id))
    if (hasAdditions) return true

    // Check for edits (videos that exist in both but have different data)
    for (const video of videos) {
      if (deletedVideoIds.has(video.id)) continue
      const original = originalVideos.find(v => v.id === video.id)
      if (original && (original.url !== video.url || original.title !== video.title)) {
        return true
      }
    }

    return false
  }, [videos, deletedVideoIds, originalVideos])

  // Notify parent of changes
  useEffect(() => {
    if (onChangesChange) {
      onChangesChange(hasVideoChanges())
    }
  }, [videos, deletedVideoIds, originalVideos, onChangesChange, hasVideoChanges])

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      try {
        // Delete videos that were marked for deletion
        for (const videoId of deletedVideoIds) {
          const deleteResponse = await fetch(`/api/videos/${videoId}`, {
            method: "DELETE",
          })
          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json()
            throw new Error(errorData.error || "Failed to delete video")
          }
        }

        // Add new videos
        const newVideos = videos.filter(v => v.id.startsWith("temp-"))
        for (const video of newVideos) {
          const addResponse = await fetch("/api/videos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: video.url,
              title: video.title || undefined,
            }),
          })
          if (!addResponse.ok) {
            const errorData = await addResponse.json()
            throw new Error(errorData.error || "Failed to add video")
          }
        }

        // Update edited videos
        const editedVideos = videos.filter(v => {
          if (v.id.startsWith("temp-")) return false // New videos handled above
          if (deletedVideoIds.has(v.id)) return false // Deleted videos handled above
          const original = originalVideos.find(ov => ov.id === v.id)
          return original && (original.url !== v.url || original.title !== v.title)
        })

        for (const video of editedVideos) {
          const updateResponse = await fetch(`/api/videos/${video.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: video.url,
              title: video.title || undefined,
            }),
          })
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json()
            throw new Error(errorData.error || "Failed to update video")
          }
        }

        // Reload videos to get fresh state from DB
        await loadVideos()
        return true
      } catch (error) {
        console.error("Error saving video changes:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to save video changes"
        toast.error(errorMessage)
        return false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [videos, deletedVideoIds, originalVideos, loadVideos])

  const clearMessages = () => {
    setUrlError(null)
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    // Validate URL
    const validation = validateYouTubeUrl(videoUrl)
    if (!validation.isValid) {
      setUrlError(validation.error || "Invalid YouTube URL")
      return
    }

    // Count videos excluding deleted ones
    const activeVideos = videos.filter(v => !deletedVideoIds.has(v.id))
    if (activeVideos.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`)
      return
    }

    // Check for duplicate video ID (including deleted ones that might be restored)
    const newVideoId = validation.videoId
    if (newVideoId) {
      const existingVideoIds = videos.map((v) => extractYouTubeVideoId(v.url)).filter(Boolean)
      if (existingVideoIds.includes(newVideoId)) {
        toast.error("This video is already in your profile")
        return
      }
    }

    // Add video locally (not saved to DB yet)
    const newVideo: Video = {
      id: `temp-${Date.now()}`, // Temporary ID for new videos
      url: validation.videoId
        ? `https://www.youtube.com/watch?v=${validation.videoId}`
        : videoUrl,
      title: videoTitle || null,
      order: videos.length,
    }

    setVideos([...videos, newVideo])
    setVideoUrl("")
    setVideoTitle("")
    toast.success("Video added (save to persist changes)")
  }

  const handleEditVideo = async (videoId: string, url: string, title: string) => {
    clearMessages()

    // Validate URL if changed
    if (url) {
      const validation = validateYouTubeUrl(url)
      if (!validation.isValid) {
        setUrlError(validation.error || "Invalid YouTube URL")
        return
      }

      // Check for duplicate video ID (excluding current video)
      const newVideoId = validation.videoId
      if (newVideoId) {
        const otherVideos = videos.filter((v) => v.id !== videoId)
        const existingVideoIds = otherVideos
          .map((v) => extractYouTubeVideoId(v.url))
          .filter(Boolean)
        if (existingVideoIds.includes(newVideoId)) {
          setUrlError("This video is already in your profile")
          return
        }
      }
    }

    // Update video locally (not saved to DB yet)
    const updatedVideo: Video = {
      ...videos.find(v => v.id === videoId)!,
      url: url || videos.find(v => v.id === videoId)!.url,
      title: title || null,
    }

    setVideos(videos.map((v) => (v.id === videoId ? updatedVideo : v)))
    setIsEditing(null)
    toast.success("Video updated (save to persist changes)")
  }

  const handleDeleteVideo = (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return
    }

    clearMessages()

    // If it's a new video (temp ID), just remove it
    if (videoId.startsWith("temp-")) {
      setVideos(videos.filter((v) => v.id !== videoId))
      toast.success("Video removed (save to persist changes)")
      return
    }

    // If it's an existing video, mark it for deletion
    setDeletedVideoIds(new Set([...deletedVideoIds, videoId]))
    setVideos(videos.filter((v) => v.id !== videoId))
    toast.success("Video removed (save to persist changes)")
  }



  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[400px]">
        <div className="text-gray-500">Loading videos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Add Video Form */}
      {!isEditing && videos.length < MAX_VIDEOS && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Video</h3>
          <form onSubmit={handleAddVideo} className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
                YouTube URL *
              </label>
              <input
                type="text"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  setUrlError(null)
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                  urlError
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                required
              />
              <div className="h-5 mt-1">
                {urlError && (
                  <p className="text-sm text-red-600">{urlError}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-700">
                Title (optional)
              </label>
              <input
                type="text"
                id="videoTitle"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Video title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAdding || !videoUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {isAdding ? "Adding..." : "Add Video"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Video Count */}
      <div className="text-sm text-gray-600">
        {videos.length} / {MAX_VIDEOS} videos
      </div>

      {/* Video List */}
      {videos.filter(v => !deletedVideoIds.has(v.id)).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No videos added yet. Add your first video above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.filter(v => !deletedVideoIds.has(v.id)).map((video, index) => (
            <div
              key={video.id}
              className="bg-white border-2 rounded-lg p-3 border-gray-200 hover:border-gray-300 transition-all animate-in"
            >
              {isEditing === video.id ? (
                <EditVideoForm
                  video={video}
                  onSave={(url, title) => handleEditVideo(video.id, url, title)}
                  onCancel={() => {
                    setIsEditing(null)
                    clearMessages()
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">#{index + 1}</span>
                        {video.title && (
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {video.title}
                          </h4>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditing(video.id)
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors min-w-[45px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteVideo(video.id)
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors min-w-[55px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <VideoEmbed url={video.url} title={video.title} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
  }
)

// Edit Video Form Component
function EditVideoForm({
  video,
  onSave,
  onCancel,
}: {
  video: Video
  onSave: (url: string, title: string) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState(video.url)
  const [title, setTitle] = useState(video.title || "")
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate URL
    const validation = validateYouTubeUrl(url)
    if (!validation.isValid) {
      setUrlError(validation.error || "Invalid YouTube URL")
      return
    }

    onSave(url, title)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="editUrl" className="block text-sm font-medium text-gray-700">
          YouTube URL *
        </label>
        <input
          type="text"
          id="editUrl"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setUrlError(null)
          }}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
            urlError
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          }`}
          required
        />
        <div className="h-5 mt-1">
          {urlError && (
            <p className="text-sm text-red-600">{urlError}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700">
          Title (optional)
        </label>
        <input
          type="text"
          id="editTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-w-[70px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[70px]"
        >
          Save
        </button>
      </div>
    </form>
  )
}

VideoManager.displayName = "VideoManager"

export default VideoManager
