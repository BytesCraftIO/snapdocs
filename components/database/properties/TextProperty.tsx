"use client"

import { useState, useRef, useEffect } from "react"
import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"

interface TextPropertyProps {
  property: DatabaseProperty
  value: string
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function TextProperty({
  property,
  value = "",
  row,
  editable = false,
  onChange,
  className
}: TextPropertyProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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
    onChange?.(localValue)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalValue(value)
  }

  const handleBlur = () => {
    handleSubmit()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "w-full px-2 py-1 text-sm border-none outline-none bg-transparent",
          className
        )}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-2 py-1 text-sm min-h-[24px] flex items-center",
        editable && "hover:bg-gray-50 cursor-text rounded",
        !value && "text-gray-400",
        className
      )}
    >
      {value || (editable ? "Empty" : "")}
    </div>
  )
}