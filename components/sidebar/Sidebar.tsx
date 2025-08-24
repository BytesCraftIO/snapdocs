'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Settings, 
  Star, 
  Clock,
  Archive,
  MoreHorizontal,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PageTree } from './PageTree'
import { SearchDialog } from '../search/SearchDialog'
import { NewPageDialog } from '../pages/NewPageDialog'
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher'
import { PageTreeNode, SidebarState, Workspace, Page } from '@/types'

interface SidebarProps {
  workspace: Workspace
  pages: Page[]
  currentPageId?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function Sidebar({ 
  workspace, 
  pages, 
  currentPageId,
  isOpen, 
  onOpenChange,
  className 
}: SidebarProps) {
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isOpen,
    width: 280,
    expandedPageIds: new Set(),
    selectedPageId: currentPageId,
    searchQuery: '',
    showArchived: false,
    favoritePages: new Set()
  })

  const [searchOpen, setSearchOpen] = useState(false)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState<'all' | 'favorites' | 'recent' | 'archived'>('all')

  const pathname = usePathname()
  const router = useRouter()

  // Sync external isOpen state
  useEffect(() => {
    setSidebarState(prev => ({ ...prev, isOpen }))
  }, [isOpen])

  // Update selected page when URL changes
  useEffect(() => {
    const pageIdFromPath = pathname.split('/').pop()
    setSidebarState(prev => ({ 
      ...prev, 
      selectedPageId: pageIdFromPath === currentPageId ? currentPageId : undefined 
    }))
  }, [pathname, currentPageId])

  const handlePageSelect = useCallback((pageId: string) => {
    setSidebarState(prev => ({ ...prev, selectedPageId: pageId }))
    router.push(`/workspace/${workspace.id}/page/${pageId}`)
  }, [workspace.id, router])

  const handlePageExpand = useCallback((pageId: string, expanded: boolean) => {
    setSidebarState(prev => {
      const newExpanded = new Set(prev.expandedPageIds)
      if (expanded) {
        newExpanded.add(pageId)
      } else {
        newExpanded.delete(pageId)
      }
      return { ...prev, expandedPageIds: newExpanded }
    })
  }, [])

  const handleFavoriteToggle = useCallback(async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/favorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setSidebarState(prev => {
          const newFavorites = new Set(prev.favoritePages)
          if (newFavorites.has(pageId)) {
            newFavorites.delete(pageId)
          } else {
            newFavorites.add(pageId)
          }
          return { ...prev, favoritePages: newFavorites }
        })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [])

  const filteredPages = pages.filter(page => {
    if (page.isDeleted) return false
    
    switch (quickFilter) {
      case 'favorites':
        return sidebarState.favoritePages.has(page.id)
      case 'recent':
        return !page.isArchived // Would use actual recent logic
      case 'archived':
        return page.isArchived
      default:
        return !page.isArchived || sidebarState.showArchived
    }
  })

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-0 z-sidebar h-full w-6 group md:relative md:w-0">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 -right-2 w-8 h-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-sidebar-toggle"
          onClick={() => onOpenChange(true)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div 
        className={cn(
          "fixed left-0 top-0 z-sidebar h-full bg-background border-r flex flex-col",
          "w-80 transform transition-transform duration-200 ease-in-out overflow-hidden",
          "md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:w-0",
          className
        )}
        style={{ width: isOpen ? sidebarState.width : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <WorkspaceSwitcher workspace={workspace} />
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-7 h-7"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-7 h-7"
                  onClick={() => setNewPageOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New page</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-7 h-7">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/workspace/${workspace.id}/settings`)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All', icon: null },
              { key: 'favorites', label: 'Favorites', icon: Star },
              { key: 'recent', label: 'Recent', icon: Clock },
              { key: 'archived', label: 'Archived', icon: Archive }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={quickFilter === filter.key ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setQuickFilter(filter.key as any)}
              >
                {filter.icon && <filter.icon className="w-3 h-3 mr-1" />}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Page Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <PageTree
              pages={filteredPages}
              selectedPageId={sidebarState.selectedPageId}
              expandedPageIds={sidebarState.expandedPageIds}
              favoritePageIds={sidebarState.favoritePages}
              workspaceId={workspace.id}
              onPageSelect={handlePageSelect}
              onPageExpand={handlePageExpand}
              onFavoriteToggle={handleFavoriteToggle}
              showArchived={sidebarState.showArchived}
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          <div className="text-xs text-muted-foreground">
            {filteredPages.length} pages
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-backdrop md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Dialogs */}
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaceId={workspace.id}
      />

      <NewPageDialog
        open={newPageOpen}
        onOpenChange={setNewPageOpen}
        workspaceId={workspace.id}
      />
    </>
  )
}