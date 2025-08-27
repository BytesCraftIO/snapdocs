import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'
import { generateId } from '@/lib/utils/id'

// GET /api/databases - List databases
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    // Check workspace access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const databases = await prisma.database.findMany({
      where: {
        workspaceId
      },
      include: {
        views: true,
        rows: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(databases)
  } catch (error) {
    console.error('Error fetching databases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/databases - Create database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, workspaceId, pageId, properties, viewType } = body

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'name and workspaceId are required' },
        { status: 400 }
      )
    }

    // Check workspace access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Default properties if none provided
    const defaultProperties = properties || [
      {
        id: generateId(),
        name: 'Name',
        type: 'text',
        options: {}
      }
    ]

    // Create database with default view
    const database = await prisma.database.create({
      data: {
        id: generateId(),
        name,
        description,
        viewType: viewType || 'TABLE',
        properties: defaultProperties,
        workspaceId,
        pageId
      }
    })

    // Create default view
    const defaultView = await prisma.databaseView.create({
      data: {
        id: generateId(),
        name: 'All',
        type: viewType || 'TABLE',
        config: {
          wrap: false
        },
        isDefault: true,
        databaseId: database.id
      }
    })

    return NextResponse.json({
      ...database,
      views: [defaultView],
      rows: []
    })
  } catch (error) {
    console.error('Error creating database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}