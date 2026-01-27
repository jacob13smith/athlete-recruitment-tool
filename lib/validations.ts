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
  phone: z.string().optional(),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, "Graduation year must be 4 digits")
    .optional()
    .or(z.literal("")),
  highSchool: z.string().optional(),
  club: z.string().optional(),
  otherTeams: z.string().optional(),
  residence: z.string().optional(),
  province: z.string().optional(),
  height: z.string().optional(),
  primaryPosition: z.enum(POSITION_OPTIONS as unknown as [string, ...string[]]).optional().or(z.literal("")),
  secondaryPosition: z.enum(POSITION_OPTIONS as unknown as [string, ...string[]]).optional().or(z.literal("")),
  dominantHand: z.enum(["Left", "Right"] as unknown as [string, ...string[]]).optional().or(z.literal("")),
  standingTouch: z.string().optional(),
  spikeTouch: z.string().optional(),
  blockTouch: z.string().optional(),
  gpa: z.string().optional(),
  areaOfStudy: z.string().optional(),
  careerGoals: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
