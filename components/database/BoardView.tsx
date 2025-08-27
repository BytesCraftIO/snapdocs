"use client"

import { useState, useMemo } from "react"
import { Database, DatabaseView, DatabaseRow, SelectOption } from "@/types"
import { PropertyCell } from "./properties"
import { cn } from "@/lib/utils"
import { Plus, MoreHorizontal } from "lucide-react"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BoardViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

interface BoardColumn {
  id: string
  title: string
  color?: string
  rows: DatabaseRow[]
}

interface SortableCardProps {
  row: DatabaseRow
  database: Database
  groupByProperty?: string
  editable: boolean
}

function SortableCard({ row, database, groupByProperty, editable }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-3 rounded-lg border border-gray-200 shadow-sm",
        editable && "cursor-move hover:shadow-md transition-shadow",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Title - use first text property or fallback */}
      <div className="font-medium text-sm mb-2">
        {Object.entries(row.properties).find(([_, value]) => 
          typeof value === 'string' && value.trim()
        )?.[1] || `Row ${row.id.slice(-4)}`}
      </div>

      {/* Show other properties */}
      <div className="space-y-1">
        {database.properties
          .filter(prop => prop.id !== groupByProperty && prop.type !== 'text')
          .slice(0, 3) // Show max 3 additional properties
          .map(property => {
            const value = row.properties[property.id]
            if (!value) return null

            return (
              <div key={property.id} className="text-xs">
                <span className="text-gray-500">{property.name}:</span>{' '}
                <PropertyCell
                  property={property}
                  value={value}
                  row={row}
                  editable={false}
                  className="inline"
                />
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export function BoardView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupByProperty = view.config.groupByProperty
  const groupProperty = database.properties.find(p => p.id === groupByProperty)

  // Group rows into columns
  const columns = useMemo(() => {
    if (!groupProperty || groupProperty.type !== 'select') {
      // No grouping or invalid group property - show all rows in one column
      return [{
        id: 'all',
        title: 'All Items',
        rows: rows
      }]
    }

    const options = groupProperty.options?.options || []
    const columns: BoardColumn[] = []

    // Create column for each select option
    options.forEach(option => {
      columns.push({
        id: option.id,
        title: option.name,
        color: option.color,
        rows: rows.filter(row => {
          const value = row.properties[groupByProperty!]
          return value?.id === option.id
        })
      })
    })

    // Add column for items without a value
    const uncategorized = rows.filter(row => {
      const value = row.properties[groupByProperty!]
      return !value || !options.some(opt => opt.id === value.id)
    })

    if (uncategorized.length > 0 || view.config.showEmptyGroups) {
      columns.push({
        id: 'uncategorized',
        title: 'No Status',
        rows: uncategorized
      })
    }

    return columns
  }, [rows, groupProperty, groupByProperty, view.config.showEmptyGroups])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over different columns
    const { active, over } = event
    
    if (!over || !groupByProperty) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which columns the cards belong to
    const activeColumn = columns.find(col => 
      col.rows.some(row => row.id === activeId)
    )
    const overColumn = columns.find(col => col.id === overId) || 
                      columns.find(col => col.rows.some(row => row.id === overId))

    if (!activeColumn || !overColumn || activeColumn === overColumn) {
      return
    }

    // Move card between columns
    const activeRow = activeColumn.rows.find(row => row.id === activeId)
    if (activeRow) {
      // Find the option for the target column
      if (overColumn.id === 'uncategorized') {
        onRowUpdate?.(activeId, { [groupByProperty]: null })
      } else {
        const option = groupProperty?.options?.options?.find(opt => opt.id === overColumn.id)
        if (option) {
          onRowUpdate?.(activeId, { [groupByProperty]: option })
        }
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event

    if (!over || !groupByProperty) return

    const activeId = active.id as string
    const overId = over.id as string

    // If dropped on a column header, move to that column
    const targetColumn = columns.find(col => col.id === overId)
    if (targetColumn) {
      const activeRow = rows.find(row => row.id === activeId)
      if (activeRow) {
        if (targetColumn.id === 'uncategorized') {
          onRowUpdate?.(activeId, { [groupByProperty]: null })
        } else {
          const option = groupProperty?.options?.options?.find(opt => opt.id === targetColumn.id)
          if (option) {
            onRowUpdate?.(activeId, { [groupByProperty]: option })
          }
        }
      }
    }
  }

  const handleAddCard = (columnId: string) => {
    if (!groupByProperty) return

    const newRow: Partial<DatabaseRow> = {
      databaseId: database.id,
      properties: {},
      order: rows.length
    }

    // Set the group property value
    if (columnId !== 'uncategorized') {
      const option = groupProperty?.options?.options?.find(opt => opt.id === columnId)
      if (option) {
        newRow.properties = { [groupByProperty]: option }
      }
    }

    onRowCreate?.(newRow)
  }

  const allRowIds = rows.map(row => row.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full overflow-x-auto p-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            id={column.id}
            className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {column.color && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                )}
                <h3 className="font-medium text-sm text-gray-700">{column.title}</h3>
                <span className="text-xs text-gray-500">({column.rows.length})</span>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Cards */}
            <SortableContext items={column.rows.map(row => row.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-3">
                {column.rows.map((row) => (
                  <SortableCard
                    key={row.id}
                    row={row}
                    database={database}
                    groupByProperty={groupByProperty}
                    editable={editable}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Add card button */}
            {editable && (
              <button
                onClick={() => handleAddCard(column.id)}
                className="w-full p-2 text-left text-gray-500 hover:text-gray-700 hover:bg-white rounded border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add a card
              </button>
            )}
          </div>
        ))}
      </div>
    </DndContext>
  )
}