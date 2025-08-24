import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, pageId, workspaceId, message } = await req.json()

    // Get the current user (the one doing the mentioning)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't send notification to self
    if (currentUser.id === userId) {
      return NextResponse.json({ success: true, message: 'Self-mention, no notification sent' })
    }

    // Get the mentioned user
    const mentionedUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!mentionedUser) {
      return NextResponse.json({ error: 'Mentioned user not found' }, { status: 404 })
    }

    // Get the page details
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { title: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create a notification (you might want to create a Notification model in your schema)
    // For now, we'll create an activity log entry
    await prisma.activityLog.create({
      data: {
        type: 'MENTION',
        userId: mentionedUser.id,
        pageId,
        workspaceId,
        metadata: {
          mentionedBy: currentUser.name || currentUser.email,
          mentionedById: currentUser.id,
          pageTitle: page.title,
          message: `${currentUser.name || currentUser.email} ${message}`
        }
      }
    })

    // In a production app, you might also want to:
    // 1. Send an email notification
    // 2. Send a real-time notification via WebSocket/SSE
    // 3. Add to an in-app notification center

    return NextResponse.json({ 
      success: true, 
      message: 'Mention notification sent',
      notifiedUser: {
        id: mentionedUser.id,
        name: mentionedUser.name,
        email: mentionedUser.email
      }
    })

  } catch (error) {
    console.error('Error sending mention notification:', error)
    return NextResponse.json(
      { error: 'Failed to send mention notification' },
      { status: 500 }
    )
  }
}