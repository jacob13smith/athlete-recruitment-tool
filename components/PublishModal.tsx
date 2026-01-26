"use client"

import { useState } from "react"

interface PublishModalProps {
  slug: string
  onClose: () => void
}

export default function PublishModal({ slug, onClose }: PublishModalProps) {
  const [copied, setCopied] = useState(false)

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/athlete/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Profile Published!
        </h2>

        <p className="text-gray-600 mb-4">
          Your profile is now live and accessible at:
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center gap-2">
          <input
            type="text"
            value={publicUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-700 border-none outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Share this link with recruiters, coaches, and anyone you want to see your profile.
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
