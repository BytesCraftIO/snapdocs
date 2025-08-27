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
        isDeleted: true,
        authorId: user.id
      },
      select: {
        id: true,
        parentId: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found in trash' }, { status: 404 })
    }

    // Check if parent page exists and is not deleted
    if (page.parentId) {
      const parentPage = await prisma.page.findFirst({
        where: {
          id: page.parentId,
          isDeleted: false
        }
      })

      if (!parentPage) {
        // If parent is deleted or doesn't exist, restore to root level
        await prisma.page.update({
          where: { id: pageId },
          data: {
            isDeleted: false,
            deletedAt: null,
            parentId: null,
            updatedAt: new Date()
          }
        })
      } else {
        // Restore with original parent
        await prisma.page.update({
          where: { id: pageId },
          data: {
            isDeleted: false,
            deletedAt: null,
            updatedAt: new Date()
          }
        })
      }
    } else {
      // Restore root level page
      await prisma.page.update({
        where: { id: pageId },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date()
        }
      })
    }

    // Also restore all descendant pages
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const children = await prisma.page.findMany({
        where: {
          parentId: parentId,
          isDeleted: true
        },
        select: { id: true }
      })
      
      let allDescendants = children.map(c => c.id)
      
      for (const child of children) {
        const childDescendants = await getAllDescendants(child.id)
        allDescendants = [...allDescendants, ...childDescendants]
      }
      
      return allDescendants
    }
    
    const descendantIds = await getAllDescendants(pageId)
    
    if (descendantIds.length > 0) {
      await prisma.page.updateMany({
        where: {
          id: {
            in: descendantIds
          }
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}