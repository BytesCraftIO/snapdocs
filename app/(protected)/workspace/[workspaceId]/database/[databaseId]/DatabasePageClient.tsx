"use client"

import { useState, useCallback } from 'react'
import { Database, DatabaseView, DatabaseRow } from '@/types'
import { DatabaseContainer } from '@/components/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface DatabaseWithRows extends Database {
  rows: DatabaseRow[]
}

interface DatabasePageClientProps {
  database: DatabaseWithRows
  workspaceId: string
}

export function DatabasePageClient({ database: initialDatabase, workspaceId }: DatabasePageClientProps) {
  const [database, setDatabase] = useState(initialDatabase)
  const [currentView, setCurrentView] = useState(database.views[0])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleViewChange = useCallback(async (view: DatabaseView) => {
    setCurrentView(view)
    
    // Update the view in the database
    try {
      const response = await fetch(`/api/databases/${database.id}/views/${view.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(view)
      })

      if (!response.ok) {
        throw new Error('Failed to update view')
      }
    } catch (error) {
      console.error('Error updating view:', error)
      toast.error('Failed to update view')
    }
  }, [database.id])

  const handleRowUpdate = useCallback(async (rowId: string, updates: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows/${rowId}`, {
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

      // Update the row in the local state
      setDatabase(prev => ({
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId ? { ...row, ...updatedRow } : row
        )
      }))

      toast.success('Row updated')
    } catch (error) {
      console.error('Error updating row:', error)
      toast.error('Failed to update row')
    } finally {
      setIsLoading(false)
    }
  }, [database.id])

  const handleRowCreate = useCallback(async (rowData: Partial<DatabaseRow>) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows`, {
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

      // Add the new row to the local state
      setDatabase(prev => ({
        ...prev,
        rows: [...prev.rows, newRow]
      }))

      toast.success('Row created')
    } catch (error) {
      console.error('Error creating row:', error)
      toast.error('Failed to create row')
    } finally {
      setIsLoading(false)
    }
  }, [database.id])

  const handleRowDelete = useCallback(async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this row?')) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows/${rowId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete row')
      }

      // Remove the row from the local state
      setDatabase(prev => ({
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      }))

      toast.success('Row deleted')
    } catch (error) {
      console.error('Error deleting row:', error)
      toast.error('Failed to delete row')
    } finally {
      setIsLoading(false)
    }
  }, [database.id])

  return (
    <div className="h-screen flex flex-col">
      {/* Database header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          {database.icon && (
            <span className="text-2xl">{database.icon}</span>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{database.name}</h1>
            {database.description && (
              <p className="text-gray-600 text-sm mt-1">{database.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Database content */}
      <div className="flex-1 overflow-hidden">
        <DatabaseContainer
          database={database}
          rows={database.rows}
          currentView={currentView}
          onViewChange={handleViewChange}
          onRowUpdate={handleRowUpdate}
          onRowCreate={handleRowCreate}
          onRowDelete={handleRowDelete}
          editable={true}
        />
      </div>
    </div>
  )
}