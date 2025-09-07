import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'
import { generateId } from '@/lib/utils/id'

// POST /api/databases/[databaseId]/views - Create new view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    // Validate view type
    const validTypes = ['TABLE', 'BOARD', 'LIST', 'CALENDAR', 'GALLERY', 'TIMELINE']
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid view type' },
        { status: 400 }
      )
    }

    // Check database exists and user has access
    const database = await prisma.database.findUnique({
      where: {
        id: resolvedParams.databaseId
      },
      include: {
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
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    if (!database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create default config based on view type
    let defaultConfig: any = { wrap: false }
    
    switch (type.toUpperCase()) {
      case 'BOARD':
        defaultConfig = { ...defaultConfig, showEmptyGroups: false }
        break
      case 'CALENDAR':
        defaultConfig = { ...defaultConfig }
        break
      case 'GALLERY':
        defaultConfig = { ...defaultConfig, cardSize: 'medium' }
        break
      case 'TIMELINE':
        defaultConfig = { ...defaultConfig, dateProperty: undefined }
        break
    }

    // Merge with provided config
    const finalConfig = { ...defaultConfig, ...config }

    const newView = await prisma.databaseView.create({
      data: {
        id: generateId(),
        name,
        type: type.toUpperCase(),
        config: finalConfig,
        isDefault: false,
        databaseId: resolvedParams.databaseId
      }
    })

    return NextResponse.json(newView)
  } catch (error) {
    console.error('Error creating database view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}