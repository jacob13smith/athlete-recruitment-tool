"use client"

import { extractYouTubeVideoId } from "@/lib/youtube-utils"

interface VideoEmbedProps {
  url: string
  title?: string | null
  className?: string
}

export default function VideoEmbed({ url, title, className = "" }: VideoEmbedProps) {
  const videoId = extractYouTubeVideoId(url)

  if (!videoId) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        Invalid YouTube URL
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className={`w-full ${className}`}>
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
        <iframe
          src={embedUrl}
          title={title || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          loading="lazy"
        />
      </div>
    </div>
  )
}
