"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/LoginForm"
import SignupForm from "@/components/SignupForm"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard")
    }
  }, [status, session, router])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-gray-500">Loading...</div>
      </main>
    )
  }

  // Don't render login/signup if authenticated (will redirect)
  if (status === "authenticated") {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          <h1 className="text-center text-4xl font-bold tracking-tight text-gray-900">
            RecruitMe
          </h1>
          <p className="text-center text-base font-medium text-gray-700">
            Create and share your volleyball profile
          </p>
        </div>

        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          {isSignup ? "Create your account" : "Sign in to your account"}
        </h2>

        <div className="bg-white py-8 px-6 rounded-lg sm:px-10" style={{ boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px 0 rgba(0, 0, 0, 0.15)' }}>
          {isSignup ? (
            <SignupForm onToggle={() => setIsSignup(false)} />
          ) : (
            <LoginForm onToggle={() => setIsSignup(true)} />
          )}
        </div>
      </div>
    </main>
  )
}
