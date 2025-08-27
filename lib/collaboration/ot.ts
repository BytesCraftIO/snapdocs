/**
 * Operational Transformation (OT) implementation for collaborative editing
 * This handles conflict resolution when multiple users edit the same content simultaneously
 */

export interface Operation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
}

export interface Transform {
  op1: Operation
  op2: Operation
}

/**
 * Transform two operations to handle concurrent edits
 * Returns transformed operations that can be applied in any order
 */
export function transformOperations(op1: Operation, op2: Operation): Transform {
  // op1 is the operation from the local user
  // op2 is the operation from the remote user
  
  if (op1.type === 'retain' || op2.type === 'retain') {
    // No transformation needed for retain operations
    return { op1, op2 }
  }
  
  // Both are inserts
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position < op2.position) {
      // op1 comes before op2, shift op2's position
      return {
        op1,
        op2: {
          ...op2,
          position: op2.position + (op1.content?.length || 0)
        }
      }
    } else if (op1.position > op2.position) {
      // op2 comes before op1, shift op1's position
      return {
        op1: {
          ...op1,
          position: op1.position + (op2.content?.length || 0)
        },
        op2
      }
    } else {
      // Same position - use timestamp or userId to determine order
      if (op1.timestamp < op2.timestamp || 
          (op1.timestamp === op2.timestamp && op1.userId < op2.userId)) {
        return {
          op1,
          op2: {
            ...op2,
            position: op2.position + (op1.content?.length || 0)
          }
        }
      } else {
        return {
          op1: {
            ...op1,
            position: op1.position + (op2.content?.length || 0)
          },
          op2
        }
      }
    }
  }
  
  // Both are deletes
  if (op1.type === 'delete' && op2.type === 'delete') {
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)
    
    if (op1End <= op2.position) {
      // op1 is before op2, shift op2's position
      return {
        op1,
        op2: {
          ...op2,
          position: op2.position - (op1.length || 0)
        }
      }
    } else if (op2End <= op1.position) {
      // op2 is before op1, shift op1's position
      return {
        op1: {
          ...op1,
          position: op1.position - (op2.length || 0)
        },
        op2
      }
    } else {
      // Overlapping deletes - need to handle carefully
      const overlapStart = Math.max(op1.position, op2.position)
      const overlapEnd = Math.min(op1End, op2End)
      const overlapLength = overlapEnd - overlapStart
      
      if (op1.position < op2.position) {
        return {
          op1: {
            ...op1,
            length: (op1.length || 0) - overlapLength
          },
          op2: {
            ...op2,
            position: op1.position,
            length: (op2.length || 0) - overlapLength
          }
        }
      } else {
        return {
          op1: {
            ...op1,
            position: op2.position,
            length: (op1.length || 0) - overlapLength
          },
          op2: {
            ...op2,
            length: (op2.length || 0) - overlapLength
          }
        }
      }
    }
  }
  
  // Insert and delete
  if (op1.type === 'insert' && op2.type === 'delete') {
    const op2End = op2.position + (op2.length || 0)
    
    if (op1.position <= op2.position) {
      // Insert before delete
      return {
        op1,
        op2: {
          ...op2,
          position: op2.position + (op1.content?.length || 0)
        }
      }
    } else if (op1.position >= op2End) {
      // Insert after delete
      return {
        op1: {
          ...op1,
          position: op1.position - (op2.length || 0)
        },
        op2
      }
    } else {
      // Insert within delete range
      return {
        op1: {
          ...op1,
          position: op2.position
        },
        op2: {
          ...op2,
          length: (op2.length || 0) + (op1.content?.length || 0)
        }
      }
    }
  }
  
  // Delete and insert
  if (op1.type === 'delete' && op2.type === 'insert') {
    const op1End = op1.position + (op1.length || 0)
    
    if (op2.position <= op1.position) {
      // Insert before delete
      return {
        op1: {
          ...op1,
          position: op1.position + (op2.content?.length || 0)
        },
        op2
      }
    } else if (op2.position >= op1End) {
      // Insert after delete
      return {
        op1,
        op2: {
          ...op2,
          position: op2.position - (op1.length || 0)
        }
      }
    } else {
      // Insert within delete range
      return {
        op1: {
          ...op1,
          length: (op1.length || 0) + (op2.content?.length || 0)
        },
        op2: {
          ...op2,
          position: op1.position
        }
      }
    }
  }
  
  return { op1, op2 }
}

