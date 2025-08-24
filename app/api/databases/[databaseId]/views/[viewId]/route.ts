import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

// PUT /api/databases/[databaseId]/views/[viewId] - Update view
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string; viewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { name, filters, sorts, properties, config } = body

    // Check view exists and user has access
    const view = await prisma.databaseView.findUnique({
      where: {
        id: resolvedParams.viewId
      },
      include: {
        database: {
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
        }
      }
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    if (view.databaseId !== resolvedParams.databaseId) {
      return NextResponse.json({ error: 'View does not belong to database' }, { status: 400 })
    }

    if (!view.database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Merge config instead of replacing completely
    const currentConfig = view.config as any || {}
    const updatedConfig = config ? { ...currentConfig, ...config } : currentConfig

    const updatedView = await prisma.databaseView.update({
      where: {
        id: resolvedParams.viewId
      },
      data: {
        ...(name !== undefined && { name }),
        config: updatedConfig,
        // Note: filters, sorts, and properties would be stored in the config
        // since Prisma doesn't have a direct way to store these structured types
      }
    })

    return NextResponse.json(updatedView)
  } catch (error) {
    console.error('Error updating database view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/databases/[databaseId]/views/[viewId] - Delete view
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string; viewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    // Check view exists and user has access
    const view = await prisma.databaseView.findUnique({
      where: {
        id: resolvedParams.viewId
      },
      include: {
        database: {
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
        }
      }
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    if (view.databaseId !== resolvedParams.databaseId) {
      return NextResponse.json({ error: 'View does not belong to database' }, { status: 400 })
    }

    if (!view.database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow deleting the last view
    const viewCount = await prisma.databaseView.count({
      where: {
        databaseId: resolvedParams.databaseId
      }
    })

    if (viewCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last view' }, { status: 400 })
    }

    await prisma.databaseView.delete({
      where: {
        id: resolvedParams.viewId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting database view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}