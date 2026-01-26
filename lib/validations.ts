import { z } from "zod"

// Position enum options
export const POSITION_OPTIONS = [
  "Setter",
  "Outside Hitter",
  "Opposite / Right Side",
  "Middle Blocker",
  "Libero",
  "Defensive Specialist",
] as const

export type Position = (typeof POSITION_OPTIONS)[number]

// Profile validation schema
export const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, "Graduation year must be 4 digits")
    .optional()
    .or(z.literal("")),
  highSchool: z.string().optional(),
  club: z.string().optional(),
  residence: z.string().optional(),
  height: z.string().optional(),
  primaryPosition: z.enum(POSITION_OPTIONS as [string, ...string[]]).optional().or(z.literal("")),
  secondaryPosition: z.enum(POSITION_OPTIONS as [string, ...string[]]).optional().or(z.literal("")),
  gpa: z.string().optional(),
  standingTouch: z.string().optional(),
  spikeTouch: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
