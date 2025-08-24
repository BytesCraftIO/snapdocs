'use client'

import React, { useState, useEffect, useRef } from 'react'
import { User } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MentionAutocompleteProps {
  isOpen: boolean
  position: { top: number; left: number }
  searchQuery: string
  workspaceId: string
  onSelect: (user: User) => void
  onClose: () => void
}

export default function MentionAutocomplete({
  isOpen,
  position,
  searchQuery,
  workspaceId,
  onSelect,
  onClose
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch workspace members when menu opens or search query changes
  useEffect(() => {
    if (!isOpen) {
      setUsers([])
      return
    }

    const fetchUsers = async () => {
      setLoading(true)
      try {
        // Always use the search endpoint, even with empty query to get all users
        const response = await fetch(`/api/workspaces/${workspaceId}/members/search?search=${searchQuery || ''}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately when menu opens
    fetchUsers()
  }, [searchQuery, workspaceId, isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % users.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
          break
        case 'Enter':
          e.preventDefault()
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, users, selectedIndex, onSelect, onClose])

  // Reset selected index when users change
  useEffect(() => {
    setSelectedIndex(0)
  }, [users])

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.[0]?.toUpperCase() || '?'
  }

  // Calculate position to prevent going off-screen
  const adjustedPosition = {
    top: position.top,
    left: Math.min(position.left, window.innerWidth - 280) // Prevent going off right edge
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 max-h-64 overflow-y-auto"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      ) : users.length > 0 ? (
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                selectedIndex === index && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          No users found
        </div>
      )}
    </div>
  )
}