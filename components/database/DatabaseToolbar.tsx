"use client"

import { useState } from "react"
import { Database, DatabaseView } from "@/types"
import { PropertyManager } from "./PropertyManager"
import { cn } from "@/lib/utils"
import { 
  Table, 
  Kanban, 
  List, 
  Calendar, 
  Grid3X3, 
  Search, 
  Plus,
  MoreHorizontal,
  Settings
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DatabaseToolbarProps {
  database: Database
  currentView?: DatabaseView
  onViewChange?: (view: DatabaseView) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  editable?: boolean
}

const viewIcons: Record<string, any> = {
  TABLE: Table,
  BOARD: Kanban,
  LIST: List,
  CALENDAR: Calendar,
  GALLERY: Grid3X3
}

export function DatabaseToolbar({
  database,
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  editable = true
}: DatabaseToolbarProps) {
  const [showPropertyManager, setShowPropertyManager] = useState(false)

  const handleViewChange = (view: DatabaseView) => {
    onViewChange?.(view)
  }

  const handleSaveProperties = async (properties: any) => {
    try {
      const response = await fetch(`/api/databases/${database.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update database properties')
      }
      
      // Reload database or update local state
      window.location.reload() // Simple refresh for now
    } catch (error) {
      console.error('Error updating properties:', error)
    }
  }

  return (
    <div className="border-b border-gray-100">
      <div className="flex items-center justify-between px-3 py-1 gap-3">
        {/* Left section - Views and controls */}
        <div className="flex items-center gap-1">
          {/* View tabs - Notion style */}
          <div className="flex items-center">
            {database.views.map((dbView) => {
              const Icon = viewIcons[dbView.type] || Table
              const isActive = currentView?.id === dbView.id
              return (
                <button
                  key={dbView.id}
                  onClick={() => handleViewChange(dbView)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-sm transition-all rounded",
                    isActive 
                      ? "bg-gray-100 text-gray-900 font-medium" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dbView.name}</span>
                </button>
              )
            })}
            
            {/* Add view button */}
            <button 
              className="ml-0.5 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="Add a view"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Properties button */}
          {editable && (
            <>
              <div className="h-3.5 w-px bg-gray-200 mx-0.5" />
              <button
                onClick={() => setShowPropertyManager(true)}
                className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-all"
              >
                <Settings className="w-3 h-3" />
                <span>Properties</span>
              </button>
            </>
          )}
        </div>

        {/* Right section - Search and menu */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className={cn(
                "pl-8 pr-3 py-1 text-sm w-44",
                "border rounded-md transition-all outline-none",
                "placeholder:text-gray-400",
                searchQuery 
                  ? "border-gray-300 bg-white" 
                  : "border-transparent hover:border-gray-200 focus:border-gray-300 hover:bg-gray-50 focus:bg-white"
              )}
            />
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem className="text-sm">Export view</DropdownMenuItem>
              <DropdownMenuItem className="text-sm">Duplicate view</DropdownMenuItem>
              <DropdownMenuItem className="text-sm text-red-600">Delete view</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Property Manager Dialog */}
      {showPropertyManager && (
        <PropertyManager
          properties={database.properties || []}
          open={showPropertyManager}
          onOpenChange={setShowPropertyManager}
          onSaveProperties={handleSaveProperties}
        />
      )}
    </div>
  )
}