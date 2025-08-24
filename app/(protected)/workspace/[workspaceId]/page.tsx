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

  // Get recent pages in workspace
  const recentPages = await prisma.page.findMany({
    where: {
      workspaceId: workspace.id,
      isDeleted: false,
      isArchived: false
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 10,
    include: {
      author: {
        select: {
          name: true,
          avatarUrl: true
        }
      }
    }
  })

  // Get workspace statistics
  const [totalPages, archivedPages, totalMembers] = await Promise.all([
    prisma.page.count({
      where: {
        workspaceId: workspace.id,
        isDeleted: false
      }
    }),
    prisma.page.count({
      where: {
        workspaceId: workspace.id,
        isArchived: true,
        isDeleted: false
      }
    }),
    prisma.workspaceMember.count({
      where: {
        workspaceId: workspace.id
      }
    })
  ])

  return {
    workspace,
    recentPages,
    stats: {
      totalPages,
      archivedPages,
      totalMembers
    }
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

  const { workspace, recentPages, stats } = data

  return (
    <WorkspaceDashboard 
      workspace={workspace}
      recentPages={recentPages}
      stats={stats}
      currentUser={user}
    />
  )
}