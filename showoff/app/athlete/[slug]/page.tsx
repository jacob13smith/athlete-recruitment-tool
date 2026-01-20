import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AthletePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await prisma.profile.findUnique({
    where: { publicSlug: params.slug },
    include: { videos: true },
  });

  if (!profile || !profile.publishedAt) return notFound();

  return (
    <main>
      <h1>{profile.name}</h1>
      <p>{profile.position} · Class of {profile.graduationYear}</p>

      {profile.videos.map((v) => (
        <iframe
          key={v.id}
          src={`https://www.youtube.com/embed/${v.youtubeId}`}
          allowFullScreen
        />
      ))}
    </main>
  );
}
