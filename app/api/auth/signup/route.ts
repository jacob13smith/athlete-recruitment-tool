import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/utils"
import { z } from "zod"

// Prevent static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = signupSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsedData.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    
    const errorObj = error as { code?: string; message?: string }
    const errorMessage = errorObj?.message || (error instanceof Error ? error.message : String(error))
    
    // Check if it's a Prisma error about missing table
    if (errorObj?.code === "P2021" || errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database table not found. Please run 'npm run db:push' to set up the database.",
          details: errorMessage || "Database schema not initialized"
        },
        { status: 500 }
      )
    }
    
    // Check for unique constraint violation (duplicate email)
    if (errorObj?.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    )
  }
}
