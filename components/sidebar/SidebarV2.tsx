'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Settings, 
  MoreHorizontal,
  FileText,
  Hash,
  Calendar,
  Users,
  Trash2,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Workspace, Page } from '@/types'

interface SidebarProps {
  workspace: Workspace
  pages: Page[]
  currentPageId?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function SidebarV2({ 
  workspace, 
  pages, 
  currentPageId,
  isOpen, 
  onOpenChange,
  className 
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['workspace']))
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Auto-expand workspace section by default
  useEffect(() => {
    setExpandedSections(prev => new Set([...prev, 'workspace']))
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handlePageClick = (pageId: string) => {
    router.push(`/workspace/${workspace.id}/page/${pageId}`)
  }

  const handleNewPage = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', parentId: null })
      })
      
      if (response.ok) {
        const newPage = await response.json()
        router.push(`/workspace/${workspace.id}/page/${newPage.id}`)
      }
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="fixed top-3 left-3 z-50 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    )
  }

  return (
    <>
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm",
          "w-60 flex flex-col border-r border-gray-200 dark:border-gray-800",
          "transform transition-transform duration-200 ease-out z-40",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200 dark:border-gray-800">
          <button
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-md transition-colors flex-1"
            onClick={() => router.push(`/workspace/${workspace.id}`)}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {workspace.name}
            </span>
          </button>
          
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-800">
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={() => {/* Open search */}}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">⌘K</span>
          </button>
          
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={handleNewPage}
          >
            <Plus className="w-4 h-4" />
            <span>New page</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-2">
            {/* Workspace Section */}
            <div className="mb-1">
              <button
                className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => toggleSection('workspace')}
              >
                <ChevronRight className={cn(
                  "w-3 h-3 transition-transform",
                  expandedSections.has('workspace') && "rotate-90"
                )} />
                <span>WORKSPACE</span>
              </button>
              
              {expandedSections.has('workspace') && (
                <div className="mt-1">
                  {pages.filter(p => !p.parentId && !p.isDeleted && !p.isArchived).map(page => (
                    <PageItem
                      key={page.id}
                      page={page}
                      pages={pages}
                      currentPageId={currentPageId}
                      workspaceId={workspace.id}
                      onPageClick={handlePageClick}
                      level={0}
                    />
                  ))}
                  
                  {pages.filter(p => !p.parentId && !p.isDeleted && !p.isArchived).length === 0 && (
                    <div className="px-2 py-2 text-xs text-gray-400 dark:text-gray-600">
                      No pages yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Private Section */}
            <div className="mb-1">
              <button
                className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                onClick={() => toggleSection('private')}
              >
                <ChevronRight className={cn(
                  "w-3 h-3 transition-transform",
                  expandedSections.has('private') && "rotate-90"
                )} />
                <span>PRIVATE</span>
              </button>
              
              {expandedSections.has('private') && (
                <div className="mt-1">
                  <div className="px-2 py-2 text-xs text-gray-400 dark:text-gray-600">
                    Your private pages
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2">
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={() => router.push(`/workspace/${workspace.id}/settings`)}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & members</span>
          </button>
          
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={() => router.push(`/workspace/${workspace.id}/trash`)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
    </>
  )
}

// Recursive page item component
function PageItem({ 
  page, 
  pages, 
  currentPageId, 
  workspaceId,
  onPageClick,
  level = 0 
}: {
  page: Page
  pages: Page[]
  currentPageId?: string
  workspaceId: string
  onPageClick: (pageId: string) => void
  level: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const childPages = pages.filter(p => p.parentId === page.id && !p.isDeleted && !p.isArchived)
  const hasChildren = childPages.length > 0
  const isActive = currentPageId === page.id
  const router = useRouter()

  const handleNewSubpage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', parentId: page.id })
      })
      
      if (response.ok) {
        const newPage = await response.json()
        setIsExpanded(true)
        router.push(`/workspace/${workspaceId}/page/${newPage.id}`)
      }
    } catch (error) {
      console.error('Failed to create subpage:', error)
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-colors",
          isActive ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800",
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onPageClick(page.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
          >
            <ChevronRight className={cn(
              "w-3 h-3 text-gray-400 transition-transform",
              isExpanded && "rotate-90"
            )} />
          </button>
        ) : (
          <div className="w-4" />
        )}
        
        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
        
        <span className={cn(
          "text-sm flex-1 truncate",
          isActive ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-700 dark:text-gray-300"
        )}>
          {page.title || 'Untitled'}
        </span>
        
        {isHovered && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Handle more options
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
            >
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </button>
            
            <button
              onClick={handleNewSubpage}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {childPages.map(childPage => (
            <PageItem
              key={childPage.id}
              page={childPage}
              pages={pages}
              currentPageId={currentPageId}
              workspaceId={workspaceId}
              onPageClick={onPageClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}