"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database as DatabaseIcon, Plus, Search, ExternalLink } from 'lucide-react'
import { CreateDatabaseDialog } from './CreateDatabaseDialog'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DatabaseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  pageId?: string
  onSelectDatabase: (databaseId: string) => void
}

export function DatabaseSelector({
  open,
  onOpenChange,
  workspaceId,
  pageId,
  onSelectDatabase
}: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (open && workspaceId) {
      loadDatabases()
    }
  }, [open, workspaceId])

  const loadDatabases = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/databases?workspaceId=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to load databases')
      }
      const data = await response.json()
      setDatabases(data)
    } catch (error) {
      console.error('Error loading databases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateDatabase = (database: any) => {
    setDatabases(prev => [database, ...prev])
    setShowCreateDialog(false)
    onSelectDatabase(database.id)
    onOpenChange(false)
  }

  const handleSelectDatabase = (databaseId: string) => {
    onSelectDatabase(databaseId)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open && !showCreateDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Database</DialogTitle>
            <DialogDescription>
              Choose an existing database or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search databases..."
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Database
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredDatabases.length === 0 ? (
              <div className="text-center py-12">
                <DatabaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'No databases found' : 'No databases yet'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Database
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredDatabases.map(database => (
                  <div
                    key={database.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border border-gray-200",
                      "hover:bg-gray-50 cursor-pointer transition-colors"
                    )}
                    onClick={() => handleSelectDatabase(database.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <DatabaseIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{database.name}</h3>
                        {database.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {database.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {database.rows?.length || 0} rows · {database.views?.length || 0} views
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/workspace/${workspaceId}/database/${database.id}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateDatabaseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        workspaceId={workspaceId}
        pageId={pageId}
        onCreateDatabase={handleCreateDatabase}
      />
    </>
  )
}