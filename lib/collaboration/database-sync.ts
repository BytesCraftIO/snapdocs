import * as Y from 'yjs'
import YPartyKitProvider from 'y-partykit/provider'

export interface DatabaseSync {
  doc: Y.Doc
  provider: YPartyKitProvider
  rows: Y.Map<any>
  metadata: Y.Map<any>
}

export function createDatabaseSync(
  databaseId: string,
  workspaceId: string
): DatabaseSync {
  const doc = new Y.Doc()
  
  // Create shared types for database data
  const rows = doc.getMap('rows')
  const metadata = doc.getMap('metadata')
  
  // Use PartyKit for real-time sync
  const provider = new YPartyKitProvider(
    'blocknote-dev.yousefed.partykit.dev',
    `db-${workspaceId}-${databaseId}`,
    doc,
    {
      connect: true,
    }
  )
  
  return {
    doc,
    provider,
    rows,
    metadata
  }
}

export function cleanupDatabaseSync(sync: DatabaseSync) {
  sync.provider.disconnect()
  sync.provider.destroy()
}

// Helper functions for working with Yjs data
export function updateRow(rows: Y.Map<any>, rowId: string, updates: any) {
  const row = rows.get(rowId) || {}
  rows.set(rowId, {
    ...row,
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

export function deleteRow(rows: Y.Map<any>, rowId: string) {
  rows.delete(rowId)
}

export function getAllRows(rows: Y.Map<any>): any[] {
  const rowsArray: any[] = []
  rows.forEach((value, key) => {
    rowsArray.push({
      id: key,
      ...value
    })
  })
  return rowsArray.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export function subscribeToRows(
  rows: Y.Map<any>,
  callback: (rowsArray: any[]) => void
) {
  const observer = () => {
    callback(getAllRows(rows))
  }
  
  rows.observe(observer)
  
  // Return unsubscribe function
  return () => {
    rows.unobserve(observer)
  }
}