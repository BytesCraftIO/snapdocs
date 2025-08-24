"use client"

import React, { useState, useEffect } from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Settings,
  ChevronsLeft,
  MoreHorizontal,
  Trash,
  Trash2,
  Star,
  Copy,
  ArrowRight,
  FileText,
  Hash,
  Calendar,
  Inbox,
  File
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { signOut } from "next-auth/react"
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal"
import { SearchDialog } from "@/components/search/SearchDialog"
import { SettingsModal } from "@/components/settings/SettingsModal"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface Workspace {
  id: string
  name: string
  icon?: string | null
}

interface NotionSidebarProps {
  user: User
}

export function NotionSidebar({ user }: NotionSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [pages, setPages] = useState<any[]>([])
  const [favoritePages, setFavoritePages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchDialog(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Fetch workspaces
  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data)
          
          const workspaceIdFromPath = pathname.split('/workspace/')[1]?.split('/')[0]
          if (workspaceIdFromPath) {
            const workspace = data.find((w: Workspace) => w.id === workspaceIdFromPath)
            if (workspace) {
              setCurrentWorkspace(workspace)
            }
          } else if (data.length > 0) {
            setCurrentWorkspace(data[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [pathname])

  // Fetch pages - refetch when workspace or pathname changes
  useEffect(() => {
    async function fetchPages() {
      if (!currentWorkspace) {
        setPages([])
        return
      }
      
      try {
        const response = await fetch(`/api/workspaces/${currentWorkspace.id}/pages/tree`)
        if (response.ok) {
          const data = await response.json()
          const pageTree = data.tree || data
          const allPages = Array.isArray(pageTree) ? pageTree : []
          
          // Separate favorite pages
          const extractFavorites = (pages: any[]): any[] => {
            let favorites: any[] = []
            pages.forEach(page => {
              if (page.isFavorite) {
                favorites.push(page)
              }
              if (page.children) {
                favorites = [...favorites, ...extractFavorites(page.children)]
              }
            })
            return favorites
          }
          
          setPages(allPages)
          setFavoritePages(extractFavorites(allPages))
        } else {
          setPages([])
          setFavoritePages([])
        }
      } catch (error) {
        console.error('Failed to fetch pages:', error)
        setPages([])
        setFavoritePages([])
      }
    }

    fetchPages()
    
    // Set up an interval to refresh pages every 2 seconds for real-time updates
    const interval = setInterval(fetchPages, 2000)
    
    return () => clearInterval(interval)
  }, [currentWorkspace, pathname, refreshKey])

  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    router.push(`/workspace/${workspace.id}`)
  }

  const handleCreatePage = async (parentId?: string) => {
    if (!currentWorkspace || isCreatingPage) return
    
    setIsCreatingPage(true)
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled',
          workspaceId: currentWorkspace.id,
          parentId: parentId || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPage = data.page || data
        router.push(`/workspace/${currentWorkspace.id}/page/${newPage.id}`)
        
        // Refresh pages
        const pagesResponse = await fetch(`/api/workspaces/${currentWorkspace.id}/pages/tree`)
        if (pagesResponse.ok) {
          const data = await pagesResponse.json()
          const pageTree = data.tree || data
          setPages(Array.isArray(pageTree) ? pageTree : [])
        }
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast.error('Failed to create page')
    } finally {
      setIsCreatingPage(false)
    }
  }


  if (collapsed) {
    return (
      <div className="w-12 bg-[#fbfbfa] dark:bg-[#202020] border-r border-[#e5e5e4] dark:border-[#373737] flex flex-col h-full">
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(false)}
          >
            <ChevronsLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-60 bg-[#fbfbfa] dark:bg-[#202020] border-r border-[#e5e5e4] dark:border-[#373737] flex flex-col h-full text-[13px]">
        {/* User & Workspace Switcher */}
        <div className="flex items-center justify-between p-2 border-b border-[#e5e5e4] dark:border-[#373737]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex-1 justify-start h-7 px-2 py-0 hover:bg-[#e5e5e4] dark:hover:bg-[#373737] font-normal"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-base">{currentWorkspace?.icon || "🏠"}</span>
                  <span className="flex-1 text-left truncate font-medium">
                    {currentWorkspace?.name || "Select workspace"}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <div className="px-2 py-1.5 flex items-center gap-2">
                <AvatarUpload
                  currentAvatarUrl={user.avatarUrl}
                  userName={user.name}
                  userEmail={user.email}
                  size="sm"
                  editable={false}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace)}
                  className="gap-2"
                >
                  <span>{workspace.icon || "🏠"}</span>
                  <span className="flex-1">{workspace.name}</span>
                  {currentWorkspace?.id === workspace.id && (
                    <span className="text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-[#e5e5e4] dark:hover:bg-[#373737]"
            onClick={() => setCollapsed(true)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-2 space-y-0.5">
          <SidebarItem 
            icon={<Search />} 
            label={
              <span className="flex items-center justify-between w-full">
                <span>Search</span>
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#37352f0a] dark:bg-[#ffffff0a] font-mono">
                  ⌘K
                </kbd>
              </span>
            }
            onClick={() => setShowSearchDialog(true)} 
          />
          <SidebarItem 
            icon={<Settings />} 
            label="Settings & members" 
            onClick={() => setSettingsOpen(true)}
          />
          <SidebarItem 
            icon={<Plus />} 
            label="New page" 
            onClick={() => handleCreatePage()}
            disabled={isCreatingPage}
          />
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-2">
            <SidebarItem icon={<Inbox />} label="Inbox" onClick={() => {}} />
            <SidebarItem 
              icon={<Trash2 />} 
              label="Trash" 
              onClick={() => router.push(`/workspace/${currentWorkspace?.id}/trash`)}
            />
            
            {/* Favorites Section */}
            <div className="pt-3 pb-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-[#787774] dark:text-[#979797]">
                  Favorites
                </span>
              </div>
            </div>
            
            {favoritePages.length === 0 ? (
              <div className="px-2 py-2 text-xs text-[#787774] dark:text-[#979797]">
                No favorites yet
              </div>
            ) : (
              <div className="space-y-0">
                {favoritePages.map((page) => (
                  <RecursivePageItem 
                    key={`fav-${page.id}`}
                    page={{...page, children: []}} // Don't show children in favorites
                    workspaceId={currentWorkspace?.id || ''}
                    level={0}
                  />
                ))}
              </div>
            )}
            
            <div className="pt-3 pb-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-[#787774] dark:text-[#979797]">
                  Private
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-[#e5e5e4] dark:hover:bg-[#373737]"
                  onClick={() => handleCreatePage()}
                  disabled={isCreatingPage}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {!pages || pages.length === 0 ? (
              <div className="px-2 py-2 text-xs text-[#787774] dark:text-[#979797]">
                No pages inside
              </div>
            ) : (
              <div className="space-y-0">
                {pages.map((page) => (
                  <RecursivePageItem 
                    key={page.id} 
                    page={page} 
                    workspaceId={currentWorkspace?.id || ''}
                    level={0}
                  />
                ))}
              </div>
            )}

          </div>
        </ScrollArea>

      </div>

      {showCreateModal && (
        <CreateWorkspaceModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(workspace) => {
            setShowCreateModal(false)
            setWorkspaces([...workspaces, workspace])
            handleWorkspaceChange(workspace)
          }}
        />
      )}
      
      {showSearchDialog && currentWorkspace && (
        <SearchDialog
          open={showSearchDialog}
          onOpenChange={setShowSearchDialog}
          workspaceId={currentWorkspace.id}
        />
      )}
      
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        workspaceId={currentWorkspace?.id}
      />
    </>
  )
}

function SidebarItem({ 
  icon, 
  label, 
  onClick, 
  active = false,
  disabled = false 
}: { 
  icon: React.ReactNode
  label: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded-sm text-[13px] transition-colors",
        "hover:bg-[#e5e5e4] dark:hover:bg-[#373737]",
        active && "bg-[#e5e5e4] dark:bg-[#373737]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="opacity-60 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}

// Helper function to check if a page or any of its descendants is active
function hasActiveDescendant(page: any, pathname: string, workspaceId: string): boolean {
  if (pathname === `/workspace/${workspaceId}/page/${page.id}`) {
    return true
  }
  if (page.children && page.children.length > 0) {
    return page.children.some((child: any) => hasActiveDescendant(child, pathname, workspaceId))
  }
  return false
}

// Recursive page item component that manages its own expand state
function RecursivePageItem({ 
  page, 
  workspaceId, 
  level = 0
}: { 
  page: any
  workspaceId: string
  level?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const hasChildren = page.children && page.children.length > 0
  const isActive = pathname === `/workspace/${workspaceId}/page/${page.id}`
  const hasActiveChild = hasChildren && hasActiveDescendant(page, pathname, workspaceId)
  const [expanded, setExpanded] = useState(hasActiveChild)
  const [isCreating, setIsCreating] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isFavorite, setIsFavorite] = useState(page.isFavorite || false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // Auto-expand if a child becomes active
  useEffect(() => {
    if (hasActiveChild && !expanded) {
      setExpanded(true)
    }
  }, [hasActiveChild, pathname, expanded])

  const handleCreateSubpage = async () => {
    if (isCreating) return
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled',
          workspaceId: workspaceId,
          parentId: page.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPage = data.page || data
        
        // Expand the parent to show the new page
        setExpanded(true)
        
        // Navigate to the new page
        router.push(`/workspace/${workspaceId}/page/${newPage.id}`)
        
        // Trigger a refresh
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating sub-page:', error)
      toast.error('Failed to create sub-page')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeletePage = async () => {
    if (!confirm(`Move "${page.title}" to trash? You can restore it later from the trash.`)) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Page moved to trash')
        
        // Navigate to workspace if we're currently on the deleted page
        if (pathname.includes(page.id)) {
          router.push(`/workspace/${workspaceId}`)
        } else {
          router.refresh()
        }
      } else {
        throw new Error('Failed to delete page')
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to move page to trash')
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/pages/${page.id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
        toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites')
        router.refresh()
      } else {
        throw new Error('Failed to toggle favorite')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite')
    }
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        className={cn(
          "group flex items-center gap-1 py-0.5 rounded-sm cursor-pointer transition-colors relative w-full overflow-hidden",
          "hover:bg-[#e5e5e4] dark:hover:bg-[#373737]",
          isActive && "bg-[#e5e5e4] dark:bg-[#373737] font-medium"
        )}
        style={{ 
          paddingLeft: `${level * 16 + 8}px`, 
          paddingRight: '8px'
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={() => router.push(`/workspace/${workspaceId}/page/${page.id}`)}
      >
        {/* Chevron */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) setExpanded(!expanded)
            }}
            className={cn(
              "p-0.5 hover:bg-[#d5d5d4] dark:hover:bg-[#474747] rounded-sm",
              !hasChildren && "invisible"
            )}
          >
            <ChevronRight 
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        </div>
        
        {/* Icon */}
        <div className="flex-shrink-0 mr-1.5">
          {page.icon || <FileText className="h-4 w-4 opacity-50" />}
        </div>
        
        {/* Title */}
        <div className="min-w-0 flex-1 overflow-hidden w-[10px]">
          <span className="block truncate text-[13px]">{page.title || "Untitled"}</span>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className={cn(
            "flex-shrink-0 flex items-center gap-0.5 ml-1 transition-opacity",
            dropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-[#d5d5d4] dark:hover:bg-[#474747]"
              onClick={(e) => {
                e.stopPropagation()
                handleCreateSubpage()
              }}
              disabled={isCreating}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <DropdownMenu modal={false} open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-[#d5d5d4] dark:hover:bg-[#474747]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="right" 
                className="w-56 z-50"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(e)
                    setDropdownOpen(false)
                  }}
                >
                  <Star className={cn(
                    "mr-2 h-3 w-3",
                    isFavorite && "fill-yellow-500 text-yellow-500"
                  )} />
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Duplicate clicked')
                    setDropdownOpen(false)
                  }}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Move to clicked')
                    setDropdownOpen(false)
                  }}
                >
                  <ArrowRight className="mr-2 h-3 w-3" />
                  Move to
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePage()
                    setDropdownOpen(false)
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash className="mr-2 h-3 w-3" />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {hasChildren && expanded && (
        <div className="w-full">
          {page.children.map((child: any) => (
            <RecursivePageItem
              key={child.id} 
              page={child} 
              workspaceId={workspaceId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

