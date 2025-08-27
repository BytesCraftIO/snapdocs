import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { WorkspaceDashboard } from './WorkspaceDashboard'

interface WorkspacePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

async function getWorkspaceData(workspaceId: string, userId: string) {
  // Get workspace and verify access (handle both ID and slug)
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: workspaceId },
        { slug: workspaceId }
      ],
      members: {
        some: {
          userId: userId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          joinedAt: 'asc'
        }
      }
    }
  })

  if (!workspace) {
    return null
  }

  // Get recent pages that the user has created or edited
  const recentPages = await prisma.page.findMany({
    where: {
      workspaceId: workspace.id,
      isDeleted: false,
      isArchived: false,
      OR: [
        { authorId: userId },  // Pages created by the user
        { 
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Pages updated in last 30 days
          }
        }
      ]
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 15,  // Show up to 15 recent pages
    select: {
      id: true,
      title: true,
      icon: true,
      updatedAt: true,
      authorId: true
    }
  })

  return {
    workspace,
    recentPages
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    notFound()
  }

  const resolvedParams = await params
  const data = await getWorkspaceData(resolvedParams.workspaceId, user.id)

  if (!data) {
    notFound()
  }

  const { workspace, recentPages } = data

  return (
    <WorkspaceDashboard 
      workspace={workspace}
      recentPages={recentPages}
      currentUser={user}
    />
  )
}