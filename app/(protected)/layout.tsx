import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SnapDocsSidebar } from "@/components/layout/snapdocs-sidebar"
import { ClientLayout } from "./ClientLayout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { InvalidSessionHandler } from "./InvalidSessionHandler"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // First check if there's a valid session
  const session = await getServerSession(authOptions)
  
  if (!session) {
    // No valid session, redirect to login
    redirect("/login")
  }
  
  // Then get the full user data
  const user = await getCurrentUser()

  if (!user) {
    // Session exists but user not found in database
    // This means the session is invalid (user was deleted or session is corrupted)
    console.error(`Session exists but user not found in database: ${session.user?.id}`)
    // Return a client component that will clear the session
    return <InvalidSessionHandler />
  }

  return (
    <ClientLayout>
      <div className="flex h-screen bg-white dark:bg-[#191919]">
        <SnapDocsSidebar user={user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ClientLayout>
  )
}