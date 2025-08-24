"use client"

import { useState, useRef, useEffect } from "react"
import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Calendar, Clock, X } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"

interface DatePropertyProps {
  property: DatabaseProperty
  value: { start: string; end?: string; includeTime: boolean } | null
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: { start: string; end?: string; includeTime: boolean } | null) => void
  className?: string
}

export function DateProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: DatePropertyProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localStart, setLocalStart] = useState("")
  const [localEnd, setLocalEnd] = useState("")
  const [includeTime, setIncludeTime] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const dateFormat = property.options?.dateFormat || 'MMM DD, YYYY'
  const defaultIncludeTime = property.options?.includeTime || false

  useEffect(() => {
    if (value) {
      setLocalStart(value.start)
      setLocalEnd(value.end || "")
      setIncludeTime(value.includeTime)
    } else {
      setLocalStart("")
      setLocalEnd("")
      setIncludeTime(defaultIncludeTime)
    }
  }, [value, defaultIncludeTime])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const formatDate = (dateString: string, includeTime: boolean) => {
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return dateString

      let formatString = dateFormat
      if (includeTime) {
        formatString += ' h:mm a'
      }

      return format(date, formatString)
    } catch {
      return dateString
    }
  }

  const formatDisplayValue = () => {
    if (!value) return ""

    const startFormatted = formatDate(value.start, value.includeTime)
    
    if (value.end) {
      const endFormatted = formatDate(value.end, value.includeTime)
      return `${startFormatted} → ${endFormatted}`
    }
    
    return startFormatted
  }

  const handleSave = () => {
    if (!localStart.trim()) {
      onChange?.(null)
    } else {
      const newValue = {
        start: localStart,
        end: localEnd || undefined,
        includeTime
      }
      onChange?.(newValue)
    }
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
  }

  if (!editable) {
    return (
      <div className={cn("px-2 py-1 text-sm min-h-[24px] flex items-center", className)}>
        {formatDisplayValue() || ""}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-2 py-1 text-sm min-h-[24px] flex items-center cursor-pointer rounded hover:bg-gray-50",
          "border border-transparent hover:border-gray-200"
        )}
      >
        {value ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              {formatDisplayValue()}
            </span>
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Empty</span>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-64">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                type={includeTime ? "datetime-local" : "date"}
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End date (optional)
              </label>
              <input
                type={includeTime ? "datetime-local" : "date"}
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeTime"
                checked={includeTime}
                onChange={(e) => setIncludeTime(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeTime" className="text-xs text-gray-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Include time
              </label>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-xs rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}