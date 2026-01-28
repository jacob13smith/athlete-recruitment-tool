"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"

// Refetch session periodically so rolling refresh (updateAge) can extend token when user is active
const SESSION_REFETCH_INTERVAL = 5 * 60 // 5 minutes, in seconds

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL}>
      {children}
      <Toaster position="top-right" duration={7000} />
    </SessionProvider>
  )
}
