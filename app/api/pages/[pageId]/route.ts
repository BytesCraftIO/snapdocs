import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { pageContentService } from '@/lib/services/page-content'

// GET /api/pages/[pageId] - Get page metadata and content
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

    // Get page metadata from PostgreSQL
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            path: true
          }
        }
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

    // Optionally get content if requested
    const includeContent = request.nextUrl.searchParams.get('includeContent') === 'true'
    let pageContent = null

    if (includeContent) {
      pageContent = await pageContentService.loadPageContent(pageId)
    }

    return NextResponse.json({
      page,
      content: pageContent
    })
  } catch (error) {
    console.error('Error getting page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/pages/[pageId] - Update page metadata
export async function PATCH(
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

    // Validate and extract allowed fields
    const allowedFields = ['title', 'icon', 'coverImage', 'isPublished', 'isArchived']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Check if page exists and user has access
    const existingPage = await prisma.page.findFirst({
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

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: existingPage.workspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update page
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ page: updatedPage })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[pageId] - Delete page
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

    // Get all descendant pages (recursive)
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const children = await prisma.page.findMany({
        where: {
          parentId: parentId,
          isDeleted: false
        },
        select: { id: true }
      })
      
      let allDescendants = children.map(c => c.id)
      
      for (const child of children) {
        const childDescendants = await getAllDescendants(child.id)
        allDescendants = [...allDescendants, ...childDescendants]
      }
      
      return allDescendants
    }
    
    // Get all pages to delete (current page + all descendants)
    const descendantIds = await getAllDescendants(pageId)
    const allPageIds = [pageId, ...descendantIds]
    
    // Soft delete all pages (parent and descendants) in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.page.updateMany({
        where: {
          id: {
            in: allPageIds
          }
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      })
    })

    // Optionally delete content from MongoDB
    // For now, keep content for potential recovery
    // await pageContentService.deletePageContent(pageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}