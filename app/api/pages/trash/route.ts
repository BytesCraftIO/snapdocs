import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Fetch all deleted pages for this workspace
    const deletedPages = await prisma.page.findMany({
      where: {
        workspaceId,
        isDeleted: true,
        authorId: user.id // Only show pages deleted by the current user
      },
      select: {
        id: true,
        title: true,
        icon: true,
        deletedAt: true,
        parentId: true,
        path: true
      },
      orderBy: {
        deletedAt: 'desc'
      }
    })

    return NextResponse.json(deletedPages)
  } catch (error) {
    console.error('Error fetching deleted pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}