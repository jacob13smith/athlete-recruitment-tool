"use client"

interface WelcomeModalProps {
  onGotIt: () => void
  onShowMeAround: () => void
}

export default function WelcomeModal({ onGotIt, onShowMeAround }: WelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 20px 50px -12px rgba(0,0,0,0.25)" }}
      >
        <h2
          id="welcome-title"
          className="text-xl font-bold text-gray-900 sm:text-2xl"
        >
          Build your recruitment profile
        </h2>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>•</span>
            Add your photo, info, and volleyball highlights.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>•</span>
            Save your draft, then publish to get a shareable link.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>•</span>
            Coaches and recruiters can view your profile at that link.
          </li>
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onShowMeAround}
            className="order-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:order-1"
          >
            Show me around
          </button>
          <button
            onClick={onGotIt}
            className="order-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:order-2"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
