'use client'

import { useMemo, useState } from 'react'
import { Page, PageTreeNode } from '@/types'
import { buildPageTree } from '@/lib/services/pages'
import { PageTreeItem } from './PageTreeItem'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageTreeProps {
  pages: Page[]
  selectedPageId?: string
  expandedPageIds: Set<string>
  favoritePageIds: Set<string>
  workspaceId: string
  onPageSelect: (pageId: string) => void
  onPageExpand: (pageId: string, expanded: boolean) => void
  onFavoriteToggle: (pageId: string) => void
  showArchived?: boolean
  className?: string
}

export function PageTree({
  pages,
  selectedPageId,
  expandedPageIds,
  favoritePageIds,
  workspaceId,
  onPageSelect,
  onPageExpand,
  onFavoriteToggle,
  showArchived = false,
  className
}: PageTreeProps) {
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ pageId: string; position: 'before' | 'after' | 'inside' } | null>(null)

  const pageTree = useMemo(() => {
    const tree = buildPageTree(pages)
    
    // Mark favorite pages
    const markFavorites = (nodes: PageTreeNode[]) => {
      nodes.forEach(node => {
        node.isFavorite = favoritePageIds.has(node.id)
        markFavorites(node.children)
      })
    }
    markFavorites(tree)
    
    return tree
  }, [pages, favoritePageIds])

  const handleDragStart = (pageId: string) => {
    setDraggedPageId(pageId)
  }

  const handleDragEnd = () => {
    setDraggedPageId(null)
    setDropTarget(null)
  }

  const handleDrop = async (targetPageId: string, position: 'before' | 'after' | 'inside') => {
    if (!draggedPageId || draggedPageId === targetPageId) return

    try {
      const response = await fetch(`/api/pages/${draggedPageId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPageId,
          position,
          workspaceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to move page')
      }

      // The parent component should refetch pages
      window.location.reload() // Temporary solution
    } catch (error) {
      console.error('Failed to move page:', error)
    }
  }

  const renderTreeNodes = (nodes: PageTreeNode[], level = 0) => {
    return nodes.map(node => (
      <PageTreeItem
        key={node.id}
        page={node}
        level={level}
        isSelected={selectedPageId === node.id}
        isExpanded={expandedPageIds.has(node.id)}
        isFavorite={node.isFavorite || false}
        isDragging={draggedPageId === node.id}
        dropTarget={dropTarget?.pageId === node.id ? dropTarget.position : null}
        onSelect={() => onPageSelect(node.id)}
        onExpand={(expanded) => onPageExpand(node.id, expanded)}
        onFavoriteToggle={() => onFavoriteToggle(node.id)}
        onDragStart={() => handleDragStart(node.id)}
        onDragEnd={handleDragEnd}
        onDrop={(position) => handleDrop(node.id, position)}
        onDragOver={(position) => setDropTarget({ pageId: node.id, position })}
        onDragLeave={() => setDropTarget(null)}
        workspaceId={workspaceId}
      >
        {node.children.length > 0 && expandedPageIds.has(node.id) && (
          <div className="ml-4">
            {renderTreeNodes(node.children, level + 1)}
          </div>
        )}
      </PageTreeItem>
    ))
  }

  if (pageTree.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <div className="text-sm text-muted-foreground mb-4">
          No pages yet
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // This would open the new page dialog
            window.dispatchEvent(new CustomEvent('open-new-page-dialog'))
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create your first page
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      {renderTreeNodes(pageTree)}
    </div>
  )
}