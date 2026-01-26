"use client"

import VideoEmbed from "./VideoEmbed"

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
  videos: Video[]
}

interface PublicProfileProps {
  profile: Profile
}

export default function PublicProfile({ profile }: PublicProfileProps) {
  // Helper function to render a field if it has a value
  const renderField = (label: string, value: string | null | undefined) => {
    if (!value || value.trim() === "") return null

    return (
      <div className="py-2">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-base text-gray-900">{value}</dd>
      </div>
    )
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")

  // Check if section has any content
  const hasBasicInfo = profile.primaryPosition || profile.height || profile.graduationYear || profile.residence
  const hasAthleticProfile = profile.primaryPosition || profile.secondaryPosition || profile.dominantHand || profile.height || profile.standingTouch || profile.spikeTouch || profile.blockTouch
  const hasTeams = profile.highSchool || profile.club || profile.otherTeams
  const hasAcademics = profile.gpa || profile.areaOfStudy || profile.careerGoals
  const hasContact = profile.email || profile.phone

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          {/* Top Level Header - Athlete's Name */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {fullName || "Athlete Profile"}
            </h1>
          </div>

          {/* First Section: Basic Info (primary position, height, grad year, home city) */}
          {hasBasicInfo && (
            <div className="px-6 py-6 sm:px-8 border-b border-gray-200">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {renderField("Primary Position", profile.primaryPosition)}
                {renderField("Height", profile.height)}
                {renderField("Graduation Year", profile.graduationYear)}
                {renderField("Home City", profile.residence)}
              </dl>
            </div>
          )}

          {/* Second Section: Videos */}
          {profile.videos && profile.videos.length > 0 && (
            <div className="px-6 py-6 sm:px-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Videos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profile.videos.map((video) => (
                  <div key={video.id} className="bg-white rounded-lg p-4" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' }}>
                    {video.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
            <div className="px-6 py-6 sm:px-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Athletic Profile
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {renderField("Primary Position", profile.primaryPosition)}
                {renderField("Secondary Position", profile.secondaryPosition)}
                {/* Note: Dominant hand and block touch not in schema */}
                {renderField("Height", profile.height)}
                {renderField("Standing Reach", profile.standingTouch)}
                {renderField("Spike Touch", profile.spikeTouch)}
                {/* Note: Block touch not in schema - using spikeTouch for now */}
              </dl>
            </div>
          )}

          {/* Fourth Section: Teams */}
          {hasTeams && (
            <div className="px-6 py-6 sm:px-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Teams
              </h2>
              <dl className="space-y-3">
                {renderField("High School", profile.highSchool)}
                {renderField("Club", profile.club)}
                {renderField("Other Teams", profile.otherTeams)}
              </dl>
            </div>
          )}

          {/* Fifth Section: Academics */}
          {hasAcademics && (
            <div className="px-6 py-6 sm:px-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Academics
              </h2>
              <dl className="space-y-3">
                {renderField("Average Grade", profile.gpa)}
                {/* Note: Area of study and career goals not in schema */}
              </dl>
            </div>
          )}

          {/* Sixth Section: Contact */}
          {hasContact && (
            <div className="px-6 py-6 sm:px-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact
              </h2>
              <dl className="space-y-3">
                {profile.email && (
                  <div className="py-2">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-base">
                      <a 
                        href={`mailto:${profile.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {profile.email}
                      </a>
                    </dd>
                  </div>
                )}
                {profile.phone && (
                  <div className="py-2">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-base">
                      <a 
                        href={`tel:${profile.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {profile.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
