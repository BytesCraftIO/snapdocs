import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { calculateNewOrder, validatePageMove, buildPageTree } from '@/lib/services/pages'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const { targetPageId, position, workspaceId } = await request.json()

    // Validate required fields
    if (!targetPageId || !position || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: targetPageId, position, workspaceId' },
        { status: 400 }
      )
    }

    if (!['before', 'after', 'inside'].includes(position)) {
      return NextResponse.json(
        { error: 'Invalid position. Must be: before, after, or inside' },
        { status: 400 }
      )
    }

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
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

    // Get the pages to move and target
    const [pageToMove, targetPage] = await Promise.all([
      prisma.page.findUnique({
        where: { id: pageId, workspaceId }
      }),
      prisma.page.findUnique({
        where: { id: targetPageId, workspaceId }
      })
    ])

    if (!pageToMove || !targetPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get all pages to validate the move
    const allPages = await prisma.page.findMany({
      where: { workspaceId, isDeleted: false }
    })

    const pageTree = buildPageTree(allPages)

    // Validate the move operation
    const moveOperation = {
      pageId,
      newParentId: position === 'inside' ? targetPageId : targetPage.parentId,
      newOrder: 0, // Will be calculated
      oldParentId: pageToMove.parentId,
      oldOrder: pageToMove.order
    }

    const validation = validatePageMove(moveOperation, pageTree)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate new order and parent
    let newParentId: string | null = targetPage.parentId
    let newOrder: number

    if (position === 'inside') {
      newParentId = targetPageId
      // Get children of target to calculate order
      const children = allPages.filter(p => p.parentId === targetPageId)
      newOrder = calculateNewOrder(children, children.length)
    } else {
      // Get siblings of target page
      const siblings = allPages.filter(p => p.parentId === targetPage.parentId)
      const targetIndex = siblings.findIndex(p => p.id === targetPageId)
      
      if (position === 'before') {
        newOrder = calculateNewOrder(siblings, targetIndex)
      } else { // after
        newOrder = calculateNewOrder(siblings, targetIndex + 1)
      }
    }

    // Update the page
    await prisma.page.update({
      where: { id: pageId },
      data: {
        parentId: newParentId,
        order: newOrder,
        // Update path for hierarchical queries
        path: newParentId 
          ? `${targetPage.path}/${pageId}`
          : `/${pageId}`
      }
    })

    // Update paths of all descendant pages
    const descendants = allPages.filter(p => p.path.startsWith(`${pageToMove.path}/`))
    for (const descendant of descendants) {
      const newPath = descendant.path.replace(
        pageToMove.path,
        newParentId ? `${targetPage.path}/${pageId}` : `/${pageId}`
      )
      
      await prisma.page.update({
        where: { id: descendant.id },
        data: { path: newPath }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error moving page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}