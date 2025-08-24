import { prisma } from '@/lib/db/prisma'

/**
 * Extract user IDs from mention placeholders in content
 */
export function extractMentionIds(content: string): string[] {
  const mentionPattern = /@\[user:([^\]]+)\]/g
  const userIds: string[] = []
  let match
  
  while ((match = mentionPattern.exec(content)) !== null) {
    userIds.push(match[1])
  }
  
  return [...new Set(userIds)] // Remove duplicates
}

/**
 * Fetch user data for mentions
 */
export async function fetchMentionUsers(userIds: string[]) {
  if (userIds.length === 0) return {}
  
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    const mentions: Record<string, any> = {}
    users.forEach(user => {
      mentions[`user:${user.id}`] = {
        id: user.id,
        name: user.name || user.email,
        email: user.email
      }
    })
    
    return mentions
  } catch (error) {
    console.error('Error fetching mention users:', error)
    return {}
  }
}

/**
 * Process blocks to ensure mentions are populated
 */
export async function ensureMentionsPopulated(blocks: any[]) {
  const processedBlocks = []
  
  for (const block of blocks) {
    const content = typeof block.content === 'string' ? block.content : ''
    const userIds = extractMentionIds(content)
    
    if (userIds.length > 0) {
      // Check if mentions are already populated
      const existingMentions = block.properties?.mentions || {}
      const missingUserIds = userIds.filter(id => !existingMentions[`user:${id}`])
      
      if (missingUserIds.length > 0) {
        // Fetch missing user data
        const newMentions = await fetchMentionUsers(missingUserIds)
        
        // Merge with existing mentions
        block.properties = {
          ...block.properties,
          mentions: {
            ...existingMentions,
            ...newMentions
          }
        }
      }
    }
    
    processedBlocks.push(block)
  }
  
  return processedBlocks
}