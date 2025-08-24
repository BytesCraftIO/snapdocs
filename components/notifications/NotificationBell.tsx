'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title?: string
  message?: string
  read: boolean
  createdAt: string
  mentionedBy?: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
  page?: {
    id: string
    title: string | null
    icon: string | null
  }
  workspace?: {
    id: string
    name: string
    slug: string | null
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, read: true }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }, [])

  // Navigate to page
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await markAsRead([notification.id])
    }
    
    // Navigate to the page if it exists
    if (notification.page && notification.workspace) {
      router.push(`/workspace/${notification.workspace.id}/page/${notification.page.id}`)
      setIsOpen(false)
    }
  }, [router, markAsRead])

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark visible unread notifications as read after a delay
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const unreadIds = notifications
        .filter(n => !n.read)
        .slice(0, 5) // Only mark visible ones as read
        .map(n => n.id)
      
      if (unreadIds.length > 0) {
        const timer = setTimeout(() => {
          markAsRead(unreadIds)
        }, 2000) // 2 second delay
        
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, notifications, unreadCount, markAsRead])

  // Format notification message
  const getNotificationMessage = (notification: Notification) => {
    if (notification.type === 'MENTION') {
      return `mentioned you in "${notification.page?.title || 'Untitled'}"`;
    }
    return notification.message || 'New notification';
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-7 w-7 hover:bg-[#e5e5e4] dark:hover:bg-[#373737]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" sideOffset={5}>
        <DropdownMenuLabel className="font-semibold flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                markAsRead(notifications.filter(n => !n.read).map(n => n.id))
              }}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.read && "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Avatar or Icon */}
                <div className="shrink-0 mt-0.5">
                  {notification.mentionedBy?.avatarUrl ? (
                    <img
                      src={notification.mentionedBy.avatarUrl}
                      alt={notification.mentionedBy.name || ''}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {notification.mentionedBy?.name?.charAt(0) || notification.mentionedBy?.email?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {notification.mentionedBy?.name || notification.mentionedBy?.email || 'Someone'}
                        </span>
                        {' '}
                        <span className="text-muted-foreground">
                          {getNotificationMessage(notification)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-muted-foreground cursor-pointer justify-center"
              onClick={() => {
                // Navigate to a notifications page if you have one
                // router.push('/notifications')
                setIsOpen(false)
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}