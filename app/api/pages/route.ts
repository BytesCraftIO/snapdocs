import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { pageContentService } from '@/lib/services/page-content'
import { generateId } from '@/lib/utils/id'

// GET /api/pages - List pages (with filters)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const parentId = searchParams.get('parentId')
    const archived = searchParams.get('archived') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      isDeleted: false,
      authorId: user.id // TODO: Extend to workspace permissions
    }

    if (workspaceId) {
      where.workspaceId = workspaceId
    }

    if (parentId) {
      where.parentId = parentId
    } else if (searchParams.has('parentId')) {
      // parentId=null to get root pages
      where.parentId = null
    }

    if (archived !== null) {
      where.isArchived = archived
    }

    const pages = await prisma.page.findMany({
      where,
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
        _count: {
          select: {
            children: {
              where: {
                isDeleted: false
              }
            }
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await prisma.page.count({ where })

    return NextResponse.json({
      pages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + pages.length < total
      }
    })
  } catch (error) {
    console.error('Error listing pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, workspaceId, parentId, icon, coverImage } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    // Verify workspace exists and user has access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        // TODO: Add workspace membership check
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // If parentId provided, verify parent page exists and user has access
    if (parentId) {
      const parentPage = await prisma.page.findFirst({
        where: {
          id: parentId,
          workspaceId,
          isDeleted: false,
          // TODO: Add permission check
        }
      })

      if (!parentPage) {
        return NextResponse.json({ error: 'Parent page not found' }, { status: 404 })
      }
    }

    // Get the next order number for pages at this level
    const lastPage = await prisma.page.findFirst({
      where: {
        workspaceId,
        parentId: parentId || null,
        isDeleted: false
      },
      orderBy: { order: 'desc' }
    })

    const order = (lastPage?.order || 0) + 1

    // Generate page path
    const path = parentId 
      ? `${parentId}/${generateId()}`
      : generateId()

    // Create page in PostgreSQL
    const page = await prisma.page.create({
      data: {
        id: generateId(),
        title: title || 'Untitled',
        icon,
        coverImage,
        workspaceId,
        authorId: user.id,
        parentId,
        path,
        order,
        isPublished: false,
        isArchived: false,
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
        }
      }
    })

    // Create initial content in MongoDB
    const initialBlocks = [
      {
        id: generateId(),
        type: 'paragraph' as const,
        content: '',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    await pageContentService.savePageContent(page.id, initialBlocks)

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}