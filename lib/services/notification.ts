import { prisma } from '@/lib/db/prisma'
import { NotificationType } from '@prisma/client'

interface CreateMentionNotificationParams {
  recipientId: string
  mentionedById: string
  pageId: string
  workspaceId: string
  blockId?: string
  context?: string
}

interface NotificationWithRelations {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
  updatedAt: Date
  recipientId: string
  mentionedById: string | null
  mentionedBy: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  } | null
  page: {
    id: string
    title: string
    icon: string | null
  } | null
  workspace: {
    id: string
    name: string
    slug: string
  } | null
  metadata: any
}

export class NotificationService {
  /**
   * Create a mention notification
   */
  static async createMentionNotification({
    recipientId,
    mentionedById,
    pageId,
    workspaceId,
    blockId,
    context
  }: CreateMentionNotificationParams) {
    try {
      // Don't create notification if user mentions themselves
      if (recipientId === mentionedById) {
        return null
      }

      // Get page and user details for the notification
      const [page, mentionedByUser] = await Promise.all([
        prisma.page.findUnique({
          where: { id: pageId },
          select: { title: true }
        }),
        prisma.user.findUnique({
          where: { id: mentionedById },
          select: { name: true, email: true }
        })
      ])

      if (!page || !mentionedByUser) {
        console.error('Page or user not found for mention notification')
        return null
      }

      const notification = await prisma.notification.create({
        data: {
          type: NotificationType.MENTION,
          title: `${mentionedByUser.name || mentionedByUser.email} mentioned you`,
          message: `You were mentioned in "${page.title}"${context ? `: "${context}"` : ''}`,
          recipientId,
          mentionedById,
          pageId,
          workspaceId,
          metadata: {
            blockId,
            context
          }
        },
        include: {
          mentionedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          page: {
            select: {
              id: true,
              title: true,
              icon: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      return notification
    } catch (error) {
      console.error('Error creating mention notification:', error)
      return null
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<NotificationWithRelations[]> {
    const { unreadOnly = false, limit = 20, offset = 0 } = options || {}

    const where: any = {
      recipientId: userId
    }

    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        mentionedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        page: {
          select: {
            id: true,
            title: true,
            icon: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return notifications
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          recipientId: userId // Ensure user owns the notification
        },
        data: {
          read: true
        }
      })

      return notification
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return null
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          read: false
        },
        data: {
          read: true
        }
      })

      return result
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return null
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          recipientId: userId,
          read: false
        }
      })

      return count
    } catch (error) {
      console.error('Error getting unread notification count:', error)
      return 0
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.delete({
        where: {
          id: notificationId,
          recipientId: userId // Ensure user owns the notification
        }
      })

      return notification
    } catch (error) {
      console.error('Error deleting notification:', error)
      return null
    }
  }

  /**
   * Extract mentions from block content and create notifications
   */
  static async processMentionsInContent(
    content: any,
    pageId: string,
    workspaceId: string,
    mentionedById: string
  ) {
    try {
      // Extract all mentions from the content
      const mentions = this.extractMentions(content)
      
      if (mentions.length === 0) {
        return []
      }

      // Create notifications for each unique mention
      const uniqueMentions = [...new Set(mentions.map(m => m.userId))]
      const notifications = await Promise.all(
        uniqueMentions.map(userId =>
          this.createMentionNotification({
            recipientId: userId,
            mentionedById,
            pageId,
            workspaceId,
            context: mentions.find(m => m.userId === userId)?.context
          })
        )
      )

      return notifications.filter(n => n !== null)
    } catch (error) {
      console.error('Error processing mentions in content:', error)
      return []
    }
  }

  /**
   * Extract mentions from block content
   * This needs to parse the BlockNote content structure
   */
  private static extractMentions(content: any): Array<{ userId: string; context?: string }> {
    const mentions: Array<{ userId: string; context?: string }> = []

    // Helper function to recursively search for mentions
    const searchForMentions = (obj: any, context: string = '') => {
      if (!obj) return

      // Check if this is a mention inline content
      if (obj.type === 'mention' && obj.props?.userId) {
        mentions.push({
          userId: obj.props.userId,
          context: context.slice(0, 100) // Limit context length
        })
      }

      // Recursively search in arrays
      if (Array.isArray(obj)) {
        obj.forEach(item => searchForMentions(item, context))
      }
      
      // Recursively search in objects
      else if (typeof obj === 'object') {
        // Build context from text content
        if (obj.type === 'text' && obj.text) {
          context += obj.text
        }

        Object.values(obj).forEach(value => searchForMentions(value, context))
      }
    }

    searchForMentions(content)
    return mentions
  }
}