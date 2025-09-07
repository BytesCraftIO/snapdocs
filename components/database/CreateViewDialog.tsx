"use client"

import { useState } from "react"
import { DatabaseViewType } from "@/types"
import { cn } from "@/lib/utils"
import { 
  Table, 
  Kanban, 
  List, 
  Calendar, 
  Grid3X3,
  Clock,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateView: (name: string, type: DatabaseViewType) => Promise<void>
}

const viewTypes = [
  {
    type: 'TABLE' as DatabaseViewType,
    label: 'Table',
    description: 'View data in rows and columns',
    icon: Table
  },
  {
    type: 'BOARD' as DatabaseViewType,
    label: 'Board',
    description: 'Kanban-style board view',
    icon: Kanban
  },
  {
    type: 'LIST' as DatabaseViewType,
    label: 'List',
    description: 'Simple list of items',
    icon: List
  },
  {
    type: 'CALENDAR' as DatabaseViewType,
    label: 'Calendar',
    description: 'View items on a calendar',
    icon: Calendar
  },
  {
    type: 'GALLERY' as DatabaseViewType,
    label: 'Gallery',
    description: 'Visual cards with previews',
    icon: Grid3X3
  },
  {
    type: 'TIMELINE' as DatabaseViewType,
    label: 'Timeline',
    description: 'Chronological timeline view',
    icon: Clock
  }
]

export function CreateViewDialog({ open, onOpenChange, onCreateView }: CreateViewDialogProps) {
  const [viewName, setViewName] = useState("")
  const [selectedType, setSelectedType] = useState<DatabaseViewType>('TABLE')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!viewName.trim()) {
      setError("Please enter a view name")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      await onCreateView(viewName.trim(), selectedType)
      
      // Reset form and close dialog
      setViewName("")
      setSelectedType('TABLE')
      onOpenChange(false)
    } catch (err) {
      setError("Failed to create view. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      if (!newOpen) {
        // Reset form when closing
        setViewName("")
        setSelectedType('TABLE')
        setError("")
      }
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New View</DialogTitle>
          <DialogDescription>
            Create a new view to organize and display your database data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* View name input */}
          <div className="space-y-2">
            <Label htmlFor="viewName">View name</Label>
            <Input
              id="viewName"
              placeholder="Enter view name..."
              value={viewName}
              onChange={(e) => {
                setViewName(e.target.value)
                if (error) setError("")
              }}
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreate()
                }
              }}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* View type selection */}
          <div className="space-y-3">
            <Label>View type</Label>
            <div className="grid grid-cols-2 gap-3">
              {viewTypes.map((viewType) => {
                const Icon = viewType.icon
                const isSelected = selectedType === viewType.type
                
                return (
                  <button
                    key={viewType.type}
                    onClick={() => setSelectedType(viewType.type)}
                    disabled={isCreating}
                    className={cn(
                      "flex items-start gap-3 p-3 text-left border rounded-lg transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                      isCreating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 mt-0.5 flex-shrink-0",
                      isSelected ? "text-blue-600" : "text-gray-500"
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "font-medium mb-1",
                        isSelected ? "text-blue-900" : "text-gray-900"
                      )}>
                        {viewType.label}
                      </div>
                      <div className={cn(
                        "text-xs leading-relaxed",
                        isSelected ? "text-blue-700" : "text-gray-500"
                      )}>
                        {viewType.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !viewName.trim()}
          >
            {isCreating ? "Creating..." : "Create View"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}