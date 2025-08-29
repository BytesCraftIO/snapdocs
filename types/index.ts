// Core types for SnapDocs

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  id: string
  name: string
  slug: string
  icon?: string
  domain?: string
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  id: string
  title: string
  icon?: string
  coverImage?: string
  isPublished: boolean
  isArchived: boolean
  isDeleted: boolean
  isFavorite: boolean
  path: string
  order: number
  workspaceId: string
  authorId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  deletedAt?: Date
}

// Block types for the editor
export type BlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'toggle'
  | 'code'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'image'
  | 'video'
  | 'file'
  | 'embed'
  | 'table'
  | 'database'
  | 'column'
  | 'columnList'

// Rich text formatting types
export interface RichText {
  text: string
  annotations?: {
    bold?: boolean
    italic?: boolean
    strikethrough?: boolean
    underline?: boolean
    code?: boolean
    color?: string
  }
  href?: string
}

// Block-specific property types
export interface HeadingProperties {
  level?: 1 | 2 | 3
}

export interface ListItem {
  id: string
  content: string
  checked?: boolean
  indent?: number
}

export interface ListProperties {
  listType: 'bullet' | 'numbered' | 'todo'
  items: ListItem[]
}

export interface TodoProperties {
  checked?: boolean
}

export interface CodeProperties {
  language?: string
  caption?: string
}

export interface CalloutProperties {
  icon?: string
  color?: string
}

export interface ImageProperties {
  url?: string
  caption?: string
  width?: number
  height?: number
}

export interface TableProperties {
  hasColumnHeader?: boolean
  hasRowHeader?: boolean
  tableWidth?: number
}

export interface ToggleProperties {
  expanded?: boolean
}

// Enhanced block interface
export interface Block {
  id: string
  type: BlockType
  content?: RichText[] | string
  properties?: HeadingProperties | ListProperties | TodoProperties | CodeProperties | CalloutProperties | ImageProperties | TableProperties | ToggleProperties | Record<string, any>
  children?: Block[]
  parentId?: string
  order: number
  createdAt?: Date
  updatedAt?: Date
}

export interface PageContent {
  pageId: string
  blocks: Block[]
  version: number
  createdAt: Date
  updatedAt: Date
}

// Database types
export type DatabaseViewType = 'TABLE' | 'BOARD' | 'LIST' | 'CALENDAR' | 'GALLERY'

export type DatabasePropertyType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multiSelect' 
  | 'date' 
  | 'checkbox' 
  | 'url' 
  | 'email' 
  | 'phone' 
  | 'formula' 
  | 'relation' 
  | 'rollup'
  | 'createdTime'
  | 'createdBy'
  | 'lastEditedTime'
  | 'lastEditedBy'

export interface SelectOption {
  id: string
  name: string
  color: string
}

export interface DatabaseProperty {
  id: string
  name: string
  type: DatabasePropertyType
  options?: {
    // Select and MultiSelect
    options?: SelectOption[]
    // Number
    numberFormat?: 'number' | 'currency' | 'percent'
    currency?: string
    precision?: number
    // Date
    dateFormat?: 'MMM DD, YYYY' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    includeTime?: boolean
    // Formula
    expression?: string
    // Relation
    databaseId?: string
    // Rollup
    relationProperty?: string
    rollupProperty?: string
    function?: 'count' | 'count_values' | 'sum' | 'average' | 'min' | 'max' | 'range'
    // Phone
    phoneFormat?: 'international' | 'national'
  }
}

export interface DatabaseFilter {
  id: string
  property: string
  condition: string
  value: any
  type: 'and' | 'or'
}

export interface DatabaseSort {
  property: string
  direction: 'asc' | 'desc'
}

export interface DatabaseView {
  id: string
  name: string
  type: DatabaseViewType
  filters: DatabaseFilter[]
  sorts: DatabaseSort[]
  groupBy?: string
  properties: {
    [key: string]: {
      visible: boolean
      width?: number
      order: number
    }
  }
  config: {
    // Board view
    groupByProperty?: string
    showEmptyGroups?: boolean
    // Calendar view
    dateProperty?: string
    // Gallery view
    cardSize?: 'small' | 'medium' | 'large'
    cardPreview?: string
    showProperties?: string[]
    // Table view
    wrap?: boolean
  }
}

export interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  cover?: string
  properties: DatabaseProperty[]
  views: DatabaseView[]
  defaultView?: string
  workspaceId: string
  pageId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseRow {
  id: string
  databaseId: string
  properties: Record<string, any>
  order: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastEditedBy: string
  lastEditedTime: Date
}

