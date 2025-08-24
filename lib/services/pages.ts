import { Page, PageTreeNode, PageMoveOperation, PageTreeMeta } from '@/types'

/**
 * Build a hierarchical tree from flat page data
 */
export function buildPageTree(pages: Page[]): PageTreeNode[] {
  // Create a map for quick lookup
  const pageMap = new Map<string, PageTreeNode>()
  
  // Initialize all nodes
  pages.forEach(page => {
    pageMap.set(page.id, {
      ...page,
      children: [],
      depth: 0,
      hasChildren: false,
      isFavorite: false // This should be set based on user preferences
    })
  })

  // Build the tree structure
  const rootNodes: PageTreeNode[] = []
  
  pages.forEach(page => {
    const node = pageMap.get(page.id)!
    
    if (page.parentId && pageMap.has(page.parentId)) {
      const parent = pageMap.get(page.parentId)!
      parent.children.push(node)
      parent.hasChildren = true
      node.depth = parent.depth + 1
    } else {
      rootNodes.push(node)
    }
  })

  // Sort children by order within each parent
  const sortChildren = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortChildren(node.children)
      }
    })
  }

  sortChildren(rootNodes)
  return rootNodes
}

/**
 * Calculate new order when moving a page
 */
export function calculateNewOrder(
  siblings: Page[], 
  insertIndex: number
): number {
  if (siblings.length === 0) {
    return 1000
  }

  if (insertIndex <= 0) {
    // Insert at beginning
    return Math.max(0, siblings[0].order - 1000)
  }

  if (insertIndex >= siblings.length) {
    // Insert at end
    return siblings[siblings.length - 1].order + 1000
  }

  // Insert between two items
  const prevOrder = siblings[insertIndex - 1].order
  const nextOrder = siblings[insertIndex].order
  return Math.floor((prevOrder + nextOrder) / 2)
}

/**
 * Get all descendant page IDs of a given page
 */
export function getDescendantIds(pageId: string, pageTree: PageTreeNode[]): string[] {
  const descendants: string[] = []
  
  const findNode = (nodes: PageTreeNode[], id: string): PageTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      const found = findNode(node.children, id)
      if (found) return found
    }
    return null
  }

  const collectDescendants = (node: PageTreeNode) => {
    for (const child of node.children) {
      descendants.push(child.id)
      collectDescendants(child)
    }
  }

  const targetNode = findNode(pageTree, pageId)
  if (targetNode) {
    collectDescendants(targetNode)
  }

  return descendants
}

/**
 * Validate if a page move operation is allowed
 */
export function validatePageMove(
  operation: PageMoveOperation,
  pageTree: PageTreeNode[]
): { valid: boolean; error?: string } {
  // Can't move to itself
  if (operation.pageId === operation.newParentId) {
    return { valid: false, error: "Cannot move page to itself" }
  }

  // Can't move to a descendant
  if (operation.newParentId) {
    const descendantIds = getDescendantIds(operation.pageId, pageTree)
    if (descendantIds.includes(operation.newParentId)) {
      return { valid: false, error: "Cannot move page to its descendant" }
    }
  }

  return { valid: true }
}

/**
 * Get the full path of breadcrumbs for a page
 */
export function getPageBreadcrumbs(
  pageId: string, 
  pageTree: PageTreeNode[]
): PageTreeNode[] {
  const breadcrumbs: PageTreeNode[] = []
  
  const findPath = (nodes: PageTreeNode[], targetId: string, path: PageTreeNode[]): boolean => {
    for (const node of nodes) {
      const currentPath = [...path, node]
      
      if (node.id === targetId) {
        breadcrumbs.push(...currentPath)
        return true
      }
      
      if (findPath(node.children, targetId, currentPath)) {
        return true
      }
    }
    return false
  }

  findPath(pageTree, pageId, [])
  return breadcrumbs
}

/**
 * Search pages by title with fuzzy matching
 */
export function searchPages(
  pages: Page[], 
  query: string, 
  options: { 
    limit?: number
    includeArchived?: boolean 
  } = {}
): Page[] {
  const { limit = 10, includeArchived = false } = options
  
  if (!query.trim()) return []

  const searchTerm = query.toLowerCase()
  
  const results = pages
    .filter(page => {
      if (!includeArchived && page.isArchived) return false
      if (page.isDeleted) return false
      return page.title.toLowerCase().includes(searchTerm)
    })
    .map(page => ({
      page,
      score: calculateSearchScore(page.title, query)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.page)

  return results
}

/**
 * Calculate search score for fuzzy matching
 */
function calculateSearchScore(title: string, query: string): number {
  const titleLower = title.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Exact match gets highest score
  if (titleLower === queryLower) return 100
  
  // Starts with query gets high score
  if (titleLower.startsWith(queryLower)) return 90
  
  // Contains query gets medium score
  if (titleLower.includes(queryLower)) return 70
  
  // Calculate similarity based on common characters
  let commonChars = 0
  for (const char of queryLower) {
    if (titleLower.includes(char)) commonChars++
  }
  
  return (commonChars / queryLower.length) * 50
}

/**
 * Get recent pages (placeholder - would integrate with user activity tracking)
 */
export function getRecentPages(pages: Page[], limit: number = 5): Page[] {
  return pages
    .filter(page => !page.isArchived && !page.isDeleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

/**
 * Filter pages by various criteria
 */
export function filterPages(
  pages: Page[], 
  filters: {
    isArchived?: boolean
    isPublished?: boolean
    authorId?: string
    parentId?: string | null
    hasParent?: boolean
  }
): Page[] {
  return pages.filter(page => {
    if (filters.isArchived !== undefined && page.isArchived !== filters.isArchived) {
      return false
    }
    
    if (filters.isPublished !== undefined && page.isPublished !== filters.isPublished) {
      return false
    }
    
    if (filters.authorId && page.authorId !== filters.authorId) {
      return false
    }
    
    if (filters.parentId !== undefined && page.parentId !== filters.parentId) {
      return false
    }
    
    if (filters.hasParent !== undefined) {
      const hasParent = page.parentId !== null
      if (hasParent !== filters.hasParent) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Calculate tree metadata
 */
export function calculateTreeMeta(
  pageTree: PageTreeNode[], 
  favoritePageIds: string[] = []
): PageTreeMeta {
  let totalPages = 0
  let maxDepth = 0
  
  const traverse = (nodes: PageTreeNode[]) => {
    for (const node of nodes) {
      totalPages++
      maxDepth = Math.max(maxDepth, node.depth)
      traverse(node.children)
    }
  }
  
  traverse(pageTree)
  
  return {
    totalPages,
    maxDepth,
    favoritePages: favoritePageIds,
    recentPages: [] // This would be populated from user activity
  }
}