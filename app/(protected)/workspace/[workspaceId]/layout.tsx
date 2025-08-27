import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

interface WorkspaceLayoutPageProps {
  children: React.ReactNode
  params: Promise<{
    workspaceId: string
  }>
}

export default async function Layout({ children, params }: WorkspaceLayoutPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    notFound()
  }

  const resolvedParams = await params
  
  // Verify user has access to this workspace
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: resolvedParams.workspaceId },
        { slug: resolvedParams.workspaceId }
      ],
      members: {
        some: {
          userId: user.id
        }
      }
    }
  })

  if (!workspace) {
    notFound()
  }

  // The parent (protected) layout already includes the sidebar
  // Just render the children
  return <>{children}</>
}