"use client"

import { useState, useMemo } from "react"
import { Database, DatabaseView, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Clock, Calendar, User, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, parseISO, isValid, compareAsc } from "date-fns"

interface TimelineViewProps {
  database: Database
  view: DatabaseView
  rows: DatabaseRow[]
  onRowUpdate?: (rowId: string, updates: any) => void
  onRowCreate?: (row: Partial<DatabaseRow>) => void
  onRowDelete?: (rowId: string) => void
  editable?: boolean
}

interface TimelineEvent {
  id: string
  title: string
  date: Date
  row: DatabaseRow
  properties: Array<{ name: string; value: any; type: string }>
}

export function TimelineView({
  database,
  view,
  rows,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  editable = true
}: TimelineViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // Get the date property for timeline
  const dateProperty = database.properties.find(
    p => p.id === view.config.dateProperty || p.type === 'date'
  )

  // Transform rows into timeline events
  const timelineEvents = useMemo(() => {
    if (!dateProperty) return []

    const events: TimelineEvent[] = []

    rows.forEach(row => {
      const dateValue = row.properties[dateProperty.id]
      if (!dateValue) return

      let eventDate: Date | null = null

      // Handle different date formats
      if (typeof dateValue === 'string') {
        const parsed = parseISO(dateValue)
        if (isValid(parsed)) {
          eventDate = parsed
        }
      } else if (dateValue && typeof dateValue === 'object' && dateValue.start) {
        const parsed = parseISO(dateValue.start)
        if (isValid(parsed)) {
          eventDate = parsed
        }
      }

      if (!eventDate) return

      // Get title from first text property or row ID
      const titleProperty = database.properties.find(p => p.type === 'text')
      const title = titleProperty 
        ? row.properties[titleProperty.id] || 'Untitled'
        : 'Untitled'

      // Get visible properties for this event
      const visibleProperties = database.properties
        .filter(p => view.properties[p.id]?.visible !== false && p.id !== dateProperty.id)
        .map(property => ({
          name: property.name,
          value: row.properties[property.id],
          type: property.type
        }))
        .filter(prop => prop.value !== undefined && prop.value !== null && prop.value !== '')

      events.push({
        id: row.id,
        title: String(title),
        date: eventDate,
        row,
        properties: visibleProperties
      })
    })

    // Sort events by date
    return events.sort((a, b) => compareAsc(a.date, b.date))
  }, [rows, dateProperty, database.properties, view.properties])

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {}
    
    timelineEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    return groups
  }, [timelineEvents])

  const formatPropertyValue = (value: any, type: string) => {
    if (value === null || value === undefined) return ''
    
    switch (type) {
      case 'date':
        if (typeof value === 'string') {
          const date = parseISO(value)
          return isValid(date) ? format(date, 'MMM dd, yyyy') : value
        }
        if (value.start) {
          const date = parseISO(value.start)
          return isValid(date) ? format(date, 'MMM dd, yyyy') : value.start
        }
        return String(value)
      case 'select':
        return value.name || String(value)
      case 'multiSelect':
        return Array.isArray(value) ? value.map(v => v.name || v).join(', ') : String(value)
      case 'checkbox':
        return value ? '✓' : '✗'
      default:
        return String(value)
    }
  }

  if (!dateProperty) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1">No date property found</p>
          <p className="text-sm">Add a date property to your database to use timeline view</p>
        </div>
      </div>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1">No timeline events</p>
          <p className="text-sm">Add rows with dates to see them in timeline view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {Object.entries(groupedEvents).map(([dateKey, events], groupIndex) => (
            <div key={dateKey} className="relative mb-8">
              {/* Date header */}
              <div className="relative flex items-center mb-4">
                <div className="absolute left-5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="ml-12 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
                  <h3 className="font-medium text-gray-900">
                    {format(parseISO(dateKey), 'EEEE, MMMM dd, yyyy')}
                  </h3>
                </div>
              </div>

              {/* Events for this date */}
              <div className="ml-12 space-y-3">
                {events.map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={cn(
                      "relative bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                      selectedEvent === event.id && "ring-2 ring-blue-500 border-blue-200"
                    )}
                    onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  >
                    {/* Event header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{format(event.date, 'h:mm a')}</span>
                        </div>
                      </div>
                      
                      {editable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-gray-400 hover:text-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                // Handle edit
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRowDelete?.(event.id)
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Event properties */}
                    {event.properties.length > 0 && (
                      <div className="space-y-1">
                        {event.properties.slice(0, selectedEvent === event.id ? undefined : 2).map((prop, propIndex) => (
                          <div key={propIndex} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 min-w-0 w-20 truncate">{prop.name}:</span>
                            <span className="text-gray-900 flex-1 truncate">
                              {formatPropertyValue(prop.value, prop.type)}
                            </span>
                          </div>
                        ))}
                        
                        {!selectedEvent && event.properties.length > 2 && (
                          <div className="text-xs text-gray-400 mt-1">
                            +{event.properties.length - 2} more properties
                          </div>
                        )}
                      </div>
                    )}

                    {/* Connector line to timeline */}
                    <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-gray-200 -translate-y-1/2 -translate-x-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}