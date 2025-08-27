"use client"

import { useState } from "react"
import { Database, DatabaseView } from "@/types"
import { cn } from "@/lib/utils"
import { 
  Table, 
  Kanban, 
  List, 
  Calendar, 
  Grid3X3, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus,
  MoreHorizontal,
  ChevronDown
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatabaseToolbarProps {
  database: Database
  currentView?: DatabaseView
  onViewChange?: (view: DatabaseView) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  editable?: boolean
}

const viewIcons = {
  table: Table,
  board: Kanban,
  list: List,
  calendar: Calendar,
  gallery: Grid3X3,
  timeline: List // Placeholder
}

const viewLabels = {
  table: 'Table',
  board: 'Board',
  list: 'List',
  calendar: 'Calendar',
  gallery: 'Gallery',
  timeline: 'Timeline'
}

export function DatabaseToolbar({
  database,
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  editable = true
}: DatabaseToolbarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSorts, setShowSorts] = useState(false)

  const handleViewChange = (view: DatabaseView) => {
    onViewChange?.(view)
  }

  const activeFilters = currentView?.filters?.length || 0
  const activeSorts = currentView?.sorts?.length || 0

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between p-3 gap-4">
        {/* Left section - Views and controls */}
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {currentView && (
                  <>
                    {(() => {
                      const Icon = viewIcons[currentView.type]
                      return <Icon className="w-4 h-4" />
                    })()}
                    {currentView.name}
                  </>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {database.views.map((view) => {
                const Icon = viewIcons[view.type]
                const isActive = currentView?.id === view.id
                
                return (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => handleViewChange(view)}
                    className={cn(
                      "gap-2",
                      isActive && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{view.name}</span>
                  </DropdownMenuItem>
                )
              })}
              
              {editable && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <DropdownMenuItem className="gap-2 text-blue-600">
                    <Plus className="w-4 h-4" />
                    <span>Add a view</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter button */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "gap-2",
              activeFilters > 0 && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilters > 0 && (
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                {activeFilters}
              </span>
            )}
          </Button>

          {/* Sort button */}
          <Button
            variant="outline"
            onClick={() => setShowSorts(!showSorts)}
            className={cn(
              "gap-2",
              activeSorts > 0 && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort
            {activeSorts > 0 && (
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                {activeSorts}
              </span>
            )}
          </Button>
        </div>

        {/* Right section - Search and actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Add property button */}
          {editable && (
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Property
            </Button>
          )}

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem>Import</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              {editable && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <DropdownMenuItem className="text-red-600">
                    Delete database
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter/Sort panels */}
      {showFilters && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-sm text-gray-600">
            Filter configuration would go here
          </div>
        </div>
      )}

      {showSorts && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-sm text-gray-600">
            Sort configuration would go here
          </div>
        </div>
      )}
    </div>
  )
}