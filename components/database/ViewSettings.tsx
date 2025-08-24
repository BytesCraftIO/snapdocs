"use client"

import { useState } from "react"
import { Database, DatabaseView, DatabaseProperty } from "@/types"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, GripVertical, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ViewSettingsProps {
  database: Database
  view: DatabaseView
  onViewChange: (updates: Partial<DatabaseView>) => void
}

export function ViewSettings({ database, view, onViewChange }: ViewSettingsProps) {
  const [draggedProperty, setDraggedProperty] = useState<string | null>(null)

  // Get properties sorted by their order in the view
  const sortedProperties = database.properties.sort((a, b) => {
    const aOrder = view.properties[a.id]?.order ?? 999
    const bOrder = view.properties[b.id]?.order ?? 999
    return aOrder - bOrder
  })

  const togglePropertyVisibility = (propertyId: string) => {
    const currentVisible = view.properties[propertyId]?.visible !== false
    onViewChange({
      properties: {
        ...view.properties,
        [propertyId]: {
          ...view.properties[propertyId],
          visible: !currentVisible,
          order: view.properties[propertyId]?.order ?? database.properties.findIndex(p => p.id === propertyId)
        }
      }
    })
  }

  const updatePropertyWidth = (propertyId: string, width: number) => {
    onViewChange({
      properties: {
        ...view.properties,
        [propertyId]: {
          ...view.properties[propertyId],
          width,
          visible: view.properties[propertyId]?.visible !== false,
          order: view.properties[propertyId]?.order ?? database.properties.findIndex(p => p.id === propertyId)
        }
      }
    })
  }

  const reorderProperties = (fromIndex: number, toIndex: number) => {
    const newProperties = { ...view.properties }
    
    sortedProperties.forEach((prop, index) => {
      let newOrder = index
      if (index === fromIndex) {
        newOrder = toIndex
      } else if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
        newOrder = index - 1
      } else if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
        newOrder = index + 1
      }
      
      newProperties[prop.id] = {
        ...newProperties[prop.id],
        order: newOrder,
        visible: newProperties[prop.id]?.visible !== false
      }
    })

    onViewChange({ properties: newProperties })
  }

  const handleDragStart = (propertyId: string) => {
    setDraggedProperty(propertyId)
  }

  const handleDragOver = (e: React.DragEvent, targetPropertyId: string) => {
    e.preventDefault()
    
    if (!draggedProperty || draggedProperty === targetPropertyId) return

    const fromIndex = sortedProperties.findIndex(p => p.id === draggedProperty)
    const toIndex = sortedProperties.findIndex(p => p.id === targetPropertyId)
    
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderProperties(fromIndex, toIndex)
    }
  }

  const handleDragEnd = () => {
    setDraggedProperty(null)
  }

  const updateViewConfig = (updates: Partial<DatabaseView['config']>) => {
    onViewChange({
      config: {
        ...view.config,
        ...updates
      }
    })
  }

  return (
    <div className="p-4 space-y-6">
      {/* View name */}
      <div className="space-y-2">
        <Label htmlFor="viewName">View name</Label>
        <Input
          id="viewName"
          value={view.name}
          onChange={(e) => onViewChange({ name: e.target.value })}
          placeholder="Enter view name"
        />
      </div>

      <Separator />

      {/* Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <h3 className="font-medium">Properties</h3>
        </div>

        <div className="space-y-2">
          {sortedProperties.map((property, index) => {
            const viewProperty = view.properties[property.id]
            const isVisible = viewProperty?.visible !== false
            const width = viewProperty?.width

            return (
              <div
                key={property.id}
                draggable
                onDragStart={() => handleDragStart(property.id)}
                onDragOver={(e) => handleDragOver(e, property.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 p-2 border rounded-lg bg-white",
                  draggedProperty === property.id && "opacity-50"
                )}
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />

                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePropertyVisibility(property.id)}
                  className="p-1 h-auto"
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </Button>

                {/* Property info */}
                <div className="flex-1">
                  <div className="font-medium text-sm">{property.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{property.type}</div>
                </div>

                {/* Width setting for table view */}
                {view.type === 'table' && isVisible && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`width-${property.id}`} className="text-xs text-gray-500">
                      Width
                    </Label>
                    <Input
                      id={`width-${property.id}`}
                      type="number"
                      value={width || ''}
                      onChange={(e) => updatePropertyWidth(property.id, parseInt(e.target.value) || 0)}
                      placeholder="Auto"
                      className="w-16 h-6 text-xs"
                      min="50"
                      max="500"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* View-specific settings */}
      {view.type === 'board' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">Board Settings</h3>
            
            <div className="space-y-2">
              <Label>Group by</Label>
              <select
                value={view.config.groupByProperty || ''}
                onChange={(e) => updateViewConfig({ groupByProperty: e.target.value || undefined })}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">No grouping</option>
                {database.properties
                  .filter(p => p.type === 'select')
                  .map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showEmptyGroups"
                checked={view.config.showEmptyGroups || false}
                onChange={(e) => updateViewConfig({ showEmptyGroups: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showEmptyGroups" className="text-sm">
                Show empty groups
              </Label>
            </div>
          </div>
        </>
      )}

      {view.type === 'calendar' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">Calendar Settings</h3>
            
            <div className="space-y-2">
              <Label>Date property</Label>
              <select
                value={view.config.dateProperty || ''}
                onChange={(e) => updateViewConfig({ dateProperty: e.target.value || undefined })}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">Select date property</option>
                {database.properties
                  .filter(p => p.type === 'date')
                  .map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </>
      )}

      {view.type === 'gallery' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">Gallery Settings</h3>
            
            <div className="space-y-2">
              <Label>Card size</Label>
              <select
                value={view.config.cardSize || 'medium'}
                onChange={(e) => updateViewConfig({ cardSize: e.target.value as 'small' | 'medium' | 'large' })}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Card preview</Label>
              <select
                value={view.config.cardPreview || ''}
                onChange={(e) => updateViewConfig({ cardPreview: e.target.value || undefined })}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">No preview</option>
                {database.properties
                  .filter(p => p.type === 'url' || p.type === 'text')
                  .map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}