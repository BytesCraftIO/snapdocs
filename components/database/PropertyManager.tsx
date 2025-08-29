"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatabaseProperty, DatabasePropertyType, SelectOption } from '@/types'
import { generateId } from '@/lib/utils/id'
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: DatabaseProperty[]
  onSaveProperties: (properties: DatabaseProperty[]) => void
}

const propertyTypes: { value: DatabasePropertyType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiSelect', label: 'Multi-select' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'createdTime', label: 'Created time' },
  { value: 'createdBy', label: 'Created by' },
  { value: 'lastEditedTime', label: 'Last edited time' },
  { value: 'lastEditedBy', label: 'Last edited by' }
]

const colors = [
  { name: 'gray', hex: '#6B7280' },
  { name: 'red', hex: '#EF4444' },
  { name: 'orange', hex: '#F97316' },
  { name: 'yellow', hex: '#EAB308' },
  { name: 'green', hex: '#10B981' },
  { name: 'blue', hex: '#3B82F6' },
  { name: 'purple', hex: '#8B5CF6' },
  { name: 'pink', hex: '#EC4899' }
]

export function PropertyManager({
  open,
  onOpenChange,
  properties,
  onSaveProperties
}: PropertyManagerProps) {
  const [localProperties, setLocalProperties] = useState<DatabaseProperty[]>(properties || [])
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)

  // Update local properties when props change
  useEffect(() => {
    setLocalProperties(properties || [])
  }, [properties])

  const handleAddProperty = () => {
    const newProperty: DatabaseProperty = {
      id: generateId(),
      name: `Property ${localProperties.length + 1}`,
      type: 'text',
      options: {}
    }
    setLocalProperties([...localProperties, newProperty])
    setEditingPropertyId(newProperty.id)
  }

  const handleUpdateProperty = (id: string, updates: Partial<DatabaseProperty>) => {
    setLocalProperties(prev => 
      prev.map(prop => prop.id === id ? { ...prop, ...updates } : prop)
    )
  }

  const handleDeleteProperty = (id: string) => {
    setLocalProperties(prev => prev.filter(prop => prop.id !== id))
  }

  const handleAddSelectOption = (propertyId: string) => {
    const property = localProperties.find(p => p.id === propertyId)
    if (!property) return

    const newOption: SelectOption = {
      id: generateId(),
      name: 'New Option',
      color: 'gray'
    }

    const currentOptions = property.options?.options || []
    handleUpdateProperty(propertyId, {
      options: {
        ...property.options,
        options: [...currentOptions, newOption]
      }
    })
  }

  const handleUpdateSelectOption = (propertyId: string, optionId: string, updates: Partial<SelectOption>) => {
    const property = localProperties.find(p => p.id === propertyId)
    if (!property || !property.options?.options) return

    const updatedOptions = property.options.options.map(opt =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    )

    handleUpdateProperty(propertyId, {
      options: {
        ...property.options,
        options: updatedOptions
      }
    })
  }

  const handleDeleteSelectOption = (propertyId: string, optionId: string) => {
    const property = localProperties.find(p => p.id === propertyId)
    if (!property || !property.options?.options) return

    const updatedOptions = property.options.options.filter(opt => opt.id !== optionId)

    handleUpdateProperty(propertyId, {
      options: {
        ...property.options,
        options: updatedOptions
      }
    })
  }

  const handleSave = () => {
    onSaveProperties(localProperties)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Properties</DialogTitle>
          <DialogDescription>
            Add, edit, or remove database properties
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-3">
            {localProperties.map((property, index) => (
              <div
                key={property.id}
                className={cn(
                  "border rounded-lg p-3",
                  editingPropertyId === property.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  
                  <Input
                    value={property.name}
                    onChange={(e) => handleUpdateProperty(property.id, { name: e.target.value })}
                    placeholder="Property name"
                    className="flex-1"
                  />
                  
                  <Select
                    value={property.type}
                    onValueChange={(value) => handleUpdateProperty(property.id, { type: value as DatabasePropertyType })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPropertyId(
                      editingPropertyId === property.id ? null : property.id
                    )}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProperty(property.id)}
                    disabled={localProperties.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                {/* Property-specific options */}
                {editingPropertyId === property.id && (
                  <div className="mt-3 pl-7 space-y-2">
                    {/* Select and MultiSelect options */}
                    {(property.type === 'select' || property.type === 'multiSelect') && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Options</Label>
                        <div className="space-y-1">
                          {property.options?.options?.map(option => (
                            <div key={option.id} className="flex items-center gap-2">
                              <Select
                                value={option.color}
                                onValueChange={(color) => 
                                  handleUpdateSelectOption(property.id, option.id, { color })
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {colors.map(color => (
                                    <SelectItem key={color.name} value={color.name}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: color.hex }}
                                        />
                                        {color.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={option.name}
                                onChange={(e) => 
                                  handleUpdateSelectOption(property.id, option.id, { name: e.target.value })
                                }
                                placeholder="Option name"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSelectOption(property.id, option.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSelectOption(property.id)}
                          className="w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add option
                        </Button>
                      </div>
                    )}

                    {/* Number format options */}
                    {property.type === 'number' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Number Format</Label>
                        <Select
                          value={property.options?.numberFormat || 'number'}
                          onValueChange={(format) => 
                            handleUpdateProperty(property.id, {
                              options: { ...property.options, numberFormat: format as any }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="percent">Percent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Date format options */}
                    {property.type === 'date' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`include-time-${property.id}`}
                            checked={property.options?.includeTime || false}
                            onChange={(e) => 
                              handleUpdateProperty(property.id, {
                                options: { ...property.options, includeTime: e.target.checked }
                              })
                            }
                          />
                          <Label htmlFor={`include-time-${property.id}`} className="text-xs">
                            Include time
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddProperty}
            className="w-full mt-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Properties
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}