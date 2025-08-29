"use client"

import { useState, useRef, useEffect } from "react"
import { Database, DatabaseView, DatabaseRow, DatabaseProperty } from "@/types"
import { PropertyCell } from "./properties"
import { ColumnMenu } from "./ColumnMenu"
import { cn } from "@/lib/utils"
import { Plus, MoreHorizontal, ChevronDown, ChevronUp, Trash2 } from "lucide-react"

interface TableViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  onSortChange?: (sorts: Array<{ property: string; direction: 'asc' | 'desc' }>) => void
  editable?: boolean
}

export function TableView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  onSortChange,
  editable = true
}: TableViewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{rowId: string, propertyId: string} | null>(null)
  const [sortConfig, setSortConfig] = useState<Record<string, 'asc' | 'desc' | null>>({})
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null)
  const columnRefs = useRef<Record<string, HTMLElement>>({})
  const tableRef = useRef<HTMLDivElement>(null)
  
  // Initialize sort config from view
  useEffect(() => {
    if (view.sorts && view.sorts.length > 0) {
      const config: Record<string, 'asc' | 'desc' | null> = {}
      view.sorts.forEach(sort => {
        config[sort.property] = sort.direction
      })
      setSortConfig(config)
    }
  }, [view.sorts])
  
  // Get visible properties based on view configuration
  const visibleProperties = database.properties.filter(prop => {
    if (!view.properties) return true // Show all properties if view.properties is undefined
    const viewProp = view.properties[prop.id]
    return viewProp?.visible !== false
  }).sort((a, b) => {
    if (!view.properties) return 0 // No sorting if view.properties is undefined
    const aOrder = view.properties[a.id]?.order ?? 0
    const bOrder = view.properties[b.id]?.order ?? 0
    return aOrder - bOrder
  })

  // Sort rows locally - only for text properties
  const sortedRows = [...rows].sort((a, b) => {
    for (const propertyId of Object.keys(sortConfig)) {
      const direction = sortConfig[propertyId]
      if (!direction) continue
      
      // Find the property and check if it's a text-based property
      const property = database.properties.find(p => p.id === propertyId)
      if (!property || !['text', 'email', 'url', 'phone'].includes(property.type)) {
        continue
      }
      
      const aValue = a.properties[propertyId]
      const bValue = b.properties[propertyId]
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) continue
      if (aValue == null) return direction === 'asc' ? 1 : -1
      if (bValue == null) return direction === 'asc' ? -1 : 1
      
      // For text properties, always use string comparison
      const comparison = String(aValue).localeCompare(String(bValue))
      
      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })

  const handleSort = (propertyId: string, direction: 'asc' | 'desc' | null) => {
    // Find the property to check its type
    const property = database.properties.find(p => p.id === propertyId)
    
    // Only allow sorting for text-based properties
    if (!property || !['text', 'email', 'url', 'phone'].includes(property.type)) {
      return
    }
    
    const newConfig = { ...sortConfig }
    
    // Clear other sorts (single column sort for now)
    Object.keys(newConfig).forEach(key => {
      if (key !== propertyId) {
        newConfig[key] = null
      }
    })
    
    newConfig[propertyId] = direction
    setSortConfig(newConfig)
    
    // Build sorts array for the view
    const sorts = []
    if (direction) {
      sorts.push({ property: propertyId, direction })
    }
    
    // Notify parent if handler exists
    if (onSortChange) {
      onSortChange(sorts)
    }
  }


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

  const handleDeleteRow = (rowId: string) => {
    onRowDelete?.(rowId)
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(rowId)
      return newSet
    })
  }

  const getColumnWidth = (property: DatabaseProperty) => {
    const viewConfig = view.properties?.[property.id]
    if (viewConfig?.width) {
      return viewConfig.width
    }
    
    // Default widths based on property type
    switch (property.type) {
      case 'checkbox':
        return 50
      case 'number':
        return 100
      case 'date':
        return 120
      case 'select':
        return 120
      case 'multiSelect':
        return 150
      default:
        return 180
    }
  }

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  const selectAllRows = () => {
    if (selectedRows.size === sortedRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(sortedRows.map(r => r.id)))
    }
  }


  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '44px' }} />
            {visibleProperties.map(prop => (
              <col key={prop.id} style={{ width: `${getColumnWidth(prop)}px` }} />
            ))}
            {editable && <col style={{ width: '44px' }} />}
          </colgroup>
          
          <thead>
            <tr className="border-b border-gray-200">
              {/* Checkbox column header */}
              <th className="h-7 px-1.5 bg-gray-50/50">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className={cn(
                      "w-3 h-3 rounded border-gray-300",
                      "focus:ring-0 focus:ring-offset-0",
                      selectedRows.size > 0 ? "bg-blue-600 border-blue-600" : ""
                    )}
                    checked={selectedRows.size === sortedRows.length && sortedRows.length > 0}
                    onChange={selectAllRows}
                  />
                </div>
              </th>
              
              {/* Property headers with sort */}
              {visibleProperties.map(property => {
                const currentSort = sortConfig[property.id]
                const isTextProperty = ['text', 'email', 'url', 'phone'].includes(property.type)
                
                return (
                  <th
                    key={property.id}
                    ref={el => { if (el) columnRefs.current[property.id] = el }}
                    className="h-7 px-1.5 text-left font-normal text-xs text-gray-600 bg-gray-50/50 group/header"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        className={cn(
                          "flex items-center gap-1 px-1 py-0.5 rounded transition-colors flex-1 text-left",
                          isTextProperty && "hover:bg-gray-100",
                          currentSort && isTextProperty && "bg-blue-50/50"
                        )}
                        onClick={() => setActiveColumnMenu(property.id)}
                      >
                        <span className={cn(
                          "truncate select-none",
                          currentSort && isTextProperty && "text-blue-700 font-medium"
                        )}>
                          {property.name}
                        </span>
                        <span className="flex items-center gap-0.5">
                          {currentSort && isTextProperty && (
                            currentSort === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-600" />
                              : <ChevronDown className="w-3 h-3 text-blue-600" />
                          )}
                        </span>
                      </button>
                      <button 
                        onClick={() => setActiveColumnMenu(property.id)}
                        className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-all"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Column Menu */}
                    {activeColumnMenu === property.id && (
                      <ColumnMenu
                        property={property}
                        anchorEl={columnRefs.current[property.id]}
                        onClose={() => setActiveColumnMenu(null)}
                        onSort={(direction) => handleSort(property.id, direction)}
                        currentSort={currentSort}
                      />
                    )}
                  </th>
                )
              })}
              
              {/* Add property header */}
              {editable && (
                <th className="h-7 px-1.5 bg-gray-50/50">
                  <button className="w-full h-full flex items-center justify-center hover:bg-gray-100 rounded transition-colors">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {sortedRows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "group/row border-b border-gray-100",
                  hoveredRowId === row.id && "bg-gray-50/50",
                  selectedRows.has(row.id) && "bg-blue-50/50"
                )}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {/* Checkbox/row number cell */}
                <td className="h-7 px-1.5">
                  <div className="flex items-center justify-center h-full">
                    {hoveredRowId === row.id || selectedRows.has(row.id) ? (
                      <input
                        type="checkbox"
                        className="w-3 h-3 rounded border-gray-300 focus:ring-0 focus:ring-offset-0"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 select-none">{index + 1}</span>
                    )}
                  </div>
                </td>
                
                {/* Property cells */}
                {visibleProperties.map(property => (
                  <td
                    key={property.id}
                    className="h-7 px-1.5 py-0"
                    onClick={() => setEditingCell({ rowId: row.id, propertyId: property.id })}
                  >
                    <div className="h-full flex items-center">
                      <PropertyCell
                        property={property}
                        value={row.properties[property.id]}
                        row={row}
                        editable={editable}
                        onChange={(value) => handleCellChange(row.id, property.id, value)}
                        isEditing={editingCell?.rowId === row.id && editingCell?.propertyId === property.id}
                        onStopEditing={() => setEditingCell(null)}
                      />
                    </div>
                  </td>
                ))}
                
                {/* Row actions */}
                {editable && (
                  <td className="h-7 px-1.5">
                    <div className="flex items-center justify-center h-full opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            
            {/* Add new row */}
            {editable && (
              <tr className="group/newrow">
                <td className="h-7 px-1.5">
                  <div className="flex items-center justify-center">
                    <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover/newrow:opacity-100" />
                  </div>
                </td>
                <td colSpan={visibleProperties.length + (editable ? 1 : 0)}>
                  <button
                    onClick={handleAddRow}
                    className="w-full h-7 px-1.5 text-left text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    New
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-gray-600">{selectedRows.size} selected</span>
          <button
            onClick={() => {
              selectedRows.forEach(rowId => handleDeleteRow(rowId))
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}