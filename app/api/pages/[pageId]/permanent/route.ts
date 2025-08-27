import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'
import { getMongoDb } from '@/lib/db/mongodb'

export async function DELETE(
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

    // Check if page exists in trash and user has access
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        isDeleted: true,
        authorId: user.id
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found in trash' }, { status: 404 })
    }

    // Get all descendant pages (recursive)
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const children = await prisma.page.findMany({
        where: {
          parentId: parentId
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
    
    // Get all pages to delete permanently (current page + all descendants)
    const descendantIds = await getAllDescendants(pageId)
    const allPageIds = [pageId, ...descendantIds]
    
    // Delete from PostgreSQL
    await prisma.$transaction(async (tx) => {
      await tx.page.deleteMany({
        where: {
          id: {
            in: allPageIds
          }
        }
      })
    })

    // Delete content from MongoDB
    try {
      const db = await getMongoDb()
      await db.collection('pageContents').deleteMany({
        pageId: { $in: allPageIds }
      })
    } catch (mongoError) {
      console.error('Error deleting from MongoDB:', mongoError)
      // Continue even if MongoDB deletion fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}