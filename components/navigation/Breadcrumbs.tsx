'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { PageTreeNode } from '@/types'

interface BreadcrumbsProps {
  pageId: string
  workspaceId: string
  className?: string
  showHome?: boolean
}

interface BreadcrumbItem {
  id: string
  title: string
  icon?: string
}

export function Breadcrumbs({ 
  pageId, 
  workspaceId, 
  className,
  showHome = true 
}: BreadcrumbsProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchBreadcrumbs()
  }, [pageId, workspaceId])

  const fetchBreadcrumbs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get the page tree to build breadcrumbs
      const response = await fetch(`/api/workspaces/${workspaceId}/pages/tree`)
      if (!response.ok) {
        throw new Error('Failed to fetch page tree')
      }

      const data = await response.json()
      const pageTree = data.tree as PageTreeNode[]
      
      // Find the current page and build breadcrumbs
      const crumbs = buildBreadcrumbs(pageTree, pageId)
      setBreadcrumbs(crumbs)

    } catch (error) {
      console.error('Failed to fetch breadcrumbs:', error)
      setError('Failed to load navigation')
    } finally {
      setIsLoading(false)
    }
  }

  const buildBreadcrumbs = (tree: PageTreeNode[], targetPageId: string): BreadcrumbItem[] => {
    const result: BreadcrumbItem[] = []
    
    const findPath = (nodes: PageTreeNode[], targetId: string, path: BreadcrumbItem[]): boolean => {
      for (const node of nodes) {
        const currentPath = [...path, { 
          id: node.id, 
          title: node.title, 
          icon: node.icon 
        }]
        
        if (node.id === targetId) {
          result.push(...currentPath)
          return true
        }
        
        if (findPath(node.children, targetId, currentPath)) {
          return true
        }
      }
      return false
    }

    findPath(tree, targetPageId, [])
    return result
  }

  const handleNavigation = (pageId: string) => {
    router.push(`/workspace/${workspaceId}/page/${pageId}`)
  }

  const handleWorkspaceNavigation = () => {
    router.push(`/workspace/${workspaceId}`)
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {showHome && (
          <>
            <Skeleton className="w-6 h-6 rounded" />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        <Skeleton className="w-20 h-4" />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <Skeleton className="w-24 h-4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {error}
      </div>
    )
  }

  if (breadcrumbs.length === 0) {
    return null
  }

  // If we have too many breadcrumbs, show a condensed version
  const maxVisible = 4
  const shouldCondense = breadcrumbs.length > maxVisible
  
  let visibleBreadcrumbs = breadcrumbs
  let hiddenBreadcrumbs: BreadcrumbItem[] = []
  
  if (shouldCondense) {
    // Show first, last few, and hide middle ones
    const firstItem = breadcrumbs[0]
    const lastItems = breadcrumbs.slice(-2) // Last 2 items
    hiddenBreadcrumbs = breadcrumbs.slice(1, -2)
    
    visibleBreadcrumbs = [firstItem, ...lastItems]
  }

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {showHome && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleWorkspaceNavigation}
          >
            <Home className="w-4 h-4" />
          </Button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </>
      )}

      {visibleBreadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {/* Show dropdown for hidden breadcrumbs after first item */}
          {index === 1 && hiddenBreadcrumbs.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hiddenBreadcrumbs.map((hiddenCrumb) => (
                    <DropdownMenuItem
                      key={hiddenCrumb.id}
                      onClick={() => handleNavigation(hiddenCrumb.id)}
                      className="flex items-center gap-2"
                    >
                      <span>{hiddenCrumb.icon || '📄'}</span>
                      <span className="truncate max-w-48">{hiddenCrumb.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </>
          )}

          {/* Current breadcrumb item */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 max-w-48",
              index === visibleBreadcrumbs.length - 1
                ? "text-foreground font-medium cursor-default"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => index !== visibleBreadcrumbs.length - 1 && handleNavigation(crumb.id)}
          >
            <span className="mr-1">{crumb.icon || '📄'}</span>
            <span className="truncate">{crumb.title}</span>
          </Button>

          {/* Separator (except for last item) */}
          {index < visibleBreadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </nav>
  )
}