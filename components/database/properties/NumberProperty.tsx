"use client"

import { useState, useRef, useEffect } from "react"
import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"

interface NumberPropertyProps {
  property: DatabaseProperty
  value: number | null
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: number | null) => void
  className?: string
}

export function NumberProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: NumberPropertyProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value?.toString() || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value?.toString() || "")
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const formatNumber = (num: number | null) => {
    if (num === null) return ""
    
    const format = property.options?.format || 'number'
    const precision = property.options?.precision || 0
    
    switch (format) {
      case 'currency':
        const currency = property.options?.currency || 'USD'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(num)
      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(num / 100)
      default:
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(num)
    }
  }

  const handleClick = () => {
    if (editable) {
      setIsEditing(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleSubmit = () => {
    setIsEditing(false)
    const numValue = localValue.trim() === "" ? null : parseFloat(localValue)
    if (isNaN(numValue!) && localValue.trim() !== "") {
      // Invalid number, reset to original value
      setLocalValue(value?.toString() || "")
      return
    }
    onChange?.(numValue)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalValue(value?.toString() || "")
  }

  const handleBlur = () => {
    handleSubmit()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty, numbers, decimal point, and minus sign
    if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
      setLocalValue(inputValue)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-right",
          className
        )}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-2 py-1 text-sm min-h-[24px] flex items-center justify-end text-right",
        editable && "hover:bg-gray-50 cursor-text rounded",
        value === null && "text-gray-400",
        className
      )}
    >
      {value !== null ? formatNumber(value) : (editable ? "Empty" : "")}
    </div>
  )
}