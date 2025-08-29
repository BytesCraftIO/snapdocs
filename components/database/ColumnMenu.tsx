"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { DatabaseProperty } from "@/types"
import { cn } from "@/lib/utils"
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  EyeOff, 
  Copy, 
  Trash2
} from "lucide-react"

interface ColumnMenuProps {
  property: DatabaseProperty
  anchorEl: HTMLElement | null
  onClose: () => void
  onSort?: (direction: 'asc' | 'desc' | null) => void
  onHide?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  currentSort?: 'asc' | 'desc' | null
}


export function ColumnMenu({
  property,
  anchorEl,
  onClose,
  onSort,
  onHide,
  onDuplicate,
  onDelete,
  currentSort
}: ColumnMenuProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      const menuWidth = 200
      const menuHeight = 300 // Approximate height
      
      let left = rect.left
      let top = rect.bottom + 4
      
      // Adjust if menu would go off screen
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10
      }
      
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4
      }
      
      setPosition({ top, left })
    }
  }, [anchorEl])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [anchorEl, onClose])

  const handleSort = (direction: 'asc' | 'desc' | null) => {
    onSort?.(direction)
    onClose()
  }

  if (!anchorEl) return null

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Sort options - only for text properties */}
      {(property.type === 'text' || property.type === 'email' || property.type === 'url' || property.type === 'phone') && (
        <div className="px-1 py-1 border-b border-gray-100">
          <button
            onClick={() => handleSort('asc')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100",
              currentSort === 'asc' && "bg-blue-50 text-blue-700"
            )}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Sort ascending
          </button>
          <button
            onClick={() => handleSort('desc')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100",
              currentSort === 'desc' && "bg-blue-50 text-blue-700"
            )}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Sort descending
          </button>
          {currentSort && (
            <button
              onClick={() => handleSort(null)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 text-gray-500"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Clear sort
            </button>
          )}
        </div>
      )}


      {/* Column actions */}
      <div className="px-1 py-1">
        <button
          onClick={() => { onHide?.(); onClose() }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100"
        >
          <EyeOff className="w-3.5 h-3.5" />
          Hide column
        </button>
        <button
          onClick={() => { onDuplicate?.(); onClose() }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate column
        </button>
        <button
          onClick={() => { onDelete?.(); onClose() }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 rounded hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete column
        </button>
      </div>
    </div>,
    document.body
  )
}