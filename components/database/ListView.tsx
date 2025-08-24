"use client"

import { useState } from "react"
import { Database, DatabaseView, DatabaseRow } from "@/types"
import { PropertyCell } from "./properties"
import { cn } from "@/lib/utils"
import { Plus, MoreHorizontal } from "lucide-react"

interface ListViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

export function ListView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: ListViewProps) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Get the primary property (first text property)
  const primaryProperty = database.properties.find(p => p.type === 'text') || database.properties[0]

  // Get visible properties (excluding primary)
  const visibleProperties = database.properties
    .filter(prop => {
      const viewProp = view.properties[prop.id]
      return viewProp?.visible !== false && prop.id !== primaryProperty?.id
    })
    .slice(0, 3) // Show max 3 additional properties in list view

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow",
                selectedRowId === row.id && "ring-2 ring-blue-500"
              )}
              onClick={() => setSelectedRowId(row.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="mb-2">
                    {primaryProperty ? (
                      <PropertyCell
                        property={primaryProperty}
                        value={row.properties[primaryProperty.id]}
                        row={row}
                        editable={editable}
                        onChange={(value) => handleCellChange(row.id, primaryProperty.id, value)}
                        className="text-base font-medium p-0 hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
                      />
                    ) : (
                      <div className="text-base font-medium text-gray-900">
                        {getTitleText(row)}
                      </div>
                    )}
                  </div>

                  {/* Properties */}
                  {visibleProperties.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {visibleProperties.map((property) => {
                        const value = row.properties[property.id]
                        if (!value) return null

                        return (
                          <div key={property.id} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 min-w-0 font-medium">
                              {property.name}:
                            </span>
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
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add row button */}
          {editable && (
            <button
              onClick={handleAddRow}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New
            </button>
          )}
        </div>
      </div>
    </div>
  )
}