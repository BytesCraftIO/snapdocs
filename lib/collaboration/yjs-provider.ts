import * as Y from 'yjs'
import YPartyKitProvider from 'y-partykit/provider'

export interface CollaborationUser {
  id: string
  name: string
  color: string
}

export function createCollaborationProvider(
  pageId: string,
  workspaceId: string,
  user: CollaborationUser
) {
  const doc = new Y.Doc()
  
  // Use PartyKit for development
  // In production, you can switch to Liveblocks, Hocuspocus, or your own WebSocket server
  const provider = new YPartyKitProvider(
    'blocknote-dev.yousefed.partykit.dev',
    `${workspaceId}-${pageId}`, // Unique room name for each page
    doc,
    {
      connect: true,
    }
  )

  return {
    doc,
    provider,
    fragment: doc.getXmlFragment('document-store'),
    user: {
      name: user.name,
      color: user.color,
    },
  }
}

// Generate a random color for the user
export function generateUserColor(): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FECA57', // Yellow
    '#FF9FF3', // Pink
    '#54A0FF', // Light Blue
    '#48DBFB', // Cyan
    '#A29BFE', // Purple
    '#FD79A8', // Rose
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Clean up the provider when done
export function cleanupCollaborationProvider(provider: YPartyKitProvider) {
  provider.disconnect()
  provider.destroy()
}