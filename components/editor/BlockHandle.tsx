'use client'

import React from 'react'
import { Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlockHandleProps {
  isVisible: boolean
  onAddBlock: () => void
  dragProps?: {
    attributes: any
    listeners: any
  }
  className?: string
}

export default function BlockHandle({
  isVisible,
  onAddBlock,
  dragProps,
  className
}: BlockHandleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 opacity-0 transition-opacity duration-150",
        isVisible && "opacity-100",
        className
      )}
    >
      {/* Add block button */}
      <button
        type="button"
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={onAddBlock}
        title="Click to add block"
      >
        <Plus className="w-4 h-4 text-gray-400" />
      </button>
      
      {/* Drag handle */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-grab active:cursor-grabbing"
        title="Drag to move"
        {...dragProps?.attributes}
        {...dragProps?.listeners}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}