"use client"

import { useState, useEffect, useRef } from 'react'
import { DatabaseContainer } from '@/components/database'
import { cn } from '@/lib/utils'
import { Database as DatabaseIcon, ExternalLink, Check, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { 
  createDatabaseSync, 
  cleanupDatabaseSync, 
  updateRow, 
  deleteRow, 
  getAllRows,
  subscribeToRows,
  DatabaseSync 
} from '@/lib/collaboration/database-sync'

interface DatabaseBlockProps {
  data: {
    databaseId?: string
    workspaceId?: string
    pageId?: string
    fullPage?: boolean
    maxRows?: number
  }
  editor: any
  blockId?: string
  onPropsChange?: (props: any) => void
}

export default function DatabaseBlock({ data, editor, blockId, onPropsChange }: DatabaseBlockProps) {
  const [database, setDatabase] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [databaseName, setDatabaseName] = useState('')
  const [tempName, setTempName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)
  const syncRef = useRef<DatabaseSync | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const { databaseId, workspaceId, pageId, fullPage = false, maxRows = 10 } = data

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (syncRef.current) {
        cleanupDatabaseSync(syncRef.current)
      }
    }
  }, [])

  // Setup real-time sync when database is loaded
  useEffect(() => {
    if (database?.id && workspaceId) {
      // Clean up previous sync
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (syncRef.current) {
        cleanupDatabaseSync(syncRef.current)
      }

      // Create new sync
      const sync = createDatabaseSync(database.id, workspaceId)
      syncRef.current = sync

      // Initialize Yjs with current rows
      rows.forEach(row => {
        sync.rows.set(row.id, {
          ...row,
          properties: row.properties || {}
        })
      })

      // Subscribe to changes
      unsubscribeRef.current = subscribeToRows(sync.rows, (updatedRows) => {
        setRows(updatedRows.slice(0, maxRows))
      })

      // Also sync metadata like database name
      sync.metadata.set('name', databaseName)
      sync.metadata.observe(() => {
        const name = sync.metadata.get('name')
        if (name && name !== databaseName) {
          setDatabaseName(name)
        }
      })
    }
  }, [database?.id, workspaceId])

  // Auto-create database on mount if no databaseId exists
  useEffect(() => {
    if (!hasInitialized.current && workspaceId && (!databaseId || databaseId === '')) {
      hasInitialized.current = true
      createNewDatabase()
    } else if (databaseId && databaseId !== '') {
      loadDatabase()
    }
  }, [databaseId, workspaceId])

  // Focus input when editing name
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  const createNewDatabase = async () => {
    if (!workspaceId) return
    
    try {
      setIsLoading(true)
      setError(null)

      // Create a new database with default properties
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          pageId,
          name: 'Untitled Database',
          properties: [
            {
              id: 'title',
              name: 'Name',
              type: 'text',
              options: {}
            },
            {
              id: 'status',
              name: 'Status',
              type: 'select',
              options: {
                choices: [
                  { id: 'todo', name: 'To Do', color: 'gray' },
                  { id: 'in-progress', name: 'In Progress', color: 'blue' },
                  { id: 'done', name: 'Done', color: 'green' }
                ]
              }
            },
            {
              id: 'priority',
              name: 'Priority',
              type: 'select',
              options: {
                choices: [
                  { id: 'low', name: 'Low', color: 'gray' },
                  { id: 'medium', name: 'Medium', color: 'yellow' },
                  { id: 'high', name: 'High', color: 'red' }
                ]
              }
            }
          ],
          viewType: 'TABLE'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create database')
      }

      const newDatabase = await response.json()
      
      // Update the block with the new database ID
      updateBlockDatabaseId(newDatabase.id)
      
      // Transform the database to ensure it has views
      const transformedDatabase = {
        ...newDatabase,
        properties: newDatabase.properties || [],
        views: newDatabase.views || [{
          id: crypto.randomUUID(),
          name: 'All',
          type: 'TABLE',
          filters: [],
          sorts: [],
          properties: {}, // Initialize empty properties object
          config: {
            wrap: false
          }
        }],
        rows: newDatabase.rows || []
      }
      
      // Load the created database
      setDatabase(transformedDatabase)
      setDatabaseName(transformedDatabase.name)
      setRows(transformedDatabase.rows)
      
      // Start editing the name immediately
      setTimeout(() => {
        setIsEditingName(true)
        setTempName(transformedDatabase.name)
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create database')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDatabase = async (dbId?: string) => {
    const idToLoad = dbId || databaseId
    if (!idToLoad || idToLoad === '') return
    
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/databases/${idToLoad}`)
      if (!response.ok) {
        throw new Error('Failed to load database')
      }

      const dbData = await response.json()
      
      // Transform the data to match our types
      const transformedDatabase = {
        ...dbData,
        properties: dbData.properties || [],
        views: dbData.views?.map((view: any) => ({
          ...view,
          filters: view.filters || [],
          sorts: view.sorts || [],
          properties: view.properties || {}, // Ensure properties is always an object
          config: view.config || { wrap: false }
        })) || [{
          id: crypto.randomUUID(),
          name: 'All',
          type: 'TABLE',
          filters: [],
          sorts: [],
          properties: {},
          config: { wrap: false }
        }],
        rows: dbData.rows?.map((row: any) => ({
          ...row,
          properties: row.properties || {}
        })) || []
      }

      setDatabase(transformedDatabase)
      setDatabaseName(transformedDatabase.name)
      setRows(transformedDatabase.rows.slice(0, maxRows))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database')
    } finally {
      setIsLoading(false)
    }
  }

  const updateBlockDatabaseId = (newDatabaseId: string) => {
    try {
      // Use the onPropsChange callback if available
      if (onPropsChange) {
        onPropsChange({
          databaseId: newDatabaseId,
          workspaceId: workspaceId || '',
          pageId: pageId || '',
          fullPage: fullPage,
          maxRows: maxRows
        })
        return
      }
      
      // Fallback to finding the block in the document
      const blocks = editor.document || []
      let databaseBlock = null
      
      // First try to get the current block position
      const position = editor?.getTextCursorPosition?.()
      if (position?.block && position.block.type === 'database') {
        databaseBlock = position.block
      }
      
      // If not found, search for this database block in the document by blockId
      if (!databaseBlock && blockId) {
        for (const block of blocks) {
          if (block.id === blockId) {
            databaseBlock = block
            break
          }
        }
      }
      
      // If still not found, search for any database block without an ID
      if (!databaseBlock) {
        for (const block of blocks) {
          if (block.type === 'database' && 
              (!block.props.databaseId || block.props.databaseId === '')) {
            databaseBlock = block
            break
          }
        }
      }
      
      if (databaseBlock) {
        const updatedBlock = {
          ...databaseBlock,
          props: {
            ...databaseBlock.props,
            databaseId: newDatabaseId,
            workspaceId: workspaceId || '',
            pageId: pageId || '',
            fullPage: fullPage,
            maxRows: maxRows
          }
        }
        editor.updateBlock(databaseBlock, updatedBlock)
      }
    } catch (error) {
      console.error('Error updating block:', error)
    }
  }

  const handleSaveName = async () => {
    if (!database?.id || tempName === databaseName) {
      setIsEditingName(false)
      return
    }

    try {
      const response = await fetch(`/api/databases/${database.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tempName })
      })

      if (!response.ok) {
        throw new Error('Failed to update database name')
      }

      setDatabaseName(tempName)
      setDatabase((prev: any) => ({ ...prev, name: tempName }))
      
      // Update in Yjs for real-time sync
      if (syncRef.current) {
        syncRef.current.metadata.set('name', tempName)
      }
      
      setIsEditingName(false)
    } catch (error) {
      console.error('Error updating database name:', error)
      setTempName(databaseName) // Reset to original name on error
      setIsEditingName(false)
    }
  }

  const handleCancelEdit = () => {
    setTempName(databaseName)
    setIsEditingName(false)
  }

  const handleRowUpdate = async (rowId: string, updates: any) => {
    if (!database?.id) return
    
    // Update in Yjs immediately for real-time sync
    if (syncRef.current) {
      const existingRow = rows.find(r => r.id === rowId)
      if (existingRow) {
        updateRow(syncRef.current.rows, rowId, {
          ...existingRow,
          properties: { ...existingRow.properties, ...updates }
        })
      }
    } else {
      // Fallback to local state update
      setRows(prev => 
        prev.map(row => row.id === rowId ? { 
          ...row, 
          properties: { ...row.properties, ...updates }
        } : row)
      )
    }
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: updates })
      })

      if (!response.ok) {
        // Revert on error
        if (syncRef.current) {
          const originalRow = rows.find(r => r.id === rowId)
          if (originalRow) {
            updateRow(syncRef.current.rows, rowId, originalRow)
          }
        } else {
          setRows(prev => 
            prev.map(row => row.id === rowId ? 
              rows.find(r => r.id === rowId) || row : row
            )
          )
        }
        throw new Error('Failed to update row')
      }
    } catch (error) {
      console.error('Error updating row:', error)
    }
  }

  const handleRowCreate = async (rowData: any) => {
    if (!database?.id) return
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rowData || { properties: {} })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Failed to create row:', errorData)
        throw new Error('Failed to create row')
      }

      const newRow = await response.json()
      
      // Add to Yjs for real-time sync
      if (syncRef.current) {
        updateRow(syncRef.current.rows, newRow.id, newRow)
      } else {
        // Fallback to local state update
        setRows(prev => {
          const newRows = [...prev, newRow]
          return newRows.slice(0, maxRows)
        })
      }
      
      // Also update database rows count
      setDatabase((prev: any) => ({
        ...prev,
        rows: [...(prev.rows || []), newRow]
      }))
    } catch (error) {
      console.error('Error creating row:', error)
    }
  }

  const handleRowDelete = async (rowId: string) => {
    if (!database?.id) return
    
    // Delete from Yjs immediately for real-time sync
    if (syncRef.current) {
      deleteRow(syncRef.current.rows, rowId)
    } else {
      // Fallback to local state update
      setRows(prev => prev.filter(row => row.id !== rowId))
    }
    
    try {
      const response = await fetch(`/api/databases/${database.id}/rows/${rowId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert on error
        const originalRow = database.rows?.find((r: any) => r.id === rowId)
        if (originalRow && syncRef.current) {
          updateRow(syncRef.current.rows, rowId, originalRow)
        } else if (originalRow) {
          setRows(prev => [...prev, originalRow])
        }
        throw new Error('Failed to delete row')
      }
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const toggleFullPage = () => {
    try {
      const position = editor?.getTextCursorPosition?.()
      if (position?.block) {
        const updatedBlock = {
          ...position.block,
          props: {
            ...position.block.props,
            databaseId: database?.id || '',
            workspaceId: workspaceId || '',
            pageId: pageId || '',
            fullPage: !fullPage,
            maxRows: maxRows
          }
        }
        editor.updateBlock(position.block, updatedBlock)
      }
    } catch (error) {
      console.error('Error toggling full page:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="border border-gray-200 rounded-lg p-12 text-center my-4 bg-white"
        contentEditable={false}
      >
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Creating database...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className="border border-red-200 rounded-lg p-8 text-center bg-red-50 my-4"
        contentEditable={false}
      >
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => createNewDatabase()}>
          Try Again
        </Button>
      </div>
    )
  }

  // Database not loaded yet
  if (!database) {
    return (
      <div
        className="border border-gray-200 rounded-lg p-8 text-center my-4"
        contentEditable={false}
      >
        <p className="text-gray-500">Loading database...</p>
      </div>
    )
  }

  // Render database
  return (
    <div
      className="my-4"
      contentEditable={false}
    >
      <div className="group/database my-1">
        {/* Database header with inline name editing */}
        <div className="flex items-center justify-between mb-1 px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              onClick={() => {}}
            >
              <DatabaseIcon className="w-3.5 h-3.5 text-gray-500" />
            </button>
            
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={nameInputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveName()
                    } else if (e.key === 'Escape') {
                      handleCancelEdit()
                    }
                  }}
                  className="h-5 text-xs font-medium px-1 py-0 min-w-[100px]"
                  placeholder="Database name"
                />
                <button
                  onClick={handleSaveName}
                  className="p-0.5 hover:bg-green-100 rounded transition-colors"
                  title="Save"
                >
                  <Check className="w-3 h-3 text-green-600" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-0.5 hover:bg-red-100 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group/name">
                <h3 className="text-xs font-medium text-gray-800">{databaseName}</h3>
                <button
                  onClick={() => {
                    setIsEditingName(true)
                    setTempName(databaseName)
                  }}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover/name:opacity-100"
                  title="Edit name"
                >
                  <Edit2 className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
            
            <span className="text-[10px] text-gray-500">
              {rows.length} items
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover/database:opacity-100 transition-opacity">
            <button
              onClick={toggleFullPage}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={fullPage ? 'Collapse' : 'Expand'}
            >
              {fullPage ? (
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            {workspaceId && (
              <Link
                href={`/workspace/${workspaceId}/database/${database.id}`}
                target="_blank"
              >
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Open as full page"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Database content */}
        <div className={cn(
          "border border-gray-200 rounded-md overflow-hidden bg-white",
          fullPage ? "max-h-[600px]" : "max-h-[300px]"
        )}>
          <DatabaseContainer
            database={database}
            rows={rows}
            currentView={database.views?.[0]}
            onRowUpdate={handleRowUpdate}
            onRowCreate={handleRowCreate}
            onRowDelete={handleRowDelete}
            editable={true}
            className="border-none"
          />
        </div>

        {/* Show more indicator */}
        {database.rows?.length > maxRows && (
          <div className="mt-1 px-0.5">
            <Link
              href={`/workspace/${workspaceId}/database/${database.id}`}
              className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline"
            >
              Show {database.rows.length - maxRows} more →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}