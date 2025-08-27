"use client"

import { useState } from "react"
import { Database, DatabaseFilter, DatabaseProperty, FilterConditions } from "@/types"
import { cn } from "@/lib/utils"
import { Plus, X, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateId } from "@/lib/utils/id"

interface FilterMenuProps {
  database: Database
  filters: DatabaseFilter[]
  onFiltersChange: (filters: DatabaseFilter[]) => void
}

const filterConditionOptions: Record<string, string[]> = {
  text: ['equals', 'does_not_equal', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  number: ['equals', 'does_not_equal', 'greater_than', 'less_than', 'greater_than_or_equal_to', 'less_than_or_equal_to', 'is_empty', 'is_not_empty'],
  select: ['equals', 'does_not_equal', 'is_empty', 'is_not_empty'],
  multiSelect: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  date: ['equals', 'before', 'after', 'on_or_before', 'on_or_after', 'is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'],
  checkbox: ['equals', 'does_not_equal'],
  url: ['equals', 'does_not_equal', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  email: ['equals', 'does_not_equal', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  phone: ['equals', 'does_not_equal', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
}

const conditionLabels = {
  equals: 'Equals',
  does_not_equal: 'Does not equal',
  contains: 'Contains',
  does_not_contain: 'Does not contain',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_than_or_equal_to: 'Greater than or equal to',
  less_than_or_equal_to: 'Less than or equal to',
  before: 'Before',
  after: 'After',
  on_or_before: 'On or before',
  on_or_after: 'On or after',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
  past_week: 'Past week',
  past_month: 'Past month',
  past_year: 'Past year',
  next_week: 'Next week',
  next_month: 'Next month',
  next_year: 'Next year'
}

export function FilterMenu({ database, filters, onFiltersChange }: FilterMenuProps) {
  const [editingFilter, setEditingFilter] = useState<DatabaseFilter | null>(null)

  const addFilter = () => {
    const firstProperty = database.properties[0]
    if (!firstProperty) return

    const newFilter: DatabaseFilter = {
      id: generateId(),
      property: firstProperty.id,
      condition: getDefaultCondition(firstProperty.type),
      value: '',
      type: 'and'
    }

    onFiltersChange([...filters, newFilter])
    setEditingFilter(newFilter)
  }

  const updateFilter = (filterId: string, updates: Partial<DatabaseFilter>) => {
    const updatedFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, ...updates } : filter
    )
    onFiltersChange(updatedFilters)
    
    if (editingFilter?.id === filterId) {
      setEditingFilter({ ...editingFilter, ...updates })
    }
  }

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId))
    if (editingFilter?.id === filterId) {
      setEditingFilter(null)
    }
  }

  const getDefaultCondition = (propertyType: string): string => {
    const conditions = filterConditionOptions[propertyType]
    return conditions?.[0] || 'equals'
  }

  const getProperty = (propertyId: string) => {
    return database.properties.find(p => p.id === propertyId)
  }

  const getConditionsForProperty = (property: DatabaseProperty) => {
    return filterConditionOptions[property.type] || []
  }

  const needsValue = (condition: string) => {
    return !['is_empty', 'is_not_empty', 'past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'].includes(condition)
  }

  if (filters.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No filters applied</p>
          <Button onClick={addFilter} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add filter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {filters.map((filter, index) => {
        const property = getProperty(filter.property)
        if (!property) return null

        const conditions = getConditionsForProperty(property)
        const isEditing = editingFilter?.id === filter.id

        return (
          <div key={filter.id} className="flex items-center gap-2 p-3 bg-white border rounded-lg">
            {/* AND/OR connector */}
            {index > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                    {filter.type.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => updateFilter(filter.id, { type: 'and' })}>
                    AND
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateFilter(filter.id, { type: 'or' })}>
                    OR
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Property selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {property.name}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {database.properties.map(prop => (
                  <DropdownMenuItem
                    key={prop.id}
                    onClick={() => updateFilter(filter.id, { 
                      property: prop.id,
                      condition: getDefaultCondition(prop.type)
                    })}
                  >
                    {prop.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Condition selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {conditionLabels[filter.condition as keyof typeof conditionLabels] || filter.condition}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {conditions.map(condition => (
                  <DropdownMenuItem
                    key={condition}
                    onClick={() => updateFilter(filter.id, { condition })}
                  >
                    {conditionLabels[condition as keyof typeof conditionLabels] || condition}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Value input */}
            {needsValue(filter.condition) && (
              <Input
                placeholder="Enter value..."
                value={filter.value || ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                className="flex-1 h-8"
              />
            )}

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter(filter.id)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )
      })}

      {/* Add filter button */}
      <Button onClick={addFilter} variant="outline" size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Add filter
      </Button>
    </div>
  )
}