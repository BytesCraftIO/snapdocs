'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Block, PageContent } from '@/types'
import dynamic from 'next/dynamic'
import { SnapDocsPageHeader } from '@/components/page/snapdocs-page-header'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
// import { useSocket } from '@/lib/socket/client' // Removed - using Yjs collaboration now

// Dynamically import BlockNoteEditor to avoid SSR hydration issues
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/BlockNoteEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
)

interface PageData {
  id: string
  title: string
  icon?: string
  coverImage?: string
  isPublished: boolean
  isArchived: boolean
  isFavorite?: boolean
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
  workspaceMembers?: Array<{
    id: string
    name?: string | null
    email?: string | null
  }>
}

export default function PageEditorV2({ page, initialContent, user, workspaceMembers = [] }: PageEditorProps) {
  const router = useRouter()
  // const { isConnected, joinPage, leavePage } = useSocket() // Removed - using Yjs collaboration now
  const [title, setTitle] = useState(page.title || '')
  const [icon, setIcon] = useState(page.icon || '')
  const [coverImage, setCoverImage] = useState(page.coverImage || '')
  const [showCoverOptions, setShowCoverOptions] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(page.updatedAt)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialBlocks = initialContent?.blocks || []

  // Yjs collaboration is now handled directly in BlockNoteEditor component
  // No need for Socket.io room joining


  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
    }
  }, [title])

  // Auto-save page title
  const saveTitle = useCallback(async (newTitle: string) => {
    if (newTitle === page.title) return
    
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
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
      
      // Update the last updated timestamp
      setLastUpdated(new Date().toISOString())
      
      // Refresh the router to update the sidebar
      router.refresh()
    } catch (error) {
      console.error('Error saving title:', error)
      toast.error('Failed to save title')
      setTitle(page.title || '')
    }
  }, [page.id, page.title, router])

  // Debounced title save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title !== page.title) {
        saveTitle(title)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [title, page.title, saveTitle])

  // Auto-save page content
  const handleAutoSave = useCallback(async (newBlocks: Block[]) => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/pages/${page.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks: newBlocks
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save content')
      }
      
      // Update the last updated timestamp
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [page.id])

  const handleAddIcon = () => {
    // For now, just set a random emoji
    const emojis = ['📄', '📝', '📋', '🎯', '💡', '🚀', '⭐', '🔥', '💎', '🎨']
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    setIcon(randomEmoji)
    savePageMeta({ icon: randomEmoji })
  }

  const handleRemoveIcon = () => {
    setIcon('')
    savePageMeta({ icon: '' })
  }

  const handleAddCover = () => {
    // For demo, set a gradient background
    const gradients = [
      'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
      'linear-gradient(to right, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
      'linear-gradient(to right, #30cfd0 0%, #330867 100%)'
    ]
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]
    setCoverImage(randomGradient)
    savePageMeta({ coverImage: randomGradient })
  }

  const handleRemoveCover = () => {
    setCoverImage('')
    savePageMeta({ coverImage: '' })
  }

  const savePageMeta = async (updates: Partial<PageData>) => {
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }
      
      // Update the last updated timestamp
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save changes')
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/workspace/${page.workspaceId}/page/${page.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const handleDeletePage = async () => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete page')
      }

      toast.success('Page moved to trash')
      router.push(`/workspace/${page.workspaceId}`)
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page')
    }
  }

  // Format dates
  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return d.toLocaleDateString()
  }

  const handleRefresh = () => {
    router.refresh()
  }
  

  return (
    <div className="min-h-screen bg-white dark:bg-[#191919]">
      {/* SnapDocs-style Page Header */}
      <SnapDocsPageHeader 
        page={{...page, icon, coverImage, updatedAt: lastUpdated}} 
        workspaceId={page.workspaceId}
        onUpdate={handleRefresh}
      />
      
      {/* Main Content - SnapDocs-style centered layout */}
      <div className="w-full px-[96px] pb-[30vh]">
        <div className="max-w-[900px] mx-auto">
          {/* Title */}
          <div className={cn(
            "pt-4",
            !icon && !coverImage && "pt-[5vh]"
          )}>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className={cn(
                "w-full bg-transparent border-none outline-none resize-none",
                "text-[40px] font-bold text-[#37352f] dark:text-[#e9e9e7] leading-[1.2]",
                "placeholder:text-[#37352f4d] dark:placeholder:text-[#e9e9e780]"
              )}
              rows={1}
              style={{ 
                fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
              }}
            />
          </div>

          {/* Editor */}
          <div className="mt-2">
            <BlockNoteEditor
              pageId={page.id}
              workspaceId={page.workspaceId}
              initialBlocks={initialBlocks}
              onAutoSave={handleAutoSave}
              showSaveStatus={false}
              autoSaveInterval={2000}
              userId={user?.id}
              user={user}
              workspaceMembers={workspaceMembers}
            />
          </div>
        </div>
      </div>
    </div>
  )
}