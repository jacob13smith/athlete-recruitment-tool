"use client"

import VideoEmbed from "./VideoEmbed"
import { formatPhoneNumber } from "@/lib/utils"
import NextImage from "next/image"

interface Video {
  id: string
  url: string
  title: string | null
  order: number
}

interface Profile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  graduationYear: string | null
  highSchool: string | null
  club: string | null
  otherTeams: string | null
  residence: string | null
  province: string | null
  height: string | null
  primaryPosition: string | null
  secondaryPosition: string | null
  dominantHand: string | null
  standingTouch: string | null
  spikeTouch: string | null
  blockTouch: string | null
  gpa: string | null
  areaOfStudy: string | null
  careerGoals: string | null
  profileImageUrl?: string | null
  videos: Video[]
}

interface PublicProfileProps {
  profile: Profile
}

export default function PublicProfile({ profile }: PublicProfileProps) {
  // Helper function to render a field if it has a value
  const renderField = (label: string, value: string | null | undefined, fullWidth: boolean = false) => {
    if (!value || value.trim() === "") return null

    return (
      <div className={`bg-gray-50 rounded-lg px-3 border border-gray-200 ${fullWidth ? "col-span-2" : ""}`}>
        <dt className="text-base font-semibold text-gray-500">{label}</dt>
        <dd className="text-lg text-gray-900 font-medium">{value}</dd>
      </div>
    )
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")

  // Build list of info items for the banner
  const infoItems: string[] = []
  if (profile.primaryPosition) infoItems.push(profile.primaryPosition)
  if (profile.graduationYear) infoItems.push(`Class of ${profile.graduationYear}`)
  // Third spot: City, Province
  if (profile.residence || profile.province) {
    const hometown = [profile.residence, profile.province].filter(Boolean).join(", ")
    if (hometown) infoItems.push(hometown)
  }
  // Fourth spot: Club if exists, otherwise High School
  if (profile.club) {
    infoItems.push(profile.club)
  } else if (profile.highSchool) {
    infoItems.push(profile.highSchool)
  }

  // Check if section has any content
  const hasBasicInfo = profile.primaryPosition || profile.dominantHand || profile.residence || profile.province || profile.graduationYear
  const hasAthleticProfile = profile.primaryPosition || profile.secondaryPosition || profile.dominantHand || profile.height || profile.standingTouch || profile.spikeTouch || profile.blockTouch
  const hasTeams = profile.highSchool || profile.club || profile.otherTeams
  const hasAcademics = profile.gpa || profile.areaOfStudy || profile.careerGoals
  const hasContact = profile.email || profile.phone

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-8">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          {/* Top Level Header - Athlete's Name */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-4 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-6 justify-center">
              {profile.profileImageUrl ? (
                <>
                  <div className="relative basis-1/3 min-w-[33%] flex justify-center">
                    <NextImage
                      src={profile.profileImageUrl}
                      alt={fullName || "Profile"}
                      width={220}
                      height={220}
                      className="rounded-full object-cover border-4 border-white shadow-lg"
                      style={{ boxSizing: 'border-box' }}
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1 max-w-xs sm:max-w-none">
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                      {fullName || "Athlete Profile"}
                    </h1>
                    <div className="text-sm sm:text-lg lg:text-xl text-blue-100">
                      {infoItems.map((item, index) => (
                        <div
                          key={index}
                          className="py-1 sm:py-2 border-b border-blue-500/50 last:border-b-0"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white">
                      {fullName || "Athlete Profile"}
                    </h1>
                  </div>
                  <div className="min-w-0 flex-1 max-w-xs sm:max-w-none">
                    <div className="text-sm sm:text-lg lg:text-xl text-blue-100">
                      {infoItems.map((item, index) => (
                        <div
                          key={index}
                          className="py-1 sm:py-2 border-b border-blue-500/50 last:border-b-0"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* First Section: Basic Info (primary position, handedness, hometown, grad year) */}
          {hasBasicInfo && (
            <div className="p-2 sm:px-8 sm:py-6 border-b border-gray-200">
              <dl className="grid grid-cols-2 gap-x-1 gap-y-1 sm:gap-y-3">
                {renderField("Primary Position", profile.primaryPosition)}
                {renderField("Handedness", profile.dominantHand)}
                {(profile.residence || profile.province) && (
                  <div className="bg-gray-50 rounded-lg px-3 border border-gray-200">
                    <dt className="text-base font-semibold text-gray-500">Hometown</dt>
                    <dd className="text-lg text-gray-900 font-medium">
                      {[profile.residence, profile.province].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
                {renderField("Graduation Year", profile.graduationYear)}
              </dl>
            </div>
          )}

          {/* Second Section: Videos */}
          {profile.videos && profile.videos.length > 0 && (
            <div className="p-2 sm:px-8 sm:py-6 border-b border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Gameplay
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {profile.videos.map((video) => (
                  <div 
                    key={video.id}
                    className="bg-white rounded-lg p-1 sm:p-4 h-full" 
                    style={{ 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {video.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-3 px-2">
                        {video.title}
                      </h3>
                    )}
                    <VideoEmbed url={video.url} title={video.title} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Third Section: Athletic Profile */}
          {hasAthleticProfile && (
            <div className="p-2 sm:px-8 sm:py-6 border-b border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Athletic Profile
              </h2>
              <dl className="grid grid-cols-2 gap-x-1 gap-y-2 sm:gap-y-3">
                {renderField("Primary Position", profile.primaryPosition, true)}
                {renderField("Secondary Position", profile.secondaryPosition, true)}
                {renderField("Height", profile.height)}
                {renderField("Standing Reach", profile.standingTouch)}
                {renderField("Spike Touch", profile.spikeTouch)}
                {renderField("Block Touch", profile.blockTouch)}
                {renderField("Handedness", profile.dominantHand, true)}
              </dl>
            </div>
          )}

          {/* Fourth Section: Teams */}
          {hasTeams && (
            <div className="p-2 sm:px-8 sm:py-6 border-b border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Teams
              </h2>
              <dl className="grid grid-cols-2 gap-x-1 gap-y-2 sm:gap-y-3">
                {renderField("High School", profile.highSchool)}
                {renderField("Club", profile.club)}
                {renderField("Other Teams", profile.otherTeams, true)}
              </dl>
            </div>
          )}

          {/* Fifth Section: Academics */}
          {hasAcademics && (
            <div className="p-2 sm:px-8 sm:py-6 border-b border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Academics
              </h2>
              <dl className="grid grid-cols-2 gap-x-1 gap-y-2 sm:gap-y-3">
                {renderField("Average Grade", profile.gpa)}
                {renderField("Area of Study", profile.areaOfStudy)}
                {profile.careerGoals && (
                  <div className="bg-gray-50 rounded-lg px-3 border border-gray-200 col-span-2">
                    <dt className="text-base font-semibold text-gray-500">Career Goals</dt>
                    <dd className="text-lg text-gray-900 font-medium whitespace-pre-line">{profile.careerGoals}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Sixth Section: Contact */}
          {hasContact && (
            <div className="p-2 sm:px-8 sm:py-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Contact
              </h2>
              <dl className="grid grid-cols-2 gap-x-1 gap-y-2 sm:gap-y-3">
                {profile.email && (
                  <div className="bg-gray-50 rounded-lg px-3 border border-gray-200 col-span-2 sm:col-span-1">
                    <dt className="text-base font-semibold text-gray-500">Email</dt>
                    <dd className="text-lg">
                      <a 
                        href={`mailto:${profile.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {profile.email}
                      </a>
                    </dd>
                  </div>
                )}
                {profile.phone && (
                  <div className="bg-gray-50 rounded-lg px-3 border border-gray-200 col-span-2 sm:col-span-1">
                    <dt className="text-base font-semibold text-gray-500">Phone</dt>
                    <dd className="text-lg">
                      <a 
                        href={`tel:${profile.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {formatPhoneNumber(profile.phone)}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Powered by RecruitMe */}
          <div className="px-4 py-3 sm:px-8 sm:py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">Powered by</span>
              <a
                href="/"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                RecruitMe
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
