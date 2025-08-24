import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's first workspace
  const workspace = await prisma.workspace.findFirst({
    where: {
      members: {
        some: {
          userId: user.id
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  if (!workspace) {
    // Show empty state - sidebar will show create button
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold">Welcome to Notion Clone</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Create your first workspace from the sidebar dropdown to get started
          </p>
        </div>
      </div>
    )
  }

  // Redirect to the workspace
  redirect(`/workspace/${workspace.id}`)
}