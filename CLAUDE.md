# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-featured Notion clone built with:
- **Next.js 14** (App Router) for the frontend and API
- **PostgreSQL** for structured data (users, workspaces, page metadata)
- **MongoDB** for document storage (page content blocks)
- **Prisma** as the ORM for PostgreSQL
- **shadcn/ui** for UI components
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

# Start development server
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

# Run tests (when implemented)
npm run test
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

### Directory Structure
- `app/` - Next.js app router pages and API routes
- `components/` - React components
  - `editor/` - Block-based editor components
  - `database/` - Database view components
  - `ui/` - shadcn/ui base components
- `lib/` - Utilities and helpers
  - `db/` - Database connection utilities
  - `api/` - API client functions
- `prisma/` - Database schema and migrations
- `types/` - TypeScript type definitions

### Data Architecture

**PostgreSQL** (via Prisma) stores:
- User accounts and authentication
- Workspace metadata
- Page hierarchy and metadata
- Permissions and sharing
- Comments and activity logs
- Database schemas

**MongoDB** stores:
- Page content (blocks)
- Version history
- Templates

### Key Patterns

1. **Block-based Editor**: Content is stored as an array of blocks, each with a type and properties
2. **Real-time Updates**: Socket.io for collaboration (to be implemented)
3. **Optimistic UI**: Update UI immediately, sync in background
4. **Permissions**: Row-level security with granular permissions

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
- `Database` - Notion databases
- `Permission` - Access control

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `MONGODB_URI` - MongoDB connection
- `NEXTAUTH_SECRET` - Auth secret
- `REDIS_URL` - Redis connection
- `S3_*` - MinIO/S3 configuration

## Development Tips

1. **Adding new block types**: Update `types/index.ts`, then add rendering logic in `components/editor/Block.tsx`

2. **Database changes**: Edit `prisma/schema.prisma`, then run `npm run db:migrate`

3. **Adding API routes**: Create in `app/api/` following Next.js App Router conventions

4. **UI Components**: Use `npx shadcn-ui@latest add [component]` to add new shadcn components

5. **MongoDB queries**: Use `lib/db/mongodb.ts` to get database connection

## Common Tasks

### Add a new page
```typescript
// Use Prisma for metadata
const page = await prisma.page.create({
  data: { title, workspaceId, authorId }
})

// Use MongoDB for content
const db = await getMongoDb()
await db.collection('pages').insertOne({
  pageId: page.id,
  content: { blocks: [] },
  version: 1
})
```

### Query pages with content
```typescript
// Get metadata from PostgreSQL
const pages = await prisma.page.findMany({
  where: { workspaceId }
})

// Get content from MongoDB
const db = await getMongoDb()
const contents = await db.collection('pages')
  .find({ pageId: { $in: pages.map(p => p.id) } })
  .toArray()
```

## Important Conventions

1. Always use absolute imports with `@/` prefix
2. Components should be client components when they use hooks or browser APIs
3. Keep server components for data fetching and static content
4. Use Prisma transactions for multi-step database operations
5. Implement proper error boundaries for production readiness