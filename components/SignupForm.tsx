"use client"

import { useState } from "react"

interface SignupFormProps {
  onToggle: () => void
}

export default function SignupForm({ onToggle }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState("")

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters" }
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" }
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" }
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" }
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" }
    }
    return { valid: true, message: "" }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
    setError("")
    setShowSuccessModal(false)
    
    // Update password strength feedback
    if (e.target.name === "password") {
      if (value.length === 0) {
        setPasswordStrength("")
      } else {
        const validation = validatePassword(value)
        setPasswordStrength(validation.message)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShowSuccessModal(false)
    setLoading(true)

    try {
      // Validate password strength
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.valid) {
        setError(passwordValidation.message)
        setLoading(false)
        return
      }

      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      // Handle signup
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "An error occurred")
        return
      }

      setShowSuccessModal(true)
      setFormData({ email: "", password: "", confirmPassword: "" })
      setPasswordStrength("")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSignIn = () => {
    setShowSuccessModal(false)
    onToggle()
  }

  return (
    <>
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-success-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 20px 50px -12px rgba(0,0,0,0.25)" }}
          >
            <h2
              id="signup-success-title"
              className="text-xl font-bold text-gray-900 sm:text-2xl"
            >
              Account created
            </h2>
            <p className="mt-4 text-gray-600">
              We sent a verification link to your email—check your inbox (and spam). You can sign in
              now; verify your email before publishing your profile.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleBackToSignIn}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        {passwordStrength && (
          <div className="rounded-md bg-yellow-50 p-3">
            <p className="text-xs text-yellow-800">
              <strong>Password requirements:</strong> {passwordStrength}
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={onToggle}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </button>
        </div>
      </form>
    </>
  )
}
