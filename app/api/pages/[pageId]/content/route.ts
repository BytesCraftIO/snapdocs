import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { pageContentService } from '@/lib/services/page-content'
import { Block } from '@/types'

// GET /api/pages/[pageId]/content - Get page content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    // Check if page exists and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false
      },
      select: {
        id: true,
        authorId: true,
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

    // Get page content from MongoDB
    const pageContent = await pageContentService.loadPageContent(pageId)

    return NextResponse.json({
      pageContent: pageContent || {
        pageId,
        blocks: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error getting page content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/pages/[pageId]/content - Update page content
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
    const { blocks } = body as { blocks: Block[] }

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
        authorId: true,
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

    // Save content immediately (optimized for real-time collaboration)
    const savedContent = await pageContentService.savePageContent(pageId, blocks)

    // Update page metadata in PostgreSQL
    await prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      pageContent: savedContent
    })
  } catch (error) {
    console.error('Error updating page content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[pageId]/content - Delete page content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    // Check if page exists and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false
      },
      select: {
        id: true,
        authorId: true,
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

    // Delete page content
    const deleted = await pageContentService.deletePageContent(pageId)

    if (!deleted) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}