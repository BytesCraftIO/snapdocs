"use client"

import { useState, useRef, useEffect } from "react"
import { DatabaseProperty, DatabaseRow, SelectOption } from "@/types"
import { cn } from "@/lib/utils"
import { ChevronDown, X } from "lucide-react"

interface SelectPropertyProps {
  property: DatabaseProperty
  value: SelectOption | null
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: SelectOption | null) => void
  className?: string
}

const colors = {
  gray: "bg-gray-100 text-gray-800 border-gray-200",
  brown: "bg-amber-100 text-amber-800 border-amber-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  pink: "bg-pink-100 text-pink-800 border-pink-200",
  red: "bg-red-100 text-red-800 border-red-200",
}

export function SelectProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: SelectPropertyProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const options = property.options?.options || []

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

  const handleSelect = (option: SelectOption | null) => {
    onChange?.(option)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
  }

  if (!editable) {
    if (!value) return <div className={cn("px-2 py-1 text-sm min-h-[24px]", className)} />
    
    const colorClass = colors[value.color as keyof typeof colors] || colors.gray
    
    return (
      <div className={cn("px-2 py-1 flex items-center", className)}>
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
          colorClass
        )}>
          {value.name}
        </span>
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
          <div className="flex items-center w-full">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-1",
              colors[value.color as keyof typeof colors] || colors.gray
            )}>
              {value.name}
            </span>
            <button
              onClick={handleClear}
              className="ml-2 p-0.5 hover:bg-gray-200 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-gray-400">
            <span>Select an option</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div
            onClick={() => handleSelect(null)}
            className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-500"
          >
            No selection
          </div>
          {options.map((option) => {
            const colorClass = colors[option.color as keyof typeof colors] || colors.gray
            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                  colorClass
                )}>
                  {option.name}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}