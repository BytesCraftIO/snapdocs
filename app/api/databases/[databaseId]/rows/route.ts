import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'
import { generateId } from '@/lib/utils/id'

// POST /api/databases/[databaseId]/rows - Add row
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
    const { properties, order } = body

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

    // Get the next order if not provided
    let nextOrder = order
    if (nextOrder === undefined) {
      const lastRow = await prisma.databaseRow.findFirst({
        where: {
          databaseId: resolvedParams.databaseId
        },
        orderBy: {
          order: 'desc'
        }
      })
      nextOrder = (lastRow?.order || 0) + 1
    }

    const row = await prisma.databaseRow.create({
      data: {
        id: generateId(),
        databaseId: resolvedParams.databaseId,
        properties: properties || {},
        order: nextOrder
      }
    })

    return NextResponse.json(row)
  } catch (error) {
    console.error('Error creating database row:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}