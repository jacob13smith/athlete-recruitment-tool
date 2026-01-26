import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import PublicProfile from "@/components/PublicProfile"

interface PageProps {
  params: {
    slug: string
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
