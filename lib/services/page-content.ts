import { getMongoDb } from '@/lib/db/mongodb'
import { Block, PageContent } from '@/types'

interface MergeResult {
  mergedBlocks: Block[]
  hasConflicts: boolean
  conflicts: Array<{
    blockId: string
    originalContent: any
    incomingContent: any
  }>
}

export class PageContentService {
  private async getDb() {
    return await getMongoDb()
  }

  /**
   * Save page content to MongoDB
   */
  async savePageContent(pageId: string, blocks: Block[]): Promise<PageContent> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContent')
    
    const now = new Date()
    const existingContent = await collection.findOne({ pageId })
    
    const pageContent: PageContent = {
      pageId,
      blocks,
      version: existingContent ? existingContent.version + 1 : 1,
      createdAt: existingContent?.createdAt || now,
      updatedAt: now
    }
    
    await collection.replaceOne(
      { pageId },
      pageContent,
      { upsert: true }
    )
    
    return pageContent
  }

  /**
   * Load page content from MongoDB
   */
  async loadPageContent(pageId: string): Promise<PageContent | null> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContent')
    
    const content = await collection.findOne({ pageId })
    
    if (content) {
      // Remove MongoDB-specific fields and return clean object
      const { _id, ...cleanContent } = content as any
      return {
        pageId: cleanContent.pageId,
        blocks: cleanContent.blocks || [],
        version: cleanContent.version || 1,
        createdAt: cleanContent.createdAt ? new Date(cleanContent.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: cleanContent.updatedAt ? new Date(cleanContent.updatedAt).toISOString() : new Date().toISOString()
      } as PageContent
    }
    
    return null
  }

  /**
   * Delete page content
   */
  async deletePageContent(pageId: string): Promise<boolean> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContent')
    
    const result = await collection.deleteOne({ pageId })
    return result.deletedCount > 0
  }

  /**
   * Get page content version history
   */
  async getContentHistory(pageId: string, limit: number = 10): Promise<PageContent[]> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContentHistory')
    
    const history = await collection
      .find({ pageId })
      .sort({ version: -1 })
      .limit(limit)
      .toArray()
    
    return history
  }

  /**
   * Save a version to history before making changes
   */
  async saveToHistory(pageContent: PageContent): Promise<void> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContentHistory')
    
    // Keep only last 50 versions per page
    const count = await collection.countDocuments({ pageId: pageContent.pageId })
    if (count >= 50) {
      const oldestVersions = await collection
        .find({ pageId: pageContent.pageId })
        .sort({ version: 1 })
        .limit(count - 49)
        .toArray()
      
      const idsToDelete = oldestVersions.map(v => v.version)
      await collection.deleteMany({
        pageId: pageContent.pageId,
        version: { $in: idsToDelete }
      })
    }
    
    await collection.insertOne(pageContent)
  }

  /**
   * Duplicate page content
   */
  async duplicatePageContent(sourcePageId: string, targetPageId: string): Promise<PageContent | null> {
    const sourceContent = await this.loadPageContent(sourcePageId)
    if (!sourceContent) return null
    
    // Deep clone blocks and assign new IDs
    const clonedBlocks = this.cloneBlocks(sourceContent.blocks)
    
    return await this.savePageContent(targetPageId, clonedBlocks)
  }

  /**
   * Clone blocks with new IDs
   */
  private cloneBlocks(blocks: Block[]): Block[] {
    const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    return blocks.map((block, index) => ({
      ...block,
      id: generateId(),
      order: index,
      children: block.children ? this.cloneBlocks(block.children) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }

  /**
   * Search content across pages
   */
  async searchContent(workspaceId: string, query: string): Promise<Array<{ pageId: string; matches: Array<{ blockId: string; content: string; type: string }> }>> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContent')
    
    const searchResults = await collection
      .find({
        $text: { $search: query }
      })
      .toArray()
    
    return searchResults.map(content => ({
      pageId: content.pageId,
      matches: content.blocks
        .filter(block => {
          const blockContent = typeof block.content === 'string' 
            ? block.content 
            : Array.isArray(block.content) 
              ? block.content.map(rt => rt.text).join(' ')
              : ''
          return blockContent.toLowerCase().includes(query.toLowerCase())
        })
        .map(block => ({
          blockId: block.id,
          content: typeof block.content === 'string' 
            ? block.content 
            : Array.isArray(block.content) 
              ? block.content.map(rt => rt.text).join(' ')
              : '',
          type: block.type
        }))
    })).filter(result => result.matches.length > 0)
  }

  /**
   * Get blocks by type across all pages in workspace
   */
  async getBlocksByType(workspaceId: string, blockType: string): Promise<Array<{ pageId: string; blocks: Block[] }>> {
    const db = await this.getDb()
    const collection = db.collection<PageContent>('pageContent')
    
    const results = await collection
      .find({
        'blocks.type': blockType
      })
      .toArray()
    
    return results.map(content => ({
      pageId: content.pageId,
      blocks: content.blocks.filter(block => block.type === blockType)
    }))
  }

  /**
   * Update specific block in page content
   */
  async updateBlock(pageId: string, blockId: string, updates: Partial<Block>): Promise<boolean> {
    const content = await this.loadPageContent(pageId)
    if (!content) return false
    
    const updateBlockRecursive = (blocks: Block[]): boolean => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          blocks[i] = { ...blocks[i], ...updates, updatedAt: new Date() }
          return true
        }
        if (blocks[i].children && updateBlockRecursive(blocks[i].children!)) {
          return true
        }
      }
      return false
    }
    
    const updated = updateBlockRecursive(content.blocks)
    if (updated) {
      await this.savePageContent(pageId, content.blocks)
    }
    
    return updated
  }

  /**
   * Merge conflicting changes from two users
   * Uses a three-way merge strategy
   */
  async mergeChanges(
    pageId: string,
    serverBlocks: Block[],
    clientBlocks: Block[],
    userId: string
  ): Promise<MergeResult> {
    const conflicts: MergeResult['conflicts'] = []
    const mergedBlocks: Block[] = []
    
    // Create maps for easy lookup
    const serverBlockMap = new Map(serverBlocks.map(b => [b.id, b]))
    const clientBlockMap = new Map(clientBlocks.map(b => [b.id, b]))
    
    // Track which blocks we've processed
    const processedIds = new Set<string>()
    
    // Process blocks that exist in both versions
    for (const clientBlock of clientBlocks) {
      processedIds.add(clientBlock.id)
      const serverBlock = serverBlockMap.get(clientBlock.id)
      
      if (serverBlock) {
        // Block exists in both - check for conflicts
        const clientContent = JSON.stringify(clientBlock.content)
        const serverContent = JSON.stringify(serverBlock.content)
        
        if (clientContent !== serverContent) {
          // Content differs - this is a conflict
          // For now, we'll prefer the client's version but track the conflict
          conflicts.push({
            blockId: clientBlock.id,
            originalContent: serverBlock.content,
            incomingContent: clientBlock.content
          })
          
          // Use client version but mark it as having a conflict
          mergedBlocks.push({
            ...clientBlock,
            properties: {
              ...clientBlock.properties,
              hasConflict: true,
              conflictedAt: new Date(),
              conflictedBy: userId
            }
          })
        } else {
          // No conflict - use the block as is
          mergedBlocks.push(clientBlock)
        }
      } else {
        // Block only exists in client - it's a new block
        mergedBlocks.push(clientBlock)
      }
    }
    
    // Add blocks that only exist on server (were added by another user)
    for (const serverBlock of serverBlocks) {
      if (!processedIds.has(serverBlock.id)) {
        // This block was added by another user - include it
        mergedBlocks.push({
          ...serverBlock,
          properties: {
            ...serverBlock.properties,
            addedByOtherUser: true,
            addedAt: new Date()
          }
        })
      }
    }
    
    // Sort blocks by order to maintain structure
    mergedBlocks.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    // Re-index order values
    mergedBlocks.forEach((block, index) => {
      block.order = index
    })
    
    return {
      mergedBlocks,
      hasConflicts: conflicts.length > 0,
      conflicts
    }
  }

  /**
   * Get conflict-free version by accepting all server changes
   */
  async acceptServerVersion(pageId: string): Promise<PageContent | null> {
    return await this.loadPageContent(pageId)
  }

  /**
   * Force save client version (overwrite server)
   */
  async forceClientVersion(pageId: string, blocks: Block[]): Promise<PageContent> {
    // Save current as history first
    const current = await this.loadPageContent(pageId)
    if (current) {
      await this.saveToHistory(current)
    }
    
    // Force save the client version
    return await this.savePageContent(pageId, blocks)
  }
}

// Export singleton instance
export const pageContentService = new PageContentService()