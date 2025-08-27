"use client"

import { useState, useRef, useEffect } from "react"
import { Database, DatabaseView, DatabaseRow, DatabaseProperty } from "@/types"
import { PropertyCell } from "./properties"
import { cn } from "@/lib/utils"
import { Plus, GripVertical } from "lucide-react"

interface TableViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

export function TableView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: TableViewProps) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  
  // Get visible properties based on view configuration
  const visibleProperties = database.properties.filter(prop => {
    const viewProp = view.properties[prop.id]
    return viewProp?.visible !== false
  }).sort((a, b) => {
    const aOrder = view.properties[a.id]?.order ?? 0
    const bOrder = view.properties[b.id]?.order ?? 0
    return aOrder - bOrder
  })

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

  const getColumnWidth = (property: DatabaseProperty) => {
    const viewConfig = view.properties[property.id]
    if (viewConfig?.width) {
      return `${viewConfig.width}px`
    }
    
    // Default widths based on property type
    switch (property.type) {
      case 'checkbox':
        return '50px'
      case 'number':
        return '120px'
      case 'date':
        return '140px'
      case 'select':
        return '140px'
      case 'multiSelect':
        return '160px'
      default:
        return '200px'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div 
        ref={tableRef}
        className="flex-1 overflow-auto border border-gray-200 rounded-lg"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
          <div className="flex min-w-fit">
            {/* Row number column */}
            <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            
            {/* Property columns */}
            {visibleProperties.map((property) => (
              <div
                key={property.id}
                className="border-r border-gray-200 px-3 py-3 bg-gray-50 font-medium text-sm text-gray-700 flex items-center"
                style={{ width: getColumnWidth(property), minWidth: getColumnWidth(property) }}
              >
                <span className="truncate">{property.name}</span>
              </div>
            ))}
            
            {/* Add property button */}
            {editable && (
              <div className="w-12 px-2 py-3 flex items-center justify-center">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                "flex min-w-fit hover:bg-gray-50",
                selectedRowId === row.id && "bg-blue-50"
              )}
              onClick={() => setSelectedRowId(row.id)}
            >
              {/* Row number */}
              <div className="w-12 px-2 py-1 border-r border-gray-200 flex items-center justify-center text-xs text-gray-400">
                {index + 1}
              </div>
              
              {/* Property cells */}
              {visibleProperties.map((property) => (
                <div
                  key={property.id}
                  className="border-r border-gray-200"
                  style={{ width: getColumnWidth(property), minWidth: getColumnWidth(property) }}
                >
                  <PropertyCell
                    property={property}
                    value={row.properties[property.id]}
                    row={row}
                    editable={editable}
                    onChange={(value) => handleCellChange(row.id, property.id, value)}
                  />
                </div>
              ))}
              
              {/* Empty cell for add property column */}
              {editable && (
                <div className="w-12" />
              )}
            </div>
          ))}
          
          {/* Add row button */}
          {editable && (
            <div className="flex min-w-fit">
              <div className="w-12 px-2 py-3 border-r border-gray-200" />
              <button
                onClick={handleAddRow}
                className="flex-1 px-3 py-3 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}