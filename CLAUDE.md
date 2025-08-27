# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapDocs is a modern collaborative document workspace built with:
- **Next.js 14** (App Router) for the frontend and API
- **PostgreSQL** for structured data (users, workspaces, page metadata)
- **MongoDB** for document storage (page content blocks)
- **Prisma** as the ORM for PostgreSQL
- **shadcn/ui** for UI components
- **Socket.io** for real-time collaboration
- **Docker Compose** for local development services

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Start Docker services (PostgreSQL, MongoDB, Redis, MinIO)
docker-compose up -d

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start development server with Socket.io
npm run dev

# Open Prisma Studio
npm run db:studio
```

### Testing & Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Database Management
```bash
# Run migrations
npm run db:migrate

# Push schema changes (skip migrations)
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio GUI
npm run db:studio
```

### Docker Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v

# View logs
docker-compose logs -f [service-name]
```

## Architecture Overview

### Hybrid Database Architecture

**PostgreSQL** (via Prisma) stores:
- User accounts and authentication
- Workspace metadata
- Page hierarchy and metadata
- Permissions and sharing
- Comments and activity logs
- Database schemas

**MongoDB** stores:
- Page content (blocks array)
- Version history
- Templates

**Key Pattern**: Each page has metadata in PostgreSQL (`pages` table) and content in MongoDB (`pageContent` collection), linked by `pageId`.

### Directory Structure
- `app/` - Next.js app router pages and API routes
- `components/` - React components
  - `editor/` - Block-based editor components
  - `database/` - Database view components
  - `sidebar/` - Navigation components
  - `ui/` - shadcn/ui base components
- `lib/` - Utilities and helpers
  - `db/` - Database connection utilities
  - `services/` - Business logic services
  - `socket/` - Real-time collaboration
  - `collaboration/` - Operational transformation
- `prisma/` - Database schema and migrations
- `types/` - TypeScript type definitions

### Block-Based Editor System

Content is stored as an array of blocks:
```typescript
interface Block {
  id: string
  type: BlockType  // 'paragraph', 'heading1', 'bulletList', etc.
  content?: RichText[] | string
  properties?: Record<string, any>
  children?: Block[]
  order: number
}
```

Key files:
- `components/editor/SnapDocsEditor.tsx` - Main editor with drag-and-drop
- `components/editor/blocks/` - Individual block implementations
- `lib/services/page-content.ts` - MongoDB content service

### Real-Time Collaboration

Implemented via Socket.io with operational transformation:
- `server.js` - Custom Socket.io server
- `lib/socket/client.tsx` - Client socket provider
- `lib/collaboration/ot.ts` - Conflict resolution

Two-tier sync approach:
1. **Immediate**: Individual block updates via WebSocket
2. **Periodic**: Full document sync every 10 seconds

### API Routes Pattern

All API routes follow RESTful conventions:
- `GET /api/pages` - List pages
- `POST /api/pages` - Create page
- `GET /api/pages/[id]` - Get page
- `PUT /api/pages/[id]` - Update page
- `DELETE /api/pages/[id]` - Delete page

### Database Schema

See `prisma/schema.prisma` for the complete schema. Key models:
- `User` - User accounts
- `Workspace` - Team workspaces
- `Page` - Page metadata
- `Database` - SnapDocs databases
- `Permission` - Access control

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `MONGODB_URI` - MongoDB connection
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - Application URL
- `REDIS_URL` - Redis connection
- `S3_*` - MinIO/S3 configuration

## Development Tips

### Adding New Block Types
1. Add type to `BlockType` union in `types/index.ts`
2. Create block component in `components/editor/blocks/`
3. Update `BlockV2.tsx` to handle rendering
4. Add to slash menu in `SlashMenu.tsx`

### Database Operations
```typescript
// Use Prisma for metadata
const page = await prisma.page.create({
  data: { title, workspaceId, authorId }
})

// Use MongoDB for content
const db = await getMongoDb()
await db.collection('pageContent').insertOne({
  pageId: page.id,
  content: { blocks: [] },
  version: 1
})
```

### Query Pages with Content
```typescript
// Get metadata from PostgreSQL
const pages = await prisma.page.findMany({
  where: { workspaceId }
})

// Get content from MongoDB
const db = await getMongoDb()
const contents = await db.collection('pageContent')
  .find({ pageId: { $in: pages.map(p => p.id) } })
  .toArray()
```

### Adding UI Components
```bash
# Use shadcn/ui CLI to add components
npx shadcn@latest add [component-name]
```

## Important Patterns

### Data Consistency
- PostgreSQL for ACID properties on critical metadata
- MongoDB for flexible document storage
- Optimistic UI updates with rollback on conflicts
- Operational transformation for concurrent edits

### Performance Optimizations
- Debounced real-time updates (100ms typing, 5s persistence)
- Version history with automatic cleanup (50 versions max)
- Socket.io room-based isolation for scalability

### Security Model
- Workspace-based access control
- Row-level security through membership checks
- Consistent permission validation in API routes
- Socket.io rooms isolate page collaboration

### Common API Pattern
All API routes should:
1. Authenticate user with `getCurrentUser()`
2. Validate workspace membership
3. Check specific permissions
4. Perform operation with proper error handling
5. Return consistent response format

## Important Conventions

1. Always use absolute imports with `@/` prefix
2. Components should be client components when they use hooks or browser APIs
3. Keep server components for data fetching and static content
4. Use Prisma transactions for multi-step database operations
5. Always validate workspace membership in API routes
6. Use `pageContentService` for all MongoDB operations
7. Implement proper error boundaries for production readiness