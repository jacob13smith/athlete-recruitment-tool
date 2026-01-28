"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "An error occurred")
        return
      }

      setSuccess(true)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          <h1 className="text-center text-4xl font-bold tracking-tight text-gray-900">
            RecruitMe
          </h1>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
        </div>

        <div className="bg-white py-8 px-6 rounded-lg sm:px-10" style={{ boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px 0 rgba(0, 0, 0, 0.15)' }}>
          {success ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  If an account with that email exists, you will receive a password reset link.
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="/"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="you@example.com"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </div>

              <div className="text-center text-sm">
                <Link
                  href="/"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
