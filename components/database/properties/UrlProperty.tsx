"use client"

import { useState, useRef, useEffect } from "react"
import { DatabaseProperty, DatabaseRow } from "@/types"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

interface UrlPropertyProps {
  property: DatabaseProperty
  value: string | null
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: string | null) => void
  className?: string
}

export function UrlProperty({
  property,
  value,
  row,
  editable = false,
  onChange,
  className
}: UrlPropertyProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleClick = () => {
    if (editable && !value) {
      setIsEditing(true)
    } else if (value && isValidUrl(value)) {
      window.open(value, '_blank')
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
    const trimmed = localValue.trim()
    onChange?.(trimmed || null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalValue(value || "")
  }

  const handleBlur = () => {
    handleSubmit()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="url"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="https://example.com"
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
        editable && "hover:bg-gray-50 rounded",
        value && isValidUrl(value) && "cursor-pointer text-blue-600 hover:text-blue-800",
        editable && !value && "cursor-text",
        !value && "text-gray-400",
        className
      )}
    >
      {value ? (
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{value}</span>
          {isValidUrl(value) && <ExternalLink className="h-3 w-3 flex-shrink-0" />}
        </div>
      ) : (
        editable ? "Empty" : ""
      )}
    </div>
  )
}