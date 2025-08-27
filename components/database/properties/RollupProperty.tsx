"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface RollupPropertyProps {
  property: DatabaseProperty
  value: any
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: any) => void
  className?: string
}

export function RollupProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: RollupPropertyProps) {
  // Rollup properties are read-only computed values
  const displayValue = () => {
    if (value === null || value === undefined) return ""
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className={cn(
      "px-2 py-1 text-sm min-h-[24px] flex items-center",
      "text-gray-600",
      className
    )}>
      <BarChart3 className="h-3 w-3 mr-2 text-gray-400" />
      <span>{displayValue()}</span>
    </div>
  )
}