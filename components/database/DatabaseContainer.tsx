"use client"

import { useState, useMemo } from "react"
import { Database, DatabaseView, DatabaseRow } from "@/types"
import { DatabaseToolbar } from "./DatabaseToolbar"
import { TableView } from "./TableView"
import { BoardView } from "./BoardView"
import { ListView } from "./ListView"
import { CalendarView } from "./CalendarView"
import { GalleryView } from "./GalleryView"
import { cn } from "@/lib/utils"

interface DatabaseContainerProps {
  database: Database
  rows: DatabaseRow[]
  currentView?: DatabaseView
  onViewChange?: (view: DatabaseView) => void
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
  className?: string
}

export function DatabaseContainer({
  database,
  rows,
  currentView,
  onViewChange,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true,
  className
}: DatabaseContainerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use the provided view or default to the first view
  const activeView = currentView || database.views[0]
  
  // Filter and sort rows based on current view
  const processedRows = useMemo(() => {
    let filteredRows = [...rows]
    
    // Apply search filter
    if (searchQuery.trim()) {
      filteredRows = filteredRows.filter(row => {
        return Object.values(row.properties).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase())
          }
          return false
        })
      })
    }
    
    // Apply view filters
    if (activeView?.filters) {
      filteredRows = filteredRows.filter(row => {
        return activeView.filters.every(filter => {
          const value = row.properties[filter.property]
          // TODO: Implement proper filter logic based on condition
          return true
        })
      })
    }
    
    // Apply view sorts
    if (activeView?.sorts) {
      filteredRows.sort((a, b) => {
        for (const sort of activeView.sorts) {
          const aValue = a.properties[sort.property]
          const bValue = b.properties[sort.property]
          
          let comparison = 0
          if (aValue < bValue) comparison = -1
          else if (aValue > bValue) comparison = 1
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison
          }
        }
        return 0
      })
    }
    
    return filteredRows
  }, [rows, activeView, searchQuery])
  
  const renderView = () => {
    if (!activeView) {
      return <div className="p-8 text-center text-gray-500">No view configured</div>
    }
    
    const viewProps = {
      database,
      view: activeView,
      rows: processedRows,
      onRowUpdate,
      onRowCreate,
      onRowDelete,
      editable
    }
    
    switch (activeView.type) {
      case 'table':
        return <TableView {...viewProps} />
      case 'board':
        return <BoardView {...viewProps} />
      case 'list':
        return <ListView {...viewProps} />
      case 'calendar':
        return <CalendarView {...viewProps} />
      case 'gallery':
        return <GalleryView {...viewProps} />
      default:
        return <TableView {...viewProps} />
    }
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <DatabaseToolbar
        database={database}
        currentView={activeView}
        onViewChange={onViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        editable={editable}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  )
}