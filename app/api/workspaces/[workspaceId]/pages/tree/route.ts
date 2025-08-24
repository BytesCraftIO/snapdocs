import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { buildPageTree, calculateTreeMeta } from '@/lib/services/pages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'

    // Verify user has access to workspace (handle both ID and slug)
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { id: workspaceId },
          { slug: workspaceId }
        ],
        members: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get all pages in the workspace
    const pages = await prisma.page.findMany({
      where: {
        workspaceId: workspace.id,
        isDeleted: false,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { title: 'asc' }
      ]
    })

    // Build the tree structure
    const pageTree = buildPageTree(pages)

    // Get user's favorite pages (this would be from a user preferences table)
    const favoritePageIds: string[] = [] // TODO: Implement favorites

    // Calculate metadata
    const meta = calculateTreeMeta(pageTree, favoritePageIds)

    return NextResponse.json({
      tree: pageTree,
      meta,
      totalPages: pages.length
    })

  } catch (error) {
    console.error('Error fetching page tree:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}