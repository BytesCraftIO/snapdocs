import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

// GET /api/databases/[databaseId] - Get database with rows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const database = await prisma.database.findUnique({
      where: {
        id: resolvedParams.databaseId
      },
      include: {
        views: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        rows: {
          orderBy: {
            order: 'asc'
          }
        },
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

    // Check access
    if (!database.workspace.members.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(database)
  } catch (error) {
    console.error('Error fetching database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/databases/[databaseId] - Update database schema
export async function PUT(
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
    const { name, description, properties, icon, cover } = body

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

    const updatedDatabase = await prisma.database.update({
      where: {
        id: resolvedParams.databaseId
      },
      data: {
        name,
        description,
        properties: properties || database.properties,
        ...(icon !== undefined && { icon }),
        ...(cover !== undefined && { cover })
      },
      include: {
        views: true,
        rows: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(updatedDatabase)
  } catch (error) {
    console.error('Error updating database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/databases/[databaseId] - Partial update database
export async function PATCH(
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

    const updatedDatabase = await prisma.database.update({
      where: {
        id: resolvedParams.databaseId
      },
      data: body,
      include: {
        views: true,
        rows: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(updatedDatabase)
  } catch (error) {
    console.error('Error updating database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/databases/[databaseId] - Delete database
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

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
                userId: session.user.id,
                role: {
                  in: ['OWNER', 'ADMIN'] // Only owners and admins can delete
                }
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

    await prisma.database.delete({
      where: {
        id: resolvedParams.databaseId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting database:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}