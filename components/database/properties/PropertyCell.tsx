"use client"

import { DatabaseProperty, DatabaseRow, PropertyValue } from "@/types"
import { TextProperty } from "./TextProperty"
import { NumberProperty } from "./NumberProperty" 
import { SelectProperty } from "./SelectProperty"
import { MultiSelectProperty } from "./MultiSelectProperty"
import { DateProperty } from "./DateProperty"
import { CheckboxProperty } from "./CheckboxProperty"
import { UrlProperty } from "./UrlProperty"
import { EmailProperty } from "./EmailProperty"
import { PhoneProperty } from "./PhoneProperty"
import { FormulaProperty } from "./FormulaProperty"
import { RelationProperty } from "./RelationProperty"
import { RollupProperty } from "./RollupProperty"
import { CreatedTimeProperty } from "./CreatedTimeProperty"
import { CreatedByProperty } from "./CreatedByProperty"
import { LastEditedTimeProperty } from "./LastEditedTimeProperty"
import { LastEditedByProperty } from "./LastEditedByProperty"

interface PropertyCellProps {
  property: DatabaseProperty
  value: any
  row: DatabaseRow
  editable?: boolean
  onChange?: (value: any) => void
  className?: string
  isEditing?: boolean
  onStopEditing?: () => void
}

export function PropertyCell({
  property,
  value,
  row,
  editable = false,
  onChange,
  className,
  isEditing,
  onStopEditing
}: PropertyCellProps) {
  const handleChange = (newValue: any) => {
    onChange?.(newValue)
  }

  const commonProps = {
    property,
    value,
    row,
    editable,
    onChange: handleChange,
    className
  }

  switch (property.type) {
    case 'text':
      return <TextProperty {...commonProps} />
    case 'number':
      return <NumberProperty {...commonProps} />
    case 'select':
      return <SelectProperty {...commonProps} />
    case 'multiSelect':
      return <MultiSelectProperty {...commonProps} />
    case 'date':
      return <DateProperty {...commonProps} />
    case 'checkbox':
      return <CheckboxProperty {...commonProps} />
    case 'url':
      return <UrlProperty {...commonProps} />
    case 'email':
      return <EmailProperty {...commonProps} />
    case 'phone':
      return <PhoneProperty {...commonProps} />
    case 'formula':
      return <FormulaProperty {...commonProps} />
    case 'relation':
      return <RelationProperty {...commonProps} />
    case 'rollup':
      return <RollupProperty {...commonProps} />
    case 'createdTime':
      return <CreatedTimeProperty {...commonProps} />
    case 'createdBy':
      return <CreatedByProperty {...commonProps} />
    case 'lastEditedTime':
      return <LastEditedTimeProperty {...commonProps} />
    case 'lastEditedBy':
      return <LastEditedByProperty {...commonProps} />
    default:
      return <div className={className}>-</div>
  }
}