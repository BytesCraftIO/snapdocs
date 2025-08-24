'use client'

import React from 'react'
import { useSocket } from '@/lib/socket/client'
import { cn } from '@/lib/utils'

export function ActiveUsers() {
  const { currentUsers, isConnected, currentPageId } = useSocket()

  // Don't show if not connected or not on a page
  if (!isConnected || !currentPageId) {
    return null
  }

  // Current users already contains only OTHER users (not including current user)
  // So total = other users + 1 (current user)
  const totalUsers = currentUsers.size + 1

  return (
    <div className="flex items-center gap-2">
      {currentUsers.size > 0 && (
        <div className="flex -space-x-2">
          {Array.from(currentUsers.entries()).slice(0, 5).map(([userId, user], index) => (
          <div
            key={userId}
            className="relative group"
            style={{ zIndex: 5 - index }}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white ring-2 ring-white dark:ring-gray-900",
                "hover:scale-110 transition-transform cursor-pointer"
              )}
              style={{ backgroundColor: user.color || '#4ECDC4' }}
              title={user.name || user.email}
            >
              {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {user.name || user.email}
            </div>
          </div>
        ))}
        
          {currentUsers.size > 5 && (
            <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-gray-900">
              +{currentUsers.size - 5}
            </div>
          )}
        </div>
      )}
      
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {totalUsers === 1 ? 'Just you' : `${totalUsers} ${totalUsers === 2 ? 'user' : 'users'} on this page`}
      </span>
    </div>
  )
}