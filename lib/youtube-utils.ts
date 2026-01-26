/**
 * YouTube URL validation and video ID extraction utilities
 */

export interface YouTubeValidationResult {
  isValid: boolean
  videoId: string | null
  error?: string
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null
  }

  // Remove whitespace
  url = url.trim()

  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Validates a YouTube URL and extracts the video ID
 */
export function validateYouTubeUrl(url: string): YouTubeValidationResult {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return {
      isValid: false,
      videoId: null,
      error: "URL is required",
    }
  }

  const trimmedUrl = url.trim()
  const videoId = extractYouTubeVideoId(trimmedUrl)

  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      error: "Invalid YouTube URL. Please use a valid YouTube video URL.",
    }
  }

  // Validate video ID format (11 characters, alphanumeric, dash, underscore)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      isValid: false,
      videoId: null,
      error: "Invalid YouTube video ID format",
    }
  }

  return {
    isValid: true,
    videoId,
  }
}

/**
 * Generates a YouTube embed URL from a video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Generates a YouTube watch URL from a video ID
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
