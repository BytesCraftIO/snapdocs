import { Database, DatabaseFilter, DatabaseSort, DatabaseRow, DatabaseProperty, SelectOption } from '@/types'
import { parseISO, isAfter, isBefore, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns'
import { addWeeks, addMonths, addYears, subWeeks, subMonths, subYears } from 'date-fns'

export class DatabaseService {
  static applyFilters(rows: DatabaseRow[], filters: DatabaseFilter[], properties: DatabaseProperty[]): DatabaseRow[] {
    if (!filters.length) return rows

    return rows.filter(row => {
      let result = true
      let hasOrCondition = false

      for (const filter of filters) {
        const property = properties.find(p => p.id === filter.property)
        if (!property) continue

        const value = row.properties[filter.property]
        const filterResult = this.evaluateFilter(value, filter, property)

        if (filter.type === 'or') {
          hasOrCondition = true
          result = result || filterResult
        } else {
          if (hasOrCondition) {
            // Reset for new AND group
            result = filterResult
            hasOrCondition = false
          } else {
            result = result && filterResult
          }
        }
      }

      return result
    })
  }

  static applySorts(rows: DatabaseRow[], sorts: DatabaseSort[], properties: DatabaseProperty[]): DatabaseRow[] {
    if (!sorts.length) return rows

    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        const property = properties.find(p => p.id === sort.property)
        if (!property) continue

        const aValue = a.properties[sort.property]
        const bValue = b.properties[sort.property]

        const comparison = this.compareValues(aValue, bValue, property)
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  }

  static groupRows(rows: DatabaseRow[], groupByProperty: string, properties: DatabaseProperty[]) {
    const property = properties.find(p => p.id === groupByProperty)
    if (!property || property.type !== 'select') {
      return { ungrouped: rows }
    }

    const groups: { [key: string]: DatabaseRow[] } = {}
    const options = property.options?.options || []

    // Initialize groups for all select options
    options.forEach(option => {
      groups[option.id] = []
    })
    groups['__empty__'] = []

    // Group rows
    rows.forEach(row => {
      const value = row.properties[groupByProperty]
      if (value && typeof value === 'object' && 'id' in value) {
        const groupKey = value.id
        if (groups[groupKey]) {
          groups[groupKey].push(row)
        } else {
          groups['__empty__'].push(row)
        }
      } else {
        groups['__empty__'].push(row)
      }
    })

    return groups
  }

  static calculateFormula(expression: string, row: DatabaseRow, properties: DatabaseProperty[]): any {
    // Basic formula evaluation - in a real implementation, you'd use a proper expression parser
    try {
      // This is a simplified version - you'd want to implement proper formula parsing
      // For now, just return a placeholder
      return 'Formula result'
    } catch (error) {
      return 'Error'
    }
  }

  static calculateRollup(
    relationProperty: string,
    rollupProperty: string,
    rollupFunction: string,
    row: DatabaseRow,
    allRows: DatabaseRow[],
    properties: DatabaseProperty[]
  ): any {
    const relationValue = row.properties[relationProperty]
    if (!relationValue || !Array.isArray(relationValue)) {
      return null
    }

    // Get related rows
    const relatedRows = allRows.filter(r => relationValue.includes(r.id))
    const values = relatedRows.map(r => r.properties[rollupProperty]).filter(v => v != null)

    if (!values.length) return null

    switch (rollupFunction) {
      case 'count':
        return relatedRows.length
      case 'count_values':
        return values.length
      case 'sum':
        return values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
      case 'average':
        const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
        return sum / values.length
      case 'min':
        return Math.min(...values.map(v => parseFloat(v) || 0))
      case 'max':
        return Math.max(...values.map(v => parseFloat(v) || 0))
      case 'range':
        const nums = values.map(v => parseFloat(v) || 0)
        return Math.max(...nums) - Math.min(...nums)
      default:
        return null
    }
  }

  private static evaluateFilter(value: any, filter: DatabaseFilter, property: DatabaseProperty): boolean {
    const condition = filter.condition
    const filterValue = filter.value

    // Handle empty/null values
    const isEmpty = value === null || value === undefined || value === ''

    switch (condition) {
      case 'is_empty':
        return isEmpty
      case 'is_not_empty':
        return !isEmpty

      // Text conditions
      case 'equals':
        return String(value || '').toLowerCase() === String(filterValue || '').toLowerCase()
      case 'does_not_equal':
        return String(value || '').toLowerCase() !== String(filterValue || '').toLowerCase()
      case 'contains':
        return String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase())
      case 'does_not_contain':
        return !String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase())
      case 'starts_with':
        return String(value || '').toLowerCase().startsWith(String(filterValue || '').toLowerCase())
      case 'ends_with':
        return String(value || '').toLowerCase().endsWith(String(filterValue || '').toLowerCase())

      // Number conditions
      case 'greater_than':
        return parseFloat(value) > parseFloat(filterValue)
      case 'less_than':
        return parseFloat(value) < parseFloat(filterValue)
      case 'greater_than_or_equal_to':
        return parseFloat(value) >= parseFloat(filterValue)
      case 'less_than_or_equal_to':
        return parseFloat(value) <= parseFloat(filterValue)

      // Date conditions
      case 'before':
        try {
          const date = parseISO(value?.start || value)
          const filterDate = parseISO(filterValue)
          return isBefore(date, filterDate)
        } catch {
          return false
        }
      case 'after':
        try {
          const date = parseISO(value?.start || value)
          const filterDate = parseISO(filterValue)
          return isAfter(date, filterDate)
        } catch {
          return false
        }
      case 'on_or_before':
        try {
          const date = parseISO(value?.start || value)
          const filterDate = parseISO(filterValue)
          return !isAfter(date, filterDate)
        } catch {
          return false
        }
      case 'on_or_after':
        try {
          const date = parseISO(value?.start || value)
          const filterDate = parseISO(filterValue)
          return !isBefore(date, filterDate)
        } catch {
          return false
        }
      case 'past_week':
        try {
          const date = parseISO(value?.start || value)
          const weekAgo = subWeeks(new Date(), 1)
          return isAfter(date, weekAgo) && isBefore(date, new Date())
        } catch {
          return false
        }
      case 'past_month':
        try {
          const date = parseISO(value?.start || value)
          const monthAgo = subMonths(new Date(), 1)
          return isAfter(date, monthAgo) && isBefore(date, new Date())
        } catch {
          return false
        }
      case 'past_year':
        try {
          const date = parseISO(value?.start || value)
          const yearAgo = subYears(new Date(), 1)
          return isAfter(date, yearAgo) && isBefore(date, new Date())
        } catch {
          return false
        }

      // Select conditions
      default:
        if (property.type === 'select') {
          if (condition === 'equals') {
            return value?.id === filterValue
          } else if (condition === 'does_not_equal') {
            return value?.id !== filterValue
          }
        } else if (property.type === 'multiSelect') {
          if (condition === 'contains') {
            return Array.isArray(value) && value.some((v: any) => v.id === filterValue)
          } else if (condition === 'does_not_contain') {
            return !Array.isArray(value) || !value.some((v: any) => v.id === filterValue)
          }
        } else if (property.type === 'checkbox') {
          const boolValue = Boolean(value)
          const filterBoolValue = filterValue === 'true' || filterValue === true
          if (condition === 'equals') {
            return boolValue === filterBoolValue
          } else if (condition === 'does_not_equal') {
            return boolValue !== filterBoolValue
          }
        }
        return false
    }
  }

  private static compareValues(a: any, b: any, property: DatabaseProperty): number {
    // Handle null/undefined values
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1

    switch (property.type) {
      case 'number':
        return parseFloat(a) - parseFloat(b)
      
      case 'date':
        try {
          const dateA = parseISO(a?.start || a)
          const dateB = parseISO(b?.start || b)
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      
      case 'checkbox':
        return Boolean(a) === Boolean(b) ? 0 : Boolean(a) ? 1 : -1
      
      case 'select':
        const nameA = a?.name || ''
        const nameB = b?.name || ''
        return nameA.localeCompare(nameB)
      
      case 'multiSelect':
        const countA = Array.isArray(a) ? a.length : 0
        const countB = Array.isArray(b) ? b.length : 0
        return countA - countB
      
      default:
        return String(a).localeCompare(String(b))
    }
  }

  static exportToCSV(rows: DatabaseRow[], properties: DatabaseProperty[]): string {
    const headers = properties.map(prop => prop.name)
    const csvRows = [headers]

    rows.forEach(row => {
      const csvRow = properties.map(prop => {
        const value = row.properties[prop.id]
        return this.formatValueForExport(value, prop)
      })
      csvRows.push(csvRow)
    })

    return csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  private static formatValueForExport(value: any, property: DatabaseProperty): string {
    if (value == null) return ''

    switch (property.type) {
      case 'select':
        return value.name || ''
      case 'multiSelect':
        return Array.isArray(value) ? value.map((v: any) => v.name).join(', ') : ''
      case 'date':
        return value.start || ''
      case 'checkbox':
        return value ? 'true' : 'false'
      case 'relation':
        return Array.isArray(value) ? value.length.toString() : '0'
      default:
        return String(value)
    }
  }
}