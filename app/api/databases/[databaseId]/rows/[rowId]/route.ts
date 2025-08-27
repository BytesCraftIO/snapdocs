import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

// PUT /api/databases/[databaseId]/rows/[rowId] - Update row
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string; rowId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { properties, order } = body

    // Check row exists and user has access
    const row = await prisma.databaseRow.findUnique({
      where: {
        id: resolvedParams.rowId
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

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 })
    }

    if (row.databaseId !== resolvedParams.databaseId) {
      return NextResponse.json({ error: 'Row does not belong to database' }, { status: 400 })
    }

    if (!row.database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Merge properties instead of replacing them completely
    const currentProperties = row.properties as any || {}
    const updatedProperties = { ...currentProperties, ...properties }

    const updatedRow = await prisma.databaseRow.update({
      where: {
        id: resolvedParams.rowId
      },
      data: {
        properties: updatedProperties,
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json(updatedRow)
  } catch (error) {
    console.error('Error updating database row:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/databases/[databaseId]/rows/[rowId] - Delete row
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string; rowId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    // Check row exists and user has access
    const row = await prisma.databaseRow.findUnique({
      where: {
        id: resolvedParams.rowId
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

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 })
    }

    if (row.databaseId !== resolvedParams.databaseId) {
      return NextResponse.json({ error: 'Row does not belong to database' }, { status: 400 })
    }

    if (!row.database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.databaseRow.delete({
      where: {
        id: resolvedParams.rowId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting database row:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}