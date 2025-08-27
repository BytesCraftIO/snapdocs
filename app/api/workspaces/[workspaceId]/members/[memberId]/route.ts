import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const { workspaceId, memberId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    // Check if current user is admin or owner
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId
        }
      }
    })

    if (!currentMember || !['ADMIN', 'OWNER'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can update member roles' },
        { status: 403 }
      )
    }

    // Prevent changing owner role if they're the only owner
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId
        }
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'OWNER' && role !== 'OWNER') {
      // Check if there are other owners
      const ownerCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner from workspace' },
          { status: 400 }
        )
      }
    }

    // Update member role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedMember.user.id,
      name: updatedMember.user.name,
      email: updatedMember.user.email,
      avatarUrl: updatedMember.user.avatarUrl,
      role: updatedMember.role
    })
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const { workspaceId, memberId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin or owner
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId
        }
      }
    })

    if (!currentMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Users can remove themselves, or admins/owners can remove others
    const canRemove = 
      memberId === user.id || 
      ['ADMIN', 'OWNER'].includes(currentMember.role)

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      )
    }

    // Check if member exists
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId
        }
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing the last owner
    if (targetMember.role === 'OWNER') {
      const ownerCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner from workspace' },
          { status: 400 }
        )
      }
    }

    // Remove member from workspace
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}