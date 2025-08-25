'use client'

import React, { useEffect, useState } from 'react'
import { useSocket } from '@/lib/socket/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CollaborationPresenceProps {
  pageId: string
  currentUserId?: string
}

interface UserCursor {
  userId: string
  userName: string
  userColor: string
  position: { x: number; y: number }
  lastUpdate: number
}

interface UserSelection {
  userId: string
  userName: string
  userColor: string
  blockId: string
  selection: { start: number; end: number } | null
}

interface UserTyping {
  userId: string
  userName: string
  blockId: string
  isTyping: boolean
}

export default function CollaborationPresence({ pageId, currentUserId }: CollaborationPresenceProps) {
  const { currentUsers, onCursorMove, onSelectionChange, onUserTyping, isConnected } = useSocket()
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map())
  const [userSelections, setUserSelections] = useState<Map<string, UserSelection>>(new Map())
  const [userTyping, setUserTyping] = useState<Map<string, UserTyping>>(new Map())
  
  // Listen for cursor movements
  useEffect(() => {
    if (!onCursorMove) return
    
    const cleanup = onCursorMove((data: any) => {
      if (data.userId === currentUserId) return
      
      setUserCursors(prev => {
        const newMap = new Map(prev)
        newMap.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor,
          position: data.position,
          lastUpdate: Date.now()
        })
        return newMap
      })
      
      // Remove cursor after 5 seconds of inactivity
      setTimeout(() => {
        setUserCursors(prev => {
          const cursor = prev.get(data.userId)
          if (cursor && Date.now() - cursor.lastUpdate > 5000) {
            const newMap = new Map(prev)
            newMap.delete(data.userId)
            return newMap
          }
          return prev
        })
      }, 5100)
    })
    
    return cleanup
  }, [onCursorMove, currentUserId])
  
  // Listen for selection changes
  useEffect(() => {
    if (!onSelectionChange) return
    
    const cleanup = onSelectionChange((data: any) => {
      if (data.userId === currentUserId) return
      
      if (data.selection) {
        setUserSelections(prev => {
          const newMap = new Map(prev)
          newMap.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            userColor: data.userColor,
            blockId: data.blockId,
            selection: data.selection
          })
          return newMap
        })
      } else {
        setUserSelections(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.userId)
          return newMap
        })
      }
    })
    
    return cleanup
  }, [onSelectionChange, currentUserId])
  
  // Listen for typing indicators
  useEffect(() => {
    if (!onUserTyping) return
    
    const cleanup = onUserTyping((data: any) => {
      if (data.userId === currentUserId) return
      
      if (data.isTyping) {
        setUserTyping(prev => {
          const newMap = new Map(prev)
          newMap.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            blockId: data.blockId,
            isTyping: true
          })
          return newMap
        })
        
        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setUserTyping(prev => {
            const newMap = new Map(prev)
            newMap.delete(data.userId)
            return newMap
          })
        }, 3000)
      } else {
        setUserTyping(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.userId)
          return newMap
        })
      }
    })
    
    return cleanup
  }, [onUserTyping, currentUserId])
  
  // Render cursors
  const renderCursors = () => {
    return Array.from(userCursors.values()).map(cursor => (
      <div
        key={cursor.userId}
        className="fixed pointer-events-none z-50 transition-all duration-100"
        style={{
          left: cursor.position.x,
          top: cursor.position.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse"
          style={{ backgroundColor: cursor.userColor }}
        />
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-medium text-white rounded whitespace-nowrap"
          style={{ backgroundColor: cursor.userColor }}
        >
          {cursor.userName}
        </div>
      </div>
    ))
  }
  
  // Show active users in the top bar
  const renderActiveUsers = () => {
    const users = Array.from(currentUsers.values()).filter(u => u.userId !== currentUserId)
    
    if (users.length === 0) return null
    
    return (
      <div className="fixed top-20 right-4 z-40 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-md px-3 py-1.5">
          <div className="flex -space-x-2">
            <TooltipProvider>
              {users.slice(0, 5).map(user => (
                <Tooltip key={user.userId}>
                  <TooltipTrigger asChild>
                    <div
                      className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                      {userTyping.has(user.userId) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-white" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name}</p>
                    {userTyping.has(user.userId) && (
                      <p className="text-xs text-green-500">Typing...</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          {users.length > 5 && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              +{users.length - 5}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            {users.length} {users.length === 1 ? 'user' : 'users'} online
          </span>
        </div>
      </div>
    )
  }
  
  if (!isConnected) return null
  
  return (
    <>
      {renderActiveUsers()}
      {renderCursors()}
    </>
  )
}