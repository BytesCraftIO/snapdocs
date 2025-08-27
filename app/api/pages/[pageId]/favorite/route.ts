import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    // Check if page exists and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false,
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      select: {
        id: true,
        isFavorite: true,
        authorId: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Toggle favorite status
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        isFavorite: !page.isFavorite,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      isFavorite: updatedPage.isFavorite 
    })
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    // Get favorite status
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: false,
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      select: {
        isFavorite: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      isFavorite: page.isFavorite 
    })
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}