"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"

interface CreatedByPropertyProps {
  property: DatabaseProperty
  value: string
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function CreatedByProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: CreatedByPropertyProps) {
  // In a real implementation, you'd fetch user details by ID
  // For now, just display the user ID
  
  return (
    <div className={cn(
      "px-2 py-1 text-sm min-h-[24px] flex items-center gap-2",
      "text-gray-500",
      className
    )}>
      <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0" />
      <span className="truncate">{value || "Unknown"}</span>
    </div>
  )
}