// Database property value types
export type PropertyValue = 
  | { type: 'text'; text: string }
  | { type: 'number'; number: number | null }
  | { type: 'select'; select: SelectOption | null }
  | { type: 'multiSelect'; multiSelect: SelectOption[] }
  | { type: 'date'; date: { start: string; end?: string; includeTime: boolean } | null }
  | { type: 'checkbox'; checkbox: boolean }
  | { type: 'url'; url: string | null }
  | { type: 'email'; email: string | null }
  | { type: 'phone'; phone: string | null }
  | { type: 'formula'; formula: any }
  | { type: 'relation'; relation: string[] }
  | { type: 'rollup'; rollup: any }
  | { type: 'createdTime'; createdTime: string }
  | { type: 'createdBy'; createdBy: string }
  | { type: 'lastEditedTime'; lastEditedTime: string }
  | { type: 'lastEditedBy'; lastEditedBy: string }

// Filter conditions by property type
export interface FilterConditions {
  text: 'equals' | 'does_not_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  number: 'equals' | 'does_not_equal' | 'greater_than' | 'less_than' | 'greater_than_or_equal_to' | 'less_than_or_equal_to' | 'is_empty' | 'is_not_empty'
  select: 'equals' | 'does_not_equal' | 'is_empty' | 'is_not_empty'
  multiSelect: 'contains' | 'does_not_contain' | 'is_empty' | 'is_not_empty'
  date: 'equals' | 'before' | 'after' | 'on_or_before' | 'on_or_after' | 'is_empty' | 'is_not_empty' | 'past_week' | 'past_month' | 'past_year' | 'next_week' | 'next_month' | 'next_year'
  checkbox: 'equals' | 'does_not_equal'
  url: 'equals' | 'does_not_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  email: 'equals' | 'does_not_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
  phone: 'equals' | 'does_not_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
}

// Permission types
export type PermissionLevel = 'view' | 'comment' | 'edit' | 'full_access'
export type PermissionType = 'public' | 'private' | 'shared'

export interface Permission {
  id: string
  type: PermissionType
  level: PermissionLevel
  userId?: string
  pageId: string
  createdAt: Date
  updatedAt: Date
}

// Activity types
export type ActivityType = 
  | 'page_created'
  | 'page_updated'
  | 'page_deleted'
  | 'page_restored'
  | 'page_published'
  | 'page_unpublished'
  | 'comment_added'
  | 'comment_resolved'
  | 'member_joined'
  | 'member_left'
  | 'permission_changed'

export interface Activity {
  id: string
  type: ActivityType
  description: string
  metadata?: any
  userId: string
  pageId?: string
  createdAt: Date
}

// Comment types
export interface Comment {
  id: string
  content: string
  resolved: boolean
  pageId: string
  authorId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  author?: User
  replies?: Comment[]
}

// Editor state types
export interface EditorState {
  blocks: Block[]
  selectedBlockId?: string
  isLoading: boolean
  lastSaved?: Date
}

export interface SlashCommand {
  type: BlockType
  label: string
  description: string
  icon: string
  keywords: string[]
}

// Editor action types
export type EditorAction = 
  | { type: 'SET_BLOCKS'; payload: Block[] }
  | { type: 'ADD_BLOCK'; payload: { block: Block; index: number } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'MOVE_BLOCK'; payload: { id: string; newIndex: number } }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }

// Page tree types for sidebar
export interface PageTreeNode extends Page {
  children: PageTreeNode[]
  depth: number
  hasChildren: boolean
}

export interface PageTreeMeta {
  totalPages: number
  maxDepth: number
  favoritePages: string[]
  recentPages: RecentPage[]
}

export interface RecentPage {
  pageId: string
  title: string
  icon?: string
  workspaceId: string
  lastAccessedAt: Date
}

export interface PageMoveOperation {
  pageId: string
  newParentId?: string
  newOrder: number
  oldParentId?: string
  oldOrder: number
}

// Sidebar state types
export interface SidebarState {
  isOpen: boolean
  width: number
  expandedPageIds: Set<string>
  selectedPageId?: string
  searchQuery: string
  showArchived: boolean
  favoritePages: Set<string>
}

// Search types
export interface SearchResult {
  id: string
  type: 'page' | 'block'
  title: string
  content?: string
  icon?: string
  workspaceId: string
  pageId: string
  blockId?: string
  highlights: string[]
  score: number
}

export interface SearchFilters {
  type?: 'page' | 'block' | 'all'
  workspaceId?: string
  authorId?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// Template types
export interface PageTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'personal' | 'team' | 'education' | 'engineering'
  blocks: Block[]
  isBuiltIn: boolean
}

export interface NewPageOptions {
  title?: string
  icon?: string
  parentId?: string
  templateId?: string
  workspaceId: string
}