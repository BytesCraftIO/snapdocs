import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'
import { DatabasePageClient } from './DatabasePageClient'

interface DatabasePageProps {
  params: Promise<{
    workspaceId: string
    databaseId: string
  }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    notFound()
  }

  const resolvedParams = await params

  // Fetch database with all related data
  const database = await prisma.database.findUnique({
    where: {
      id: resolvedParams.databaseId
    },
    include: {
      views: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      rows: {
        orderBy: {
          order: 'asc'
        }
      },
      workspace: {
        include: {
          members: {
            where: {
              userId: session.user.id
            }
          }
        }
      }
    }
  })

  if (!database) {
    notFound()
  }

  // Check if user has access to the workspace
  if (!database.workspace.members.length) {
    notFound()
  }

  // Verify the database belongs to the correct workspace
  if (database.workspaceId !== resolvedParams.workspaceId) {
    notFound()
  }

  // Transform the data for the client component
  const transformedDatabase = {
    id: database.id,
    name: database.name,
    description: database.description || undefined,
    icon: undefined, // TODO: Add icon field to database model
    cover: undefined, // TODO: Add cover field to database model
    properties: database.properties as any[],
    views: database.views.map(view => ({
      ...view,
      type: view.type.toLowerCase() as any, // Convert from Prisma enum to TypeScript type
      filters: [], // TODO: Parse from config
      sorts: [], // TODO: Parse from config
      properties: {}, // TODO: Parse from config
      config: view.config as any
    })),
    defaultView: database.views[0]?.id,
    workspaceId: database.workspaceId,
    pageId: database.pageId || undefined,
    createdAt: database.createdAt,
    updatedAt: database.updatedAt,
    rows: database.rows.map(row => ({
      ...row,
      databaseId: database.id,
      properties: row.properties as Record<string, any>,
      createdBy: session.user.id, // TODO: Store actual creator
      lastEditedBy: session.user.id, // TODO: Track last editor
      lastEditedTime: row.updatedAt
    }))
  }

  return (
    <DatabasePageClient
      database={transformedDatabase}
      workspaceId={resolvedParams.workspaceId}
    />
  )
}

export async function generateMetadata({ params }: DatabasePageProps) {
  const resolvedParams = await params
  const database = await prisma.database.findUnique({
    where: {
      id: resolvedParams.databaseId
    },
    select: {
      name: true
    }
  })

  return {
    title: database?.name || 'Database'
  }
}