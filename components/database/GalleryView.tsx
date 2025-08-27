"use client"

import { useState } from "react"
import { Database, DatabaseView, DatabaseRow } from "@/types"
import { PropertyCell } from "./properties"
import { cn } from "@/lib/utils"
import { Plus, MoreHorizontal, Image } from "lucide-react"

interface GalleryViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

export function GalleryView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: GalleryViewProps) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const cardSize = view.config.cardSize || 'medium'
  const cardPreview = view.config.cardPreview
  const showProperties = view.config.showProperties || []

  // Get the primary property (first text property)
  const primaryProperty = database.properties.find(p => p.type === 'text') || database.properties[0]

  // Get preview property (could be image/file property)
  const previewProperty = cardPreview 
    ? database.properties.find(p => p.id === cardPreview)
    : database.properties.find(p => p.type === 'url' || p.type === 'text')

  // Get properties to show on cards
  const cardProperties = showProperties.length > 0
    ? database.properties.filter(p => showProperties.includes(p.id))
    : database.properties.filter(p => p.id !== primaryProperty?.id).slice(0, 3)

  const handleCellChange = (rowId: string, propertyId: string, value: any) => {
    onRowUpdate?.(rowId, { [propertyId]: value })
  }

  const handleAddRow = () => {
    const newRow: Partial<DatabaseRow> = {
      databaseId: database.id,
      properties: {},
      order: rows.length
    }
    onRowCreate?.(newRow)
  }

  const getTitleText = (row: DatabaseRow) => {
    if (primaryProperty) {
      const value = row.properties[primaryProperty.id]
      if (value && typeof value === 'string') {
        return value.trim() || 'Untitled'
      }
    }
    return `Row ${row.id.slice(-4)}`
  }

  const getPreviewUrl = (row: DatabaseRow) => {
    if (!previewProperty) return null
    
    const value = row.properties[previewProperty.id]
    if (typeof value === 'string' && value.trim()) {
      // Check if it looks like an image URL
      if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i) || value.includes('unsplash.com') || value.includes('images.')) {
        return value
      }
    }
    return null
  }

  const getCardSizeClass = () => {
    switch (cardSize) {
      case 'small':
        return 'w-48'
      case 'large':
        return 'w-80'
      default:
        return 'w-64'
    }
  }

  const getImageHeight = () => {
    switch (cardSize) {
      case 'small':
        return 'h-32'
      case 'large':
        return 'h-48'
      default:
        return 'h-40'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4" style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize === 'small' ? '12rem' : cardSize === 'large' ? '20rem' : '16rem'}, 1fr))`
        }}>
          {rows.map((row) => {
            const previewUrl = getPreviewUrl(row)
            
            return (
              <div
                key={row.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow",
                  getCardSizeClass(),
                  selectedRowId === row.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedRowId(row.id)}
              >
                {/* Preview image */}
                <div className={cn(
                  "bg-gray-100 flex items-center justify-center relative",
                  getImageHeight()
                )}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={getTitleText(row)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling!.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "flex items-center justify-center text-gray-400",
                    previewUrl && "hidden"
                  )}>
                    <Image className="w-8 h-8" />
                  </div>
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded">
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Card content */}
                <div className="p-3">
                  {/* Title */}
                  <div className="mb-2">
                    {primaryProperty ? (
                      <PropertyCell
                        property={primaryProperty}
                        value={row.properties[primaryProperty.id]}
                        row={row}
                        editable={editable}
                        onChange={(value) => handleCellChange(row.id, primaryProperty.id, value)}
                        className="font-medium text-base p-0 hover:bg-gray-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                      />
                    ) : (
                      <div className="font-medium text-base text-gray-900">
                        {getTitleText(row)}
                      </div>
                    )}
                  </div>

                  {/* Properties */}
                  <div className="space-y-2">
                    {cardProperties.map((property) => {
                      const value = row.properties[property.id]
                      if (!value) return null

                      return (
                        <div key={property.id} className="text-sm">
                          <div className="text-gray-500 text-xs font-medium mb-1">
                            {property.name}
                          </div>
                          <PropertyCell
                            property={property}
                            value={value}
                            row={row}
                            editable={editable}
                            onChange={(value) => handleCellChange(row.id, property.id, value)}
                            className="p-0"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add card button */}
          {editable && (
            <div className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer",
              getCardSizeClass(),
              "h-64" // Fixed height for add button
            )}
            onClick={handleAddRow}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-500 font-medium">New</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}