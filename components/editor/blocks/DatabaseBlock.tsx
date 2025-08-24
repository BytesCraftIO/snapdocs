"use client"

import { useState, useEffect } from 'react'
import { Block } from '@/types'
import { DatabaseContainer } from '@/components/database'
import { cn } from '@/lib/utils'
import { Database as DatabaseIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DatabaseBlockProps {
  block: Block
  isSelected: boolean
  onUpdate: (id: string, updates: Partial<Block>) => void
  onSelect: (id: string) => void
  editable?: boolean
}

export function DatabaseBlock({
  block,
  isSelected,
  onUpdate,
  onSelect,
  editable = true
}: DatabaseBlockProps) {
  const [database, setDatabase] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const databaseId = block.properties?.databaseId
  const isFullPage = block.properties?.fullPage
  const maxRows = block.properties?.maxRows || 10

  useEffect(() => {
    if (databaseId) {
      loadDatabase()
    } else {
      setIsLoading(false)
    }
  }, [databaseId])

  const loadDatabase = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/databases/${databaseId}`)
      if (!response.ok) {
        throw new Error('Failed to load database')
      }

      const data = await response.json()
      
      // Transform the data to match our types
      const transformedDatabase = {
        ...data,
        properties: data.properties || [],
        views: data.views?.map((view: any) => ({
          ...view,
          filters: [], // TODO: Parse from config
          sorts: [], // TODO: Parse from config
          properties: {}, // TODO: Parse from config
          config: view.config || {}
        })) || [],
        rows: data.rows?.map((row: any) => ({
          ...row,
          properties: row.properties || {}
        })) || []
      }

      setDatabase(transformedDatabase)
      setRows(transformedDatabase.rows.slice(0, maxRows))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowUpdate = async (rowId: string, updates: any) => {
    try {
      const response = await fetch(`/api/databases/${databaseId}/rows/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update row')
      }

      const updatedRow = await response.json()
      setRows(prev => 
        prev.map(row => row.id === rowId ? { ...row, ...updatedRow } : row)
      )
    } catch (error) {
      console.error('Error updating row:', error)
    }
  }

  const handleRowCreate = async (rowData: any) => {
    try {
      const response = await fetch(`/api/databases/${databaseId}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rowData)
      })

      if (!response.ok) {
        throw new Error('Failed to create row')
      }

      const newRow = await response.json()
      if (rows.length < maxRows) {
        setRows(prev => [...prev, newRow])
      }
      
      // Update the full database data
      await loadDatabase()
    } catch (error) {
      console.error('Error creating row:', error)
    }
  }

  const handleRowDelete = async (rowId: string) => {
    try {
      const response = await fetch(`/api/databases/${databaseId}/rows/${rowId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete row')
      }

      setRows(prev => prev.filter(row => row.id !== rowId))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const toggleFullPage = () => {
    onUpdate(block.id, {
      properties: {
        ...block.properties,
        fullPage: !isFullPage
      }
    })
  }

  if (!databaseId) {
    return (
      <div
        className={cn(
          "border border-dashed border-gray-300 rounded-lg p-8 text-center",
          isSelected && "border-blue-500 bg-blue-50"
        )}
        onClick={() => onSelect(block.id)}
      >
        <DatabaseIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 mb-4">No database selected</p>
        {editable && (
          <Button variant="outline" size="sm">
            Select Database
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "border border-gray-200 rounded-lg p-8 text-center",
          isSelected && "border-blue-500 bg-blue-50"
        )}
        onClick={() => onSelect(block.id)}
      >
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-gray-500">Loading database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          "border border-red-200 rounded-lg p-8 text-center bg-red-50",
          isSelected && "border-red-500"
        )}
        onClick={() => onSelect(block.id)}
      >
        <p className="text-red-600 mb-4">{error}</p>
        {editable && (
          <Button variant="outline" size="sm" onClick={loadDatabase}>
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (!database) {
    return (
      <div
        className={cn(
          "border border-gray-200 rounded-lg p-8 text-center",
          isSelected && "border-blue-500 bg-blue-50"
        )}
        onClick={() => onSelect(block.id)}
      >
        <p className="text-gray-500">Database not found</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg overflow-hidden",
        isSelected && "border-blue-500 shadow-lg"
      )}
      onClick={() => onSelect(block.id)}
    >
      {/* Database header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">{database.name}</span>
          <span className="text-xs text-gray-500">
            ({database.rows?.length || 0} rows)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullPage}
                className="text-xs"
              >
                {isFullPage ? 'Show Less' : 'Show More'}
              </Button>
              <Link
                href={`/workspace/${database.workspaceId}/database/${database.id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Database content */}
      <div className={cn(
        "overflow-hidden",
        isFullPage ? "max-h-[600px]" : "max-h-[300px]"
      )}>
        <DatabaseContainer
          database={database}
          rows={rows}
          currentView={database.views?.[0]}
          onRowUpdate={handleRowUpdate}
          onRowCreate={handleRowCreate}
          onRowDelete={handleRowDelete}
          editable={editable}
          className="border-none"
        />
      </div>

      {/* Show more indicator */}
      {database.rows?.length > maxRows && (
        <div className="px-3 py-2 text-center text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
          {database.rows.length - maxRows} more rows...{' '}
          <Link
            href={`/workspace/${database.workspaceId}/database/${database.id}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View full database
          </Link>
        </div>
      )}
    </div>
  )
}