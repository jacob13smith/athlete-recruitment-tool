"use client"

import { useState, useEffect, useRef } from "react"
import { POSITION_OPTIONS, type ProfileFormData } from "@/lib/validations"
import { toast } from "sonner"

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData> | null
  formRef?: React.RefObject<ProfileFormRef>
  onSaveStateChange?: (isSaving: boolean) => void
  onHasChangesChange?: (hasChanges: boolean) => void
}

export default function ProfileForm({ initialData, formRef: externalFormRef, onSaveStateChange, onHasChangesChange }: ProfileFormProps) {
  const formElementRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    graduationYear: "",
    highSchool: "",
    club: "",
    otherTeams: "",
    residence: "",
    height: "",
    primaryPosition: "",
    secondaryPosition: "",
    dominantHand: "",
    standingTouch: "",
    spikeTouch: "",
    blockTouch: "",
    gpa: "",
    areaOfStudy: "",
    careerGoals: "",
    ...initialData,
  })
  const [savedData, setSavedData] = useState<Partial<ProfileFormData> | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load profile data on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        const normalizedData = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          graduationYear: data.graduationYear || "",
          highSchool: data.highSchool || "",
          club: data.club || "",
          otherTeams: data.otherTeams || "",
          residence: data.residence || "",
          height: data.height || "",
          primaryPosition: data.primaryPosition || "",
          secondaryPosition: data.secondaryPosition || "",
          dominantHand: data.dominantHand || "",
          standingTouch: data.standingTouch || "",
          spikeTouch: data.spikeTouch || "",
          blockTouch: data.blockTouch || "",
          gpa: data.gpa || "",
          areaOfStudy: data.areaOfStudy || "",
          careerGoals: data.careerGoals || "",
        }
        setFormData((prev) => ({
          ...prev,
          ...normalizedData,
        }))
        // Store saved data for comparison
        setSavedData(normalizedData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (formData.email && formData.email !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    // Graduation year validation
    if (formData.graduationYear && formData.graduationYear !== "") {
      if (!/^\d{4}$/.test(formData.graduationYear)) {
        newErrors.graduationYear = "Graduation year must be 4 digits"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors below")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const savedData = await response.json()
        // Update saved data after successful save
        const normalizedSavedData = {
          firstName: savedData.firstName || "",
          lastName: savedData.lastName || "",
          email: savedData.email || "",
          phone: savedData.phone || "",
          graduationYear: savedData.graduationYear || "",
          highSchool: savedData.highSchool || "",
          club: savedData.club || "",
          otherTeams: savedData.otherTeams || "",
          residence: savedData.residence || "",
          height: savedData.height || "",
          primaryPosition: savedData.primaryPosition || "",
          secondaryPosition: savedData.secondaryPosition || "",
          dominantHand: savedData.dominantHand || "",
          standingTouch: savedData.standingTouch || "",
          spikeTouch: savedData.spikeTouch || "",
          blockTouch: savedData.blockTouch || "",
          gpa: savedData.gpa || "",
          areaOfStudy: savedData.areaOfStudy || "",
          careerGoals: savedData.careerGoals || "",
        }
        setSavedData(normalizedSavedData)
        toast.success("Profile saved successfully!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Expose submit function via ref and notify parent of save state
  // IMPORTANT: This must be called before any early returns
  useEffect(() => {
    if (externalFormRef && externalFormRef.current) {
      // Update the ref object
      Object.assign(externalFormRef.current, {
        submit: () => {
          if (formElementRef.current) {
            formElementRef.current.requestSubmit()
          }
        },
        isSaving,
      })
    }
    if (onSaveStateChange) {
      onSaveStateChange(isSaving)
    }
  }, [externalFormRef, isSaving, onSaveStateChange])

  // Check if form has unsaved changes and notify parent
  useEffect(() => {
    if (!savedData || !onHasChangesChange) return

    const hasChanges = Object.keys(formData).some((key) => {
      const formValue = formData[key as keyof ProfileFormData] || ""
      const savedValue = savedData[key as keyof ProfileFormData] || ""
      return formValue !== savedValue
    })

    onHasChangesChange(hasChanges)
  }, [formData, savedData, onHasChangesChange])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  return (
    <form ref={formElementRef} onSubmit={handleSubmit} className="space-y-6">

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-base font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-base font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-base font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-base px-3 py-2 ${
              errors.email
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          <div className="h-5 mt-1">
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-base font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="e.g., (555) 123-4567"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Graduation Year */}
        <div>
          <label htmlFor="graduationYear" className="block text-base font-medium text-gray-700">
            Graduation Year
          </label>
          <input
            type="text"
            id="graduationYear"
            name="graduationYear"
            value={formData.graduationYear || ""}
            onChange={handleChange}
            placeholder="YYYY"
            maxLength={4}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-base px-3 py-2 ${
              errors.graduationYear
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          <div className="h-5 mt-1">
            {errors.graduationYear && (
              <p className="text-sm text-red-600">{errors.graduationYear}</p>
            )}
          </div>
        </div>

        {/* High School */}
        <div>
          <label htmlFor="highSchool" className="block text-base font-medium text-gray-700">
            High School
          </label>
          <input
            type="text"
            id="highSchool"
            name="highSchool"
            value={formData.highSchool || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Club */}
        <div>
          <label htmlFor="club" className="block text-base font-medium text-gray-700">
            Club
          </label>
          <input
            type="text"
            id="club"
            name="club"
            value={formData.club || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Other Teams */}
        <div>
          <label htmlFor="otherTeams" className="block text-base font-medium text-gray-700">
            Other Teams
          </label>
          <input
            type="text"
            id="otherTeams"
            name="otherTeams"
            value={formData.otherTeams || ""}
            onChange={handleChange}
            placeholder="e.g., Provincial team, National team"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* City of Residence */}
        <div>
          <label htmlFor="residence" className="block text-base font-medium text-gray-700">
            City of Residence
          </label>
          <input
            type="text"
            id="residence"
            name="residence"
            value={formData.residence || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Height */}
        <div>
          <label htmlFor="height" className="block text-base font-medium text-gray-700">
            Height
          </label>
          <input
            type="text"
            id="height"
            name="height"
            value={formData.height || ""}
            onChange={handleChange}
            placeholder="e.g., 5'10&quot;"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Primary Position */}
        <div>
          <label htmlFor="primaryPosition" className="block text-base font-medium text-gray-700">
            Primary Position
          </label>
          <select
            id="primaryPosition"
            name="primaryPosition"
            value={formData.primaryPosition || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          >
            <option value="">Select a position</option>
            {POSITION_OPTIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Position */}
        <div>
          <label htmlFor="secondaryPosition" className="block text-base font-medium text-gray-700">
            Secondary Position
          </label>
          <select
            id="secondaryPosition"
            name="secondaryPosition"
            value={formData.secondaryPosition || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          >
            <option value="">Select a position</option>
            {POSITION_OPTIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {/* Handedness */}
        <div>
          <label htmlFor="dominantHand" className="block text-base font-medium text-gray-700">
            Handedness
          </label>
          <select
            id="dominantHand"
            name="dominantHand"
            value={formData.dominantHand || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          >
            <option value="">Select hand</option>
            <option value="Left">Left</option>
            <option value="Right">Right</option>
          </select>
        </div>

        {/* GPA */}
        <div>
          <label htmlFor="gpa" className="block text-base font-medium text-gray-700">
            GPA
          </label>
          <input
            type="text"
            id="gpa"
            name="gpa"
            value={formData.gpa || ""}
            onChange={handleChange}
            placeholder="e.g., 85%"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Standing Touch */}
        <div>
          <label htmlFor="standingTouch" className="block text-base font-medium text-gray-700">
            Standing Touch
          </label>
          <input
            type="text"
            id="standingTouch"
            name="standingTouch"
            value={formData.standingTouch || ""}
            onChange={handleChange}
            placeholder="e.g., 9'2&quot;"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Spike Touch */}
        <div>
          <label htmlFor="spikeTouch" className="block text-base font-medium text-gray-700">
            Spike Touch
          </label>
          <input
            type="text"
            id="spikeTouch"
            name="spikeTouch"
            value={formData.spikeTouch || ""}
            onChange={handleChange}
            placeholder="e.g., 10'0&quot;"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Block Touch */}
        <div>
          <label htmlFor="blockTouch" className="block text-base font-medium text-gray-700">
            Block Touch
          </label>
          <input
            type="text"
            id="blockTouch"
            name="blockTouch"
            value={formData.blockTouch || ""}
            onChange={handleChange}
            placeholder="e.g., 9'8&quot;"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Area of Study */}
        <div>
          <label htmlFor="areaOfStudy" className="block text-base font-medium text-gray-700">
            Area of Study
          </label>
          <input
            type="text"
            id="areaOfStudy"
            name="areaOfStudy"
            value={formData.areaOfStudy || ""}
            onChange={handleChange}
            placeholder="e.g., Business, Engineering, Sciences"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>

        {/* Career Goals */}
        <div className="sm:col-span-2">
          <label htmlFor="careerGoals" className="block text-base font-medium text-gray-700">
            Career Goals
          </label>
          <textarea
            id="careerGoals"
            name="careerGoals"
            value={formData.careerGoals || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your career goals and aspirations..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-3 py-2"
          />
        </div>
      </div>

      {/* Save button removed - now in sticky footer */}
    </form>
  )
}

// Export type for form ref for external submission
export type ProfileFormRef = {
  submit: () => void
  isSaving: boolean
}
