'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Clock, Star, ArrowRight, Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SearchResult, Page, RecentPage } from '@/types'
import { searchPages } from '@/lib/services/pages'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function SearchDialog({ open, onOpenChange, workspaceId }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])
  const [pages, setPages] = useState<Page[]>([])
  
  const router = useRouter()

  // Fetch recent pages on mount
  useEffect(() => {
    if (open) {
      fetchRecentPages()
      fetchAllPages()
    }
  }, [open, workspaceId])

  const fetchRecentPages = async () => {
    try {
      const response = await fetch(`/api/pages/recent?workspaceId=${workspaceId}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRecentPages(data)
      }
    } catch (error) {
      console.error('Failed to fetch recent pages:', error)
    }
  }

  const fetchAllPages = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages/tree`)
      if (response.ok) {
        const data = await response.json()
        // Flatten the tree to get all pages
        const allPages = flattenPageTree(data.tree)
        setPages(allPages)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    }
  }

  const flattenPageTree = (tree: any[]): Page[] => {
    const result: Page[] = []
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        result.push(node)
        if (node.children) {
          traverse(node.children)
        }
      })
    }
    traverse(tree)
    return result
  }

  // Search with debouncing
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      // Use client-side search for now
      const results = searchPages(pages, searchQuery, { limit: 10 })
      
      // Transform to SearchResult format
      const searchResults: SearchResult[] = results.map(page => ({
        id: page.id,
        type: 'page',
        title: page.title,
        icon: page.icon,
        workspaceId: page.workspaceId,
        pageId: page.id,
        highlights: [page.title],
        score: 100
      }))
      
      setSearchResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pages])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (pageId: string) => {
    // Track page access
    fetch('/api/pages/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId })
    }).catch(console.error)

    // Navigate to page
    router.push(`/workspace/${workspaceId}/page/${pageId}`)
    onOpenChange(false)
    setQuery('')
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      onOpenChange(true)
    }
  }, [onOpenChange])

  // Global keyboard shortcut
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const hasResults = searchResults.length > 0
  const showRecent = !query.trim() && recentPages.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search pages..."
              value={query}
              onValueChange={setQuery}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
            )}
          </div>

          <CommandList className="max-h-96 overflow-y-auto">
            {!query.trim() && (
              <>
                {showRecent && (
                  <CommandGroup heading="Recent">
                    {recentPages.map((page) => (
                      <CommandItem
                        key={page.pageId}
                        value={page.pageId}
                        onSelect={() => handleSelect(page.pageId)}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base">{page.icon || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{page.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Last accessed {new Date(page.lastAccessedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">
                    Start typing to search pages...
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tip: Use <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘K</kbd> to open search anytime
                  </div>
                </div>
              </>
            )}

            {query.trim() && (
              <>
                {hasResults ? (
                  <CommandGroup heading={`Results (${searchResults.length})`}>
                    {searchResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.pageId)}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base">{result.icon || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {highlightQuery(result.title, query)}
                          </div>
                          {result.content && (
                            <div className="text-xs text-muted-foreground truncate">
                              {highlightQuery(result.content.slice(0, 100), query)}...
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Page
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty className="py-6 text-center text-sm">
                    No pages found for "{query}".
                  </CommandEmpty>
                )}
              </>
            )}
          </CommandList>

          <Separator />
          
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-muted rounded">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-muted rounded">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-muted rounded">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div>
              {searchResults.length > 0 && (
                <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}