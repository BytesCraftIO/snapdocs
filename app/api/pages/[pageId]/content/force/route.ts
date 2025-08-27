import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { pageContentService } from '@/lib/services/page-content'
import { Block } from '@/types'

// PUT /api/pages/[pageId]/content/force - Force save content (override conflicts)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const body = await request.json()
    const { blocks, force } = body as { blocks: Block[], force: boolean }

    if (!force) {
      return NextResponse.json(
        { error: 'Force flag must be set to true' },
        { status: 400 }
      )
    }

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'Invalid blocks data' },
        { status: 400 }
      )
    }

    // Check if page exists and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false
      },
      select: {
        id: true,
        workspaceId: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: page.workspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Force save the content
    const savedContent = await pageContentService.savePageContent(pageId, blocks, user.id)

    // Update page metadata
    await prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      pageContent: savedContent,
      forced: true
    })
  } catch (error) {
    console.error('Error force saving content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}