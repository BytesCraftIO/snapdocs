"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Calculator } from "lucide-react"

interface FormulaPropertyProps {
  property: DatabaseProperty
  value: any
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: any) => void
  className?: string
}

export function FormulaProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: FormulaPropertyProps) {
  // Formula properties are read-only
  const displayValue = () => {
    if (value === null || value === undefined) return ""
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className={cn(
      "px-2 py-1 text-sm min-h-[24px] flex items-center",
      "text-gray-600 italic",
      className
    )}>
      <Calculator className="h-3 w-3 mr-2 text-gray-400" />
      <span>{displayValue()}</span>
    </div>
  )
}