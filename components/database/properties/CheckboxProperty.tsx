"use client"

import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxPropertyProps {
  property: DatabaseProperty
  value: boolean
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: boolean) => void
  className?: string
}

export function CheckboxProperty({
  property,
  value = false,
  row,
  editable = false,
  onChange,
  className
}: CheckboxPropertyProps) {
  const handleClick = () => {
    if (editable) {
      onChange?.(!value)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-2 py-1 flex items-center justify-center",
        editable && "cursor-pointer hover:bg-gray-50 rounded",
        className
      )}
    >
      <div
        className={cn(
          "w-4 h-4 border-2 rounded flex items-center justify-center",
          value
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-gray-300 bg-white"
        )}
      >
        {value && <Check className="w-3 h-3" />}
      </div>
    </div>
  )
}