'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Share, 
  MoreVertical, 
  Archive,
  Trash2,
  Copy,
  ExternalLink,
  Settings,
  Menu
} from 'lucide-react'
import { Block, PageContent } from '@/types'
import NotionEditor from '@/components/editor/NotionEditor'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

interface PageData {
  id: string
  title: string
  icon?: string
  coverImage?: string
  isPublished: boolean
  isArchived: boolean
  path: string
  workspaceId: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    avatarUrl?: string | null
  }
  workspace: {
    id: string
    name: string
    slug: string
  }
  parent?: {
    id: string
    title: string
    path: string
  } | null
}

interface PageEditorProps {
  page: PageData
  initialContent: PageContent | null
  user: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export default function PageEditor({ page, initialContent, user }: PageEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showPageMenu, setShowPageMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const initialBlocks = initialContent?.blocks || []

  // Auto-save page title
  const saveTitle = useCallback(async (newTitle: string) => {
    if (newTitle === page.title) return
    
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save title')
      }

      toast.success('Title saved')
    } catch (error) {
      console.error('Error saving title:', error)
      toast.error('Failed to save title')
      setTitle(page.title || '') // Reset to original title
    }
  }, [page.id, page.title])

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle)
    
    // Debounce the save
    const timeoutId = setTimeout(() => {
      saveTitle(newTitle)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [saveTitle])

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setIsEditingTitle(false)
      saveTitle(title)
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setTitle(page.title || '')
    }
  }

  // Auto-save page content
  const handleAutoSave = useCallback(async (blocks: Block[]) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/pages/${page.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
      throw error // Re-throw to trigger error state in editor
    } finally {
      setIsSaving(false)
    }
  }, [page.id])

  const handleArchivePage = async () => {
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isArchived: !page.isArchived
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive page')
      }

      toast.success(page.isArchived ? 'Page restored' : 'Page archived')
      router.refresh()
    } catch (error) {
      console.error('Error archiving page:', error)
      toast.error('Failed to archive page')
    }
  }

  const handleDeletePage = async () => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete page')
      }

      toast.success('Page deleted')
      router.push(`/workspace/${page.workspaceId}`)
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page')
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/workspace/${page.workspaceId}/page/${page.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between max-w-none">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Breadcrumbs 
                pageId={page.id}
                workspaceId={page.workspaceId}
                showHome={true}
                className="min-w-0 flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/workspace/${page.workspaceId}/page/${page.id}`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchivePage}>
                    <Archive className="w-4 h-4 mr-2" />
                    {page.isArchived ? 'Restore page' : 'Archive page'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeletePage} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="sm"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false)
                  saveTitle(title)
                }}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
                placeholder="Untitled"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl sm:text-4xl font-bold cursor-text hover:bg-accent/50 rounded transition-colors"
              >
                {title || (
                  <span className="text-muted-foreground">Untitled</span>
                )}
              </h1>
            )}
          </div>

          {/* Editor */}
          <NotionEditor
            pageId={page.id}
            initialBlocks={initialBlocks}
            onAutoSave={handleAutoSave}
            showSaveStatus={true}
            autoSaveInterval={2000}
          />
        </div>
      </div>
    </div>
  )
}