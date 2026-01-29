"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/LoadingSpinner"

const cardStyle = {
  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px 0 rgba(0, 0, 0, 0.15)",
}

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token || submitted) return
    setSubmitted(true)
    setLoading(true)
    setError("")

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Verification failed.")
          return
        }
        setSuccess(true)
        setTimeout(() => router.push("/dashboard"), 2000)
      })
      .catch(() => setError("An error occurred. Please try again."))
      .finally(() => setLoading(false))
  }, [token, submitted, router])

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            RecruitMe
          </h1>
          <div className="rounded-lg bg-white py-8 px-6 sm:px-10" style={cardStyle}>
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Invalid or missing verification link. Use the link from your verification email, or
                request a new one from your dashboard.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="text-center font-medium text-blue-600 hover:text-blue-500"
              >
                Go to dashboard
              </Link>
              <Link
                href="/"
                className="text-center font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          RecruitMe
        </h1>
        <h2 className="text-center text-xl font-semibold text-gray-900">
          Verify your email
        </h2>
        <div className="rounded-lg bg-white py-8 px-6 sm:px-10" style={cardStyle}>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" label="Verifying…" />
            </div>
          ) : success ? (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Email verified! You can now publish your profile. Redirecting to dashboard…
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="text-center font-medium text-blue-600 hover:text-blue-500"
                >
                  Go to dashboard
                </Link>
                <Link
                  href="/"
                  className="text-center font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <LoadingSpinner size="lg" />
        </main>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
