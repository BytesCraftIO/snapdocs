"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  LogOut,
  FileText,
  Search,
  Home,
  ChevronRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal"

interface Workspace {
  id: string
  name: string
  icon?: string | null
}

interface AppSidebarProps {
  user: User
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pages, setPages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  // Fetch workspaces
  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data)
          
          // Set current workspace based on URL or first available
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

  // Fetch pages for current workspace
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
          // The API returns { tree, meta, totalPages }, we need the tree
          const pageTree = data.tree || data
          setPages(Array.isArray(pageTree) ? pageTree : [])
        } else {
          console.error('Failed to fetch pages:', response.status)
          setPages([])
        }
      } catch (error) {
        console.error('Failed to fetch pages:', error)
        setPages([])
      }
    }

    fetchPages()
  }, [currentWorkspace])

  const handleWorkspaceChange = (workspace: Workspace) => {
    console.log('Switching to workspace:', workspace)
    setCurrentWorkspace(workspace)
    router.push(`/workspace/${workspace.id}`)
  }

  const handleCreateWorkspace = () => {
    console.log('Opening create workspace modal')
    setShowCreateModal(true)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleCreatePage = async () => {
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
          parentId: null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPage = data.page || data
        router.push(`/workspace/${currentWorkspace.id}/page/${newPage.id}`)
        // Refresh pages list
        const pagesResponse = await fetch(`/api/workspaces/${currentWorkspace.id}/pages/tree`)
        if (pagesResponse.ok) {
          const data = await pagesResponse.json()
          const pageTree = data.tree || data
          setPages(Array.isArray(pageTree) ? pageTree : [])
        }
      } else {
        const error = await response.json()
        console.error('Failed to create page:', error)
      }
    } catch (error) {
      console.error('Error creating page:', error)
    } finally {
      setIsCreatingPage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full">
        {/* Workspace Switcher */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full h-9 px-2 font-normal hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center"
              >
                {currentWorkspace?.icon && (
                  <span className="text-base mr-2 flex-shrink-0">{currentWorkspace.icon}</span>
                )}
                <span className="flex-1 text-left truncate text-sm">
                  {currentWorkspace?.name || "Select workspace"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.length === 0 ? (
                <DropdownMenuItem onClick={handleCreateWorkspace}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create workspace
                </DropdownMenuItem>
              ) : (
                <>
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => handleWorkspaceChange(workspace)}
                    >
                      <span className="mr-2">{workspace.icon || "📁"}</span>
                      {workspace.name}
                      {currentWorkspace?.id === workspace.id && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCreateWorkspace}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 font-normal"
              asChild
            >
              <Link href={currentWorkspace ? `/workspace/${currentWorkspace.id}` : '/app'}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 font-normal"
              asChild
            >
              <Link href={currentWorkspace ? `/workspace/${currentWorkspace.id}/search` : '#'}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </Button>

            {currentWorkspace && (
              <>
                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-neutral-500">Pages</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCreatePage}
                      disabled={isCreatingPage}
                    >
                      {isCreatingPage ? (
                        <div className="h-3 w-3 border border-neutral-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {!pages || pages.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-neutral-500 text-center">
                    No pages yet
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {pages.map((page) => (
                      <PageItem 
                        key={page.id} 
                        page={page} 
                        workspaceId={currentWorkspace.id}
                        level={0}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* User Menu */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-9 px-2 font-normal hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span className="truncate text-sm">{user.name || user.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
    </>
  )
}

function PageItem({ 
  page, 
  workspaceId, 
  level = 0 
}: { 
  page: any
  workspaceId: string
  level?: number 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = page.children && page.children.length > 0
  const pathname = usePathname()
  const isActive = pathname === `/workspace/${workspaceId}/page/${page.id}`

  return (
    <div>
      <Button
        variant="ghost"
        className={`w-full justify-start h-8 px-2 font-normal hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
          isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        asChild
      >
        <Link href={`/workspace/${workspaceId}/page/${page.id}`}>
          <div className="flex items-center gap-1 flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded p-0.5"
              >
                <ChevronRight 
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            <FileText className="h-3.5 w-3.5 opacity-50" />
            <span className="truncate text-sm">{page.title || "Untitled"}</span>
          </div>
        </Link>
      </Button>
      
      {hasChildren && isExpanded && (
        <div>
          {page.children.map((child: any) => (
            <PageItem 
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