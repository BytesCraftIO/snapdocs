import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const workspaceId = searchParams.get('workspaceId')

    // For now, we'll use page update timestamp as "recent"
    // In a production app, you'd track actual page access/view events
    
    const whereClause: any = {
      isDeleted: false,
      isArchived: false,
      workspace: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const recentPages = await prisma.page.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      }
    })

    // Transform to RecentPage format
    const formattedPages = recentPages.map(page => ({
      pageId: page.id,
      title: page.title,
      icon: page.icon,
      workspaceId: page.workspaceId,
      lastAccessedAt: page.updatedAt, // Using updatedAt as proxy for access time
      workspace: page.workspace
    }))

    return NextResponse.json(formattedPages)

  } catch (error) {
    console.error('Error fetching recent pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to track page access (for real recent page tracking)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await request.json()

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      )
    }

    // Verify the page exists and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create an activity record for page access
    await prisma.activity.create({
      data: {
        type: 'PAGE_UPDATED', // Using existing enum value
        description: `Viewed page: ${page.title}`,
        userId: user.id,
        pageId: pageId,
        metadata: {
          action: 'view',
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error tracking page access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}