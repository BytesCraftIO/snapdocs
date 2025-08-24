'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewPageDialog } from '@/components/pages/NewPageDialog'
import Link from 'next/link'

interface WorkspaceDashboardProps {
  workspace: any
  recentPages: any[]
  currentUser: any
}

export function WorkspaceDashboard({ 
  workspace, 
  recentPages, 
  currentUser 
}: WorkspaceDashboardProps) {
  const [newPageOpen, setNewPageOpen] = useState(false)
  const router = useRouter()

  const handleCreatePage = () => {
    setNewPageOpen(true)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = currentUser.name?.split(' ')[0] || 'there'
    
    if (hour < 12) return `Good morning, ${name}`
    if (hour < 17) return `Good afternoon, ${name}`
    return `Good evening, ${name}`
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#191919]">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Simple Greeting */}
        <h1 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-gray-100">
          {getGreeting()}
        </h1>

        {/* Quick Actions */}
        <div className="mb-12">
          <Button 
            onClick={handleCreatePage}
            variant="outline"
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            New page
          </Button>
        </div>

        {/* Recent Pages - Simple List */}
        {recentPages.length > 0 && (
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recently visited
            </h2>
            
            <div className="space-y-1">
              {recentPages.slice(0, 10).map((page) => (
                <Link
                  key={page.id}
                  href={`/workspace/${workspace.id}/page/${page.id}`}
                  className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="text-lg flex-shrink-0">
                    {page.icon || '📄'}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {page.title || 'Untitled'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(page.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentPages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No pages yet. Create your first page to get started.
            </p>
            <Button onClick={handleCreatePage}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first page
            </Button>
          </div>
        )}
      </div>

      {/* New Page Dialog */}
      {newPageOpen && (
        <NewPageDialog
          workspaceId={workspace.id}
          onClose={() => setNewPageOpen(false)}
          onSuccess={(pageId) => {
            setNewPageOpen(false)
            router.push(`/workspace/${workspace.id}/page/${pageId}`)
          }}
        />
      )}
    </div>
  )
}