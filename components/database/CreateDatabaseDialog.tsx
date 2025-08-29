"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatabaseViewType, DatabaseProperty } from '@/types'
import { Table, LayoutGrid, List, Calendar, Image, Clock } from 'lucide-react'
import { generateId } from '@/lib/utils/id'

interface CreateDatabaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  pageId?: string
  onCreateDatabase?: (database: any) => void
}

const viewTypes = [
  { value: 'TABLE', label: 'Table', icon: Table, description: 'Traditional spreadsheet view' },
  { value: 'BOARD', label: 'Board', icon: LayoutGrid, description: 'Kanban-style board view' },
  { value: 'LIST', label: 'List', icon: List, description: 'Simple list view' },
  { value: 'CALENDAR', label: 'Calendar', icon: Calendar, description: 'Calendar view for dates' },
  { value: 'GALLERY', label: 'Gallery', icon: Image, description: 'Card-based gallery view' }
]

export function CreateDatabaseDialog({
  open,
  onOpenChange,
  workspaceId,
  pageId,
  onCreateDatabase
}: CreateDatabaseDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [viewType, setViewType] = useState<DatabaseViewType>('TABLE' as DatabaseViewType)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      // Default properties for new database
      const defaultProperties: DatabaseProperty[] = [
        {
          id: generateId(),
          name: 'Name',
          type: 'text',
          options: {}
        },
        {
          id: generateId(),
          name: 'Status',
          type: 'select',
          options: {
            options: [
              { id: generateId(), name: 'Not Started', color: 'gray' },
              { id: generateId(), name: 'In Progress', color: 'blue' },
              { id: generateId(), name: 'Done', color: 'green' }
            ]
          }
        },
        {
          id: generateId(),
          name: 'Priority',
          type: 'select',
          options: {
            options: [
              { id: generateId(), name: 'Low', color: 'green' },
              { id: generateId(), name: 'Medium', color: 'yellow' },
              { id: generateId(), name: 'High', color: 'red' }
            ]
          }
        },
        {
          id: generateId(),
          name: 'Due Date',
          type: 'date',
          options: {
            dateFormat: 'MMM DD, YYYY',
            includeTime: false
          }
        },
        {
          id: generateId(),
          name: 'Tags',
          type: 'multiSelect',
          options: {
            options: []
          }
        }
      ]

      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          workspaceId,
          pageId,
          viewType,
          properties: defaultProperties
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create database')
      }

      const database = await response.json()
      
      // Call the callback if provided
      onCreateDatabase?.(database)
      
      // Reset form
      setName('')
      setDescription('')
      setViewType('TABLE')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating database:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Database</DialogTitle>
          <DialogDescription>
            Create a structured database to organize your information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Database Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Project Tracker, Task List..."
              autoFocus
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this database is for..."
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="view">Default View</Label>
            <Select value={viewType} onValueChange={(value) => setViewType(value as DatabaseViewType)}>
              <SelectTrigger id="view">
                <SelectValue placeholder="Select a view type" />
              </SelectTrigger>
              <SelectContent>
                {viewTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Database'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}