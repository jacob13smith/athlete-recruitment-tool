"use client"

type LoadingSpinnerProps = {
  /** Optional label (below spinner by default, beside when inline) */
  label?: string
  /** Size: sm (24px), md (32px), lg (40px) */
  size?: "sm" | "md" | "lg"
  /** Inline layout: spinner and label in a row (e.g. for compact UIs) */
  inline?: boolean
  /** Additional class names for the wrapper */
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-2",
}

export default function LoadingSpinner({
  label,
  size = "md",
  inline = false,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center ${inline ? "flex-row gap-2 justify-start" : "flex-col gap-3 justify-center"} ${className}`}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <div
        className={`rounded-full border-gray-200 border-t-blue-600 animate-spin shrink-0 ${sizeClasses[size]}`}
      />
      {label && (
        <span className="text-sm text-gray-500">{label}</span>
      )}
    </div>
  )
}
