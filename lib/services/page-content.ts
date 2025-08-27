import { getMongoDb } from '@/lib/db/mongodb'
import { Block, PageContent } from '@/types'

/**
 * Simplified page content service that stores BlockNote blocks directly in MongoDB
 * Each block maintains its native BlockNote structure
 */

interface PageDocument {
  pageId: string
  blocks: any[] // Store BlockNote blocks as-is
  version: number
  lastEditedBy?: string
  createdAt: Date
  updatedAt: Date
}

export class PageContentService {
  private async getDb() {
    return await getMongoDb()
  }

  /**
   * Save page content to MongoDB
   */
  async savePageContent(pageId: string, blocks: Block[], userId?: string): Promise<PageContent> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContent')
    
    const now = new Date()
    const existingContent = await collection.findOne({ pageId })
    
    const pageDocument: PageDocument = {
      pageId,
      blocks: blocks as any[], // Store blocks in their native format
      version: existingContent ? existingContent.version + 1 : 1,
      lastEditedBy: userId,
      createdAt: existingContent?.createdAt || now,
      updatedAt: now
    }
    
    await collection.replaceOne(
      { pageId },
      pageDocument,
      { upsert: true }
    )
    
    return {
      pageId,
      blocks,
      version: pageDocument.version,
      createdAt: pageDocument.createdAt,
      updatedAt: pageDocument.updatedAt
    }
  }

  /**
   * Load page content from MongoDB
   */
  async loadPageContent(pageId: string): Promise<PageContent | null> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContent')
    
    const content = await collection.findOne({ pageId })
    
    if (content) {
      // Remove MongoDB-specific fields
      const { _id, ...cleanContent } = content as any
      
      return {
        pageId: cleanContent.pageId,
        blocks: cleanContent.blocks || [],
        version: cleanContent.version || 1,
        createdAt: cleanContent.createdAt ? new Date(cleanContent.createdAt) : new Date(),
        updatedAt: cleanContent.updatedAt ? new Date(cleanContent.updatedAt) : new Date()
      }
    }
    
    return null
  }

  /**
   * Delete page content
   */
  async deletePageContent(pageId: string): Promise<boolean> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContent')
    
    const result = await collection.deleteOne({ pageId })
    return result.deletedCount > 0
  }

  /**
   * Get page content version history
   */
  async getContentHistory(pageId: string, limit: number = 10): Promise<PageContent[]> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContentHistory')
    
    const history = await collection
      .find({ pageId })
      .sort({ version: -1 })
      .limit(limit)
      .toArray()
    
    return history.map(doc => ({
      pageId: doc.pageId,
      blocks: doc.blocks,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }))
  }

  /**
   * Save a version to history before making changes
   */
  async saveToHistory(pageContent: PageContent): Promise<void> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContentHistory')
    
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
    
    const pageDocument: PageDocument = {
      pageId: pageContent.pageId,
      blocks: pageContent.blocks,
      version: pageContent.version,
      createdAt: new Date(pageContent.createdAt),
      updatedAt: new Date(pageContent.updatedAt)
    }
    
    await collection.insertOne(pageDocument)
  }

  /**
   * Duplicate page content
   */
  async duplicatePageContent(sourcePageId: string, targetPageId: string): Promise<PageContent | null> {
    const sourceContent = await this.loadPageContent(sourcePageId)
    if (!sourceContent) return null
    
    // Clone blocks with new IDs
    const clonedBlocks = sourceContent.blocks.map((block: any) => ({
      ...block,
      id: this.generateId()
    }))
    
    return await this.savePageContent(targetPageId, clonedBlocks)
  }

  /**
   * Update specific block in page content
   */
  async updateBlock(pageId: string, blockId: string, updates: Partial<Block>): Promise<boolean> {
    const content = await this.loadPageContent(pageId)
    if (!content) return false
    
    let blockUpdated = false
    const updatedBlocks = content.blocks.map((block: any) => {
      if (block.id === blockId) {
        blockUpdated = true
        return { ...block, ...updates }
      }
      return block
    })
    
    if (blockUpdated) {
      await this.savePageContent(pageId, updatedBlocks)
    }
    
    return blockUpdated
  }

  /**
   * Search content across pages
   */
  async searchContent(workspaceId: string, query: string): Promise<Array<{ pageId: string; matches: Array<{ blockId: string; content: string; type: string }> }>> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContent')
    
    const searchResults = await collection
      .find({
        $text: { $search: query }
      })
      .toArray()
    
    return searchResults.map(content => ({
      pageId: content.pageId,
      matches: content.blocks
        .filter((block: any) => {
          const blockContent = typeof block.content === 'string' 
            ? block.content 
            : Array.isArray(block.content) 
              ? block.content.map((rt: any) => rt.text || '').join(' ')
              : ''
          return blockContent.toLowerCase().includes(query.toLowerCase())
        })
        .map((block: any) => ({
          blockId: block.id,
          content: typeof block.content === 'string' 
            ? block.content 
            : Array.isArray(block.content) 
              ? block.content.map((rt: any) => rt.text || '').join(' ')
              : '',
          type: block.type
        }))
    })).filter(result => result.matches.length > 0)
  }

  /**
   * Get blocks by type across all pages
   */
  async getBlocksByType(workspaceId: string, blockType: string): Promise<Array<{ pageId: string; blocks: Block[] }>> {
    const db = await this.getDb()
    const collection = db.collection<PageDocument>('pageContent')
    
    const results = await collection
      .find({
        'blocks.type': blockType
      })
      .toArray()
    
    return results.map(content => ({
      pageId: content.pageId,
      blocks: content.blocks.filter((block: any) => block.type === blockType)
    }))
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

// Export singleton instance
export const pageContentService = new PageContentService()