/**
 * Apply an operation to a text string
 */
export function applyOperation(text: string, operation: Operation): string {
  switch (operation.type) {
    case 'insert':
      return (
        text.slice(0, operation.position) +
        (operation.content || '') +
        text.slice(operation.position)
      )
    
    case 'delete':
      return (
        text.slice(0, operation.position) +
        text.slice(operation.position + (operation.length || 0))
      )
    
    case 'retain':
      return text
    
    default:
      return text
  }
}

/**
 * Compose multiple operations into a single operation
 */
export function composeOperations(ops: Operation[]): Operation[] {
  if (ops.length === 0) return []
  if (ops.length === 1) return ops
  
  const composed: Operation[] = []
  let current = ops[0]
  
  for (let i = 1; i < ops.length; i++) {
    const next = ops[i]
    
    // Try to merge consecutive operations of the same type
    if (current.type === next.type && current.userId === next.userId) {
      if (current.type === 'insert' && next.type === 'insert') {
        if (current.position + (current.content?.length || 0) === next.position) {
          // Merge consecutive inserts
          current = {
            ...current,
            content: (current.content || '') + (next.content || '')
          }
          continue
        }
      } else if (current.type === 'delete' && next.type === 'delete') {
        if (current.position === next.position) {
          // Merge consecutive deletes at same position
          current = {
            ...current,
            length: (current.length || 0) + (next.length || 0)
          }
          continue
        }
      }
    }
    
    composed.push(current)
    current = next
  }
  
  composed.push(current)
  return composed
}

/**
 * Create a diff between two text strings
 */
export function createDiff(oldText: string, newText: string, userId: string): Operation[] {
  const operations: Operation[] = []
  let oldIndex = 0
  let newIndex = 0
  
  while (oldIndex < oldText.length || newIndex < newText.length) {
    if (oldIndex >= oldText.length) {
      // Remaining characters in new text are insertions
      operations.push({
        type: 'insert',
        position: oldIndex,
        content: newText.slice(newIndex),
        userId,
        timestamp: Date.now()
      })
      break
    }
    
    if (newIndex >= newText.length) {
      // Remaining characters in old text are deletions
      operations.push({
        type: 'delete',
        position: newIndex,
        length: oldText.length - oldIndex,
        userId,
        timestamp: Date.now()
      })
      break
    }
    
    if (oldText[oldIndex] === newText[newIndex]) {
      // Characters match, move forward
      oldIndex++
      newIndex++
    } else {
      // Find the extent of the difference
      let deleteLength = 0
      let insertContent = ''
      
      // Find deletion extent
      let tempOld = oldIndex
      while (tempOld < oldText.length && oldText[tempOld] !== newText[newIndex]) {
        deleteLength++
        tempOld++
      }
      
      // Find insertion extent
      let tempNew = newIndex
      while (tempNew < newText.length && newText[tempNew] !== oldText[oldIndex]) {
        insertContent += newText[tempNew]
        tempNew++
      }
      
      if (deleteLength > 0) {
        operations.push({
          type: 'delete',
          position: newIndex,
          length: deleteLength,
          userId,
          timestamp: Date.now()
        })
        oldIndex += deleteLength
      }
      
      if (insertContent.length > 0) {
        operations.push({
          type: 'insert',
          position: oldIndex,
          content: insertContent,
          userId,
          timestamp: Date.now()
        })
        newIndex += insertContent.length
      }
    }
  }
  
  return composeOperations(operations)
}