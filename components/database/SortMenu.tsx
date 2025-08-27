"use client"

import { useState } from "react"
import { Database, DatabaseSort } from "@/types"
import { cn } from "@/lib/utils"
import { Plus, X, ChevronDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface SortMenuProps {
  database: Database
  sorts: DatabaseSort[]
  onSortsChange: (sorts: DatabaseSort[]) => void
}

export function SortMenu({ database, sorts, onSortsChange }: SortMenuProps) {
  const addSort = () => {
    const firstProperty = database.properties[0]
    if (!firstProperty) return

    const newSort: DatabaseSort = {
      property: firstProperty.id,
      direction: 'asc'
    }

    onSortsChange([...sorts, newSort])
  }

  const updateSort = (index: number, updates: Partial<DatabaseSort>) => {
    const updatedSorts = sorts.map((sort, i) =>
      i === index ? { ...sort, ...updates } : sort
    )
    onSortsChange(updatedSorts)
  }

  const removeSort = (index: number) => {
    onSortsChange(sorts.filter((_, i) => i !== index))
  }

  const moveSort = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sorts.length) return

    const newSorts = [...sorts]
    const [removed] = newSorts.splice(fromIndex, 1)
    newSorts.splice(toIndex, 0, removed)
    onSortsChange(newSorts)
  }

  const getProperty = (propertyId: string) => {
    return database.properties.find(p => p.id === propertyId)
  }

  const getAvailableProperties = (currentIndex: number) => {
    const usedProperties = sorts
      .filter((_, i) => i !== currentIndex)
      .map(sort => sort.property)
    
    return database.properties.filter(prop => !usedProperties.includes(prop.id))
  }

  if (sorts.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No sorts applied</p>
          <Button onClick={addSort} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add sort
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-600 mb-3">
        Sort by the following properties in order:
      </div>

      {sorts.map((sort, index) => {
        const property = getProperty(sort.property)
        if (!property) return null

        const availableProperties = getAvailableProperties(index)

        return (
          <div key={index} className="flex items-center gap-2 p-3 bg-white border rounded-lg">
            {/* Sort order indicator */}
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveSort(index, index - 1)}
                disabled={index === 0}
                className="p-0.5 h-auto opacity-50 hover:opacity-100 disabled:opacity-25"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveSort(index, index + 1)}
                disabled={index === sorts.length - 1}
                className="p-0.5 h-auto opacity-50 hover:opacity-100 disabled:opacity-25"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Property selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {property.name}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => updateSort(index, { property: property.id })}
                  className="font-medium"
                >
                  {property.name}
                </DropdownMenuItem>
                {availableProperties.map(prop => (
                  <DropdownMenuItem
                    key={prop.id}
                    onClick={() => updateSort(index, { property: prop.id })}
                  >
                    {prop.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direction selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {sort.direction === 'asc' ? (
                    <>
                      <ArrowUp className="w-3 h-3" />
                      Ascending
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3 h-3" />
                      Descending
                    </>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateSort(index, { direction: 'asc' })}>
                  <ArrowUp className="w-3 h-3 mr-2" />
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSort(index, { direction: 'desc' })}>
                  <ArrowDown className="w-3 h-3 mr-2" />
                  Descending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSort(index)}
              className="p-1 h-auto ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )
      })}

      {/* Add sort button */}
      <Button 
        onClick={addSort} 
        variant="outline" 
        size="sm" 
        className="gap-2"
        disabled={sorts.length >= database.properties.length}
      >
        <Plus className="w-4 h-4" />
        Add sort
      </Button>
    </div>
  )
}