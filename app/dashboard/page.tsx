import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"
import DashboardClient from "@/components/DashboardClient"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-2xl rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <LogoutButton />
          </div>

          <DashboardClient />
        </div>
      </div>
    </div>
  )
}
