import { getMongoDb } from '@/lib/db/mongodb'
import { Block, PageContent } from '@/types'

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
}

// Export singleton instance
export const pageContentService = new PageContentService()