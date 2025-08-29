"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { DatabaseProperty, DatabaseRow, SelectOption } from "@/types"
import { cn } from "@/lib/utils"
import { ChevronDown, X } from "lucide-react"

interface MultiSelectPropertyProps {
  property: DatabaseProperty
  value: SelectOption[]
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: SelectOption[]) => void
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

export function MultiSelectProperty({
  property,
  value = [],
  row,
  editable = false,
  onChange,
  className
}: MultiSelectPropertyProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = property.options?.options || []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function updateDropdownPosition() {
      if (containerRef.current && isOpen) {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownHeight = 250 // Approximate max height
        
        // Determine if dropdown should appear above or below
        const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
        
        setDropdownPosition({
          top: shouldShowAbove ? rect.top - dropdownHeight : rect.bottom,
          left: rect.left,
          width: rect.width
        })
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("scroll", updateDropdownPosition, true)
      window.addEventListener("resize", updateDropdownPosition)
      updateDropdownPosition()
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        window.removeEventListener("scroll", updateDropdownPosition, true)
        window.removeEventListener("resize", updateDropdownPosition)
      }
    }
  }, [isOpen])

  const handleToggleOption = (option: SelectOption) => {
    const currentIds = value.map(v => v.id)
    
    if (currentIds.includes(option.id)) {
      onChange?.(value.filter(v => v.id !== option.id))
    } else {
      onChange?.([...value, option])
    }
  }

  const handleRemoveOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(value.filter(v => v.id !== optionId))
  }

  if (!editable) {
    if (!value || value.length === 0) {
      return <div className={cn("px-2 py-1 text-sm min-h-[24px]", className)} />
    }
    
    return (
      <div className={cn("px-2 py-1 flex items-center flex-wrap gap-1", className)}>
        {value.map((option) => {
          const colorClass = colors[option.color as keyof typeof colors] || colors.gray
          return (
            <span
              key={option.id}
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                colorClass
              )}
            >
              {option.name}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className={cn("relative", className)}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-2 py-1 text-sm min-h-[24px] cursor-pointer rounded hover:bg-gray-50",
            "border border-transparent hover:border-gray-200"
          )}
        >
          {value && value.length > 0 ? (
            <div className="flex items-center flex-wrap gap-1">
              {value.map((option) => {
                const colorClass = colors[option.color as keyof typeof colors] || colors.gray
                return (
                  <span
                    key={option.id}
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                      colorClass
                    )}
                  >
                    {option.name}
                    <button
                      onClick={(e) => handleRemoveOption(option.id, e)}
                      className="ml-1 hover:bg-black/10 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between text-gray-400">
              <span>Select options</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {options.map((option) => {
            const isSelected = value.some(v => v.id === option.id)
            const colorClass = colors[option.color as keyof typeof colors] || colors.gray
            
            return (
              <div
                key={option.id}
                onClick={() => handleToggleOption(option)}
                className={cn(
                  "px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between",
                  isSelected && "bg-blue-50"
                )}
              >
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                  colorClass
                )}>
                  {option.name}
                </span>
                {isSelected && (
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}