'use client'

import React from 'react'

interface DividerBlockProps {
  readOnly?: boolean
}

export default function DividerBlock({ readOnly = false }: DividerBlockProps) {
  return (
    <div className="py-3">
      <hr className="border-gray-300 dark:border-gray-600" />
    </div>
  )
}