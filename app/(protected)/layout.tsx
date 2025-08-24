import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { NotionSidebar } from "@/components/layout/notion-sidebar"
import { ClientLayout } from "./ClientLayout"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <ClientLayout>
      <div className="flex h-screen bg-white dark:bg-[#191919]">
        <NotionSidebar user={user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ClientLayout>
  )
}