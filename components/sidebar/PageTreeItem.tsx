'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal, 
  Star, 
  Copy, 
  Trash2,
  Archive,
  Edit3,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PageTreeNode } from '@/types'

interface PageTreeItemProps {
  page: PageTreeNode
  level: number
  isSelected: boolean
  isExpanded: boolean
  isFavorite: boolean
  isDragging: boolean
  dropTarget: 'before' | 'after' | 'inside' | null
  workspaceId: string
  children?: React.ReactNode
  onSelect: () => void
  onExpand: (expanded: boolean) => void
  onFavoriteToggle: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: (position: 'before' | 'after' | 'inside') => void
  onDragOver: (position: 'before' | 'after' | 'inside') => void
  onDragLeave: () => void
}

export function PageTreeItem({
  page,
  level,
  isSelected,
  isExpanded,
  isFavorite,
  isDragging,
  dropTarget,
  workspaceId,
  children,
  onSelect,
  onExpand,
  onFavoriteToggle,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragLeave
}: PageTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(page.title)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const paddingLeft = level * 16 + 8

  const handleEditSubmit = async () => {
    if (editTitle.trim() && editTitle !== page.title) {
      try {
        const response = await fetch(`/api/pages/${page.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle.trim() })
        })

        if (!response.ok) {
          throw new Error('Failed to update page title')
        }

        // The parent component should refetch pages
        window.location.reload() // Temporary solution
      } catch (error) {
        console.error('Failed to update page title:', error)
        setEditTitle(page.title) // Revert on error
      }
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditTitle(page.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSubmit()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleDuplicatePage = async () => {
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          workspaceId,
          parentId: page.parentId,
          duplicateFrom: page.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate page')
      }

      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Failed to duplicate page:', error)
    }
  }

  const handleDeletePage = async () => {
    if (!confirm(`Are you sure you want to delete "${page.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete page')
      }

      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }

  const handleArchivePage = async () => {
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !page.isArchived })
      })

      if (!response.ok) {
        throw new Error('Failed to archive page')
      }

      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Failed to archive page:', error)
    }
  }

  const handleCreateSubPage = async () => {
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          workspaceId,
          parentId: page.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create page')
      }

      // Expand the parent page and select the new page
      onExpand(true)
      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    let position: 'before' | 'after' | 'inside'
    if (y < height * 0.25) {
      position = 'before'
    } else if (y > height * 0.75) {
      position = 'after'
    } else {
      position = 'inside'
    }

    onDragOver(position)
  }

  const getDropIndicatorStyle = () => {
    if (!dropTarget) return {}
    
    switch (dropTarget) {
      case 'before':
        return { borderTop: '2px solid rgb(59, 130, 246)' }
      case 'after':
        return { borderBottom: '2px solid rgb(59, 130, 246)' }
      case 'inside':
        return { backgroundColor: 'rgb(59, 130, 246, 0.1)' }
      default:
        return {}
    }
  }

  const pageIcon = page.icon || '📄'

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center min-h-7 rounded-sm transition-colors cursor-pointer select-none",
          isSelected && "bg-accent text-accent-foreground",
          isDragging && "opacity-50",
          dropTarget && "bg-blue-50 dark:bg-blue-950",
          page.isArchived && "opacity-60"
        )}
        style={{
          paddingLeft: `${paddingLeft}px`,
          ...getDropIndicatorStyle()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          onDragStart()
        }}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (dropTarget) {
            onDrop(dropTarget)
          }
        }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-5 h-5 p-0 shrink-0 transition-opacity",
            page.hasChildren ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onExpand(!isExpanded)
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>

        {/* Page Icon */}
        <span className="text-sm mr-2 shrink-0 w-4 text-center">
          {pageIcon}
        </span>

        {/* Page Title */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 h-6 text-sm border-0 shadow-none p-0 focus-visible:ring-0"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm truncate">
            {page.title}
          </span>
        )}

        {/* Favorite Star */}
        {isFavorite && (
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
        )}

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-1 shrink-0 transition-opacity",
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreateSubPage()
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a page inside</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onFavoriteToggle}>
                <Star className={cn(
                  "w-4 h-4 mr-2",
                  isFavorite && "fill-yellow-400 text-yellow-400"
                )} />
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDuplicatePage}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleArchivePage}>
                <Archive className="w-4 h-4 mr-2" />
                {page.isArchived ? 'Restore' : 'Archive'}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={handleDeletePage}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {children}
    </>
  )
}