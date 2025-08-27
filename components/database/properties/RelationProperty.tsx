"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Link2 } from "lucide-react"

interface RelationPropertyProps {
  property: DatabaseProperty
  value: string[]
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: string[]) => void
  className?: string
}

export function RelationProperty({
  property,
  value = [],
  row,
  editable = false,
  onChange,
  className
}: RelationPropertyProps) {
  // For now, just display the relation IDs
  // In a full implementation, you'd fetch and display the actual related records
  
  return (
    <div className={cn(
      "px-2 py-1 text-sm min-h-[24px] flex items-center gap-1",
      className
    )}>
      <Link2 className="h-3 w-3 text-gray-400" />
      {value.length > 0 ? (
        <span className="text-blue-600">{value.length} relation{value.length !== 1 ? 's' : ''}</span>
      ) : (
        <span className="text-gray-400">No relations</span>
      )}
    </div>
  )
}