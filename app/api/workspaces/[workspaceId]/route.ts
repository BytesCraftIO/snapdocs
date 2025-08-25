import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            members: true,
            pages: true
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...workspace,
      memberCount: workspace._count.members,
      pageCount: workspace._count.pages,
      userRole: workspaceMember.role
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon } = body

    // Check if user is admin or owner
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId
        }
      }
    })

    if (!workspaceMember || !['ADMIN', 'OWNER'].includes(workspaceMember.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can update workspace settings' },
        { status: 403 }
      )
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name }),
        ...(icon !== undefined && { icon })
      }
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId
        }
      }
    })

    if (!workspaceMember || workspaceMember.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can delete workspaces' },
        { status: 403 }
      )
    }

    // Delete workspace (this will cascade delete all related data)
    await prisma.workspace.delete({
      where: { id: workspaceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}