"use client"

import { useState, useMemo } from "react"
import { Database, DatabaseView, DatabaseRow } from "@/types"
import { PropertyCell } from "./properties"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday, isSameMonth } from "date-fns"

interface CalendarViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

export function CalendarView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const dateProperty = view.config.dateProperty
  const datePropertyObj = database.properties.find(p => p.id === dateProperty)

  // Get calendar days
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group rows by date
  const rowsByDate = useMemo(() => {
    const grouped: { [key: string]: DatabaseRow[] } = {}

    if (!datePropertyObj) return grouped

    rows.forEach(row => {
      const dateValue = row.properties[dateProperty!]
      if (dateValue?.start) {
        try {
          const date = parseISO(dateValue.start)
          const dateKey = format(date, 'yyyy-MM-dd')
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = []
          }
          grouped[dateKey].push(row)
        } catch {
          // Invalid date, ignore
        }
      }
    })

    return grouped
  }, [rows, dateProperty, datePropertyObj])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleAddEvent = (date: Date) => {
    if (!dateProperty) return

    const newRow: Partial<DatabaseRow> = {
      databaseId: database.id,
      properties: {
        [dateProperty]: {
          start: date.toISOString().split('T')[0],
          includeTime: false
        }
      },
      order: rows.length
    }
    onRowCreate?.(newRow)
  }

  const getTitleText = (row: DatabaseRow) => {
    const textProp = database.properties.find(p => p.type === 'text')
    if (textProp) {
      const value = row.properties[textProp.id]
      if (value && typeof value === 'string') {
        return value.trim() || 'Untitled'
      }
    }
    return `Row ${row.id.slice(-4)}`
  }

  if (!datePropertyObj || datePropertyObj.type !== 'date') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="mb-2">Calendar view requires a date property</p>
          <p className="text-sm">Configure a date property to use calendar view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
        >
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayRows = rowsByDate[dayKey] || []
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={dayKey}
              className={cn(
                "border border-gray-200 p-1 min-h-[120px] overflow-y-auto",
                !isCurrentMonth && "bg-gray-50 text-gray-400",
                isToday(day) && "bg-blue-50 border-blue-200"
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isToday(day) && "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                )}>
                  {format(day, 'd')}
                </span>
                
                {editable && isCurrentMonth && (
                  <button
                    onClick={() => handleAddEvent(day)}
                    className="opacity-0 hover:opacity-100 p-0.5 hover:bg-gray-200 rounded"
                    title="Add event"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayRows.map(row => (
                  <div
                    key={row.id}
                    className="p-1 bg-blue-100 text-blue-800 rounded text-xs cursor-pointer hover:bg-blue-200 truncate"
                    title={getTitleText(row)}
                  >
                    {getTitleText(row)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}