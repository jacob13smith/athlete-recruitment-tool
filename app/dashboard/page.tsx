import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <LogoutButton />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{session.user.email}</p>
            </div>
            {session.user.name && (
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-medium">{session.user.name}</p>
              </div>
            )}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600">
                Welcome to ShowOff! Profile management features coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
