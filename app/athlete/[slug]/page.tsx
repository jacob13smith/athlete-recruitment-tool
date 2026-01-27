import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import PublicProfile from "@/components/PublicProfile"
import type { Metadata } from "next"

interface PageProps {
  params: {
    slug: string
  }
}

// Generate dynamic metadata for each profile page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    include: {
      publishedProfile: {
        include: {
          videos: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  // If user not found or not published, return default metadata
  if (!user || !user.isPublished || !user.publishedProfile) {
    return {
      title: "RecruitMe - Profile Not Found",
      description: "Create and share your volleyball profile for recruiters and coaches",
    }
  }

  const profile = user.publishedProfile
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Athlete"
  
  // Generate a one-line summary from profile data
  const summaryParts: string[] = []
  if (profile.primaryPosition) summaryParts.push(profile.primaryPosition)
  if (profile.highSchool) summaryParts.push(`from ${profile.highSchool}`)
  if (profile.graduationYear) summaryParts.push(`Class of ${profile.graduationYear}`)
  if (profile.club) summaryParts.push(`plays for ${profile.club}`)
  
  const description = summaryParts.length > 0
    ? `${fullName} - ${summaryParts.join(", ")}. View their volleyball profile and gameplay videos.`
    : `${fullName}'s volleyball recruitment profile. View their stats, achievements, and gameplay videos.`

  // Get the base URL for Open Graph
  const baseUrl = process.env.NEXTAUTH_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000"

  return {
    title: `RecruitMe - ${fullName}`,
    description,
    openGraph: {
      title: `RecruitMe - ${fullName}`,
      description,
      type: "profile",
      url: `${baseUrl}/athlete/${params.slug}`,
      // You can add an image URL here if you want to show a profile image
      // images: profile.profileImageUrl ? [{ url: profile.profileImageUrl }] : [],
    },
    twitter: {
      card: "summary",
      title: `RecruitMe - ${fullName}`,
      description,
      // You can add an image here too
      // images: profile.profileImageUrl ? [profile.profileImageUrl] : [],
    },
  }
}

export default async function AthleteProfilePage({ params }: PageProps) {
  // Fetch User by slug
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    include: {
      publishedProfile: {
        include: {
          videos: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  // Check User.isPublished (404 if false or doesn't exist)
  if (!user || !user.isPublished || !user.publishedProfile) {
    notFound()
  }

  // Render published Profile fields only (not draft Profile)
  return <PublicProfile profile={user.publishedProfile} />
}
