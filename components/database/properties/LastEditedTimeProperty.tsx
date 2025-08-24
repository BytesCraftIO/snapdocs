"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface LastEditedTimePropertyProps {
  property: DatabaseProperty
  value: string
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function LastEditedTimeProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: LastEditedTimePropertyProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const dateFormat = property.options?.dateFormat || 'MMM dd, yyyy'
      const includeTime = property.options?.includeTime || false
      
      let formatString = dateFormat
      if (includeTime) {
        formatString += ' h:mm a'
      }
      
      return format(date, formatString)
    } catch {
      return dateString
    }
  }

  return (
    <div className={cn(
      "px-2 py-1 text-sm min-h-[24px] flex items-center",
      "text-gray-500",
      className
    )}>
      {value ? formatDate(value) : ""}
    </div>
  )
}