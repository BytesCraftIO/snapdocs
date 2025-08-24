'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface DeletedPage {
  id: string
  title: string
  icon?: string | null
  deletedAt: string
  parentId?: string | null
  path: string[]
}

export default function TrashPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const [deletedPages, setDeletedPages] = useState<DeletedPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDeletedPages()
  }, [workspaceId])

  const fetchDeletedPages = async () => {
    try {
      const response = await fetch(`/api/pages/trash?workspaceId=${workspaceId}`)
      if (response.ok) {
        const data = await response.json()
        setDeletedPages(data)
      }
    } catch (error) {
      console.error('Failed to fetch deleted pages:', error)
      toast.error('Failed to load trash')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (pageId: string, pageTitle: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/restore`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success(`"${pageTitle}" restored successfully`)
        fetchDeletedPages() // Refresh the list
        router.refresh() // Refresh sidebar
      } else {
        throw new Error('Failed to restore page')
      }
    } catch (error) {
      console.error('Error restoring page:', error)
      toast.error('Failed to restore page')
    }
  }

  const handlePermanentDelete = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${pageTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${pageId}/permanent`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`"${pageTitle}" permanently deleted`)
        fetchDeletedPages() // Refresh the list
      } else {
        throw new Error('Failed to delete page permanently')
      }
    } catch (error) {
      console.error('Error permanently deleting page:', error)
      toast.error('Failed to delete page permanently')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Trash</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Pages in trash will be permanently deleted after 30 days
        </p>
      </div>

      {deletedPages.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{page.icon || <FileText className="h-5 w-5 text-gray-400" />}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{page.title}</p>
                  <p className="text-sm text-gray-500">
                    Deleted {formatDistanceToNow(new Date(page.deletedAt))} ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(page.id, page.title)}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePermanentDelete(page.id, page.title)}
                  className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Forever
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}