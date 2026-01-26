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
  graduationYear: string | null
  highSchool: string | null
  club: string | null
  residence: string | null
  height: string | null
  primaryPosition: string | null
  secondaryPosition: string | null
  gpa: string | null
  standingTouch: string | null
  spikeTouch: string | null
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
      <div className="py-3 border-b border-gray-200">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-base text-gray-900">{value}</dd>
      </div>
    )
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {fullName || "Athlete Profile"}
            </h1>
            {profile.email && (
              <p className="mt-2 text-blue-100">{profile.email}</p>
            )}
          </div>

          {/* Profile Information */}
          <div className="px-6 py-6 sm:px-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Profile Information
            </h2>

            <dl className="divide-y divide-gray-200">
              {renderField("First Name", profile.firstName)}
              {renderField("Last Name", profile.lastName)}
              {renderField("Email", profile.email)}
              {renderField("Graduation Year", profile.graduationYear)}
              {renderField("High School", profile.highSchool)}
              {renderField("Club", profile.club)}
              {renderField("City of Residence", profile.residence)}
              {renderField("Height", profile.height)}
              {renderField("Primary Position", profile.primaryPosition)}
              {renderField("Secondary Position", profile.secondaryPosition)}
              {renderField("GPA", profile.gpa)}
              {renderField("Standing Touch", profile.standingTouch)}
              {renderField("Spike Touch", profile.spikeTouch)}
            </dl>
          </div>

          {/* Videos Section */}
          {profile.videos && profile.videos.length > 0 && (
            <div className="px-6 py-6 sm:px-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Videos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profile.videos.map((video) => (
                  <div key={video.id} className="bg-gray-50 rounded-lg p-4">
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
        </div>
      </div>
    </div>
  )
}
