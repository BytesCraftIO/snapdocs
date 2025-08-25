# SnapDocs

SnapDocs is a modern collaborative document workspace built with Next.js, PostgreSQL, MongoDB, and shadcn/ui. It provides powerful features for creating, organizing, and collaborating on documents with your team.

## 🚀 Features

### Core Features
- **Block-based Editor**: Draggable blocks with multiple content types
- **Rich Text Editing**: Full formatting support with slash commands
- **Nested Pages**: Infinite page hierarchy with breadcrumb navigation
- **Database Views**: Table, Board (Kanban), List, Calendar, Gallery views
- **Real-time Collaboration**: Live cursors and instant updates
- **Templates**: Page and database templates
- **Search**: Full-text search across all content
- **Comments & Mentions**: Inline comments and user mentions
- **Version History**: Track changes and restore previous versions
- **Sharing & Permissions**: Granular access control

### Content Blocks
- Text (paragraph, headings, lists)
- Media (images, videos, files)
- Embeds (code, equations, web bookmarks)
- Databases (inline and full-page)
- Toggles and callouts
- Dividers and columns
- Table of contents

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - UI components built on Radix UI
- **Tailwind CSS** - Styling
- **Lexical** - Rich text editor framework
- **DnD Kit** - Drag and drop
- **Socket.io** - Real-time collaboration
- **React Query** - Data fetching and caching

### Backend
- **Next.js API Routes** - Backend API
- **PostgreSQL** - Primary database for structured data
- **MongoDB** - Document store for page content
- **Prisma** - ORM for PostgreSQL
- **Redis** - Caching and session management
- **MinIO/S3** - File storage

### Authentication & Security
- **NextAuth.js** - Authentication
- **JWT** - Token management
- **bcrypt** - Password hashing

## 📁 Project Structure

```
snapdocs/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (main)/              # Main application
│   │   ├── workspace/       # Workspace pages
│   │   ├── page/           # Page views
│   │   └── settings/       # Settings pages
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── editor/            # Editor components
│   │   ├── blocks/       # Block components
│   │   ├── toolbar/      # Formatting toolbar
│   │   └── slash-menu/   # Slash commands
│   ├── database/         # Database views
│   ├── ui/              # shadcn/ui components
│   └── shared/          # Shared components
├── lib/                  # Utilities and helpers
│   ├── db/              # Database clients
│   ├── api/             # API utilities
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
├── prisma/              # Prisma schema and migrations
├── public/              # Static assets
└── docker/              # Docker configurations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/snapdocs.git
cd snapdocs
```

2. **Install dependencies**
```bash
npm install
```

3. **Start databases with Docker**
```bash
docker-compose up -d
```

4. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/snapdocs"
MONGODB_URI="mongodb://localhost:27017/snapdocs"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# File Storage (MinIO or S3)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="snapdocs"

# Real-time
SOCKET_URL="http://localhost:3000"
```

5. **Run database migrations**
```bash
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

6. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Setup

The project includes Docker Compose configuration for all required services:

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Reset everything (including volumes)
docker-compose down -v
```

Services included:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- MinIO (port 9000/9001)

## 📝 Development

### Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Lint code
npm run lint:fix     # Fix lint issues
npm run format       # Format code
npm run typecheck    # Type checking
```

### shadcn/ui Components

Add new components:
```bash
npx shadcn-ui@latest add [component-name]
```

## 🏗️ Architecture

### Database Design

**PostgreSQL** (Structured Data):
- Users, workspaces, permissions
- Page metadata and hierarchy
- Database schemas and views
- Comments and activities

**MongoDB** (Document Data):
- Page content blocks
- Version history
- Templates

### Key Design Patterns
- **Block-based Architecture**: Content as composable blocks
- **Optimistic UI**: Instant feedback with background sync
- **Event Sourcing**: For collaboration and history
- **CQRS**: Separate read/write models for performance

### API Structure
- RESTful endpoints for CRUD operations
- WebSocket connections for real-time features
- GraphQL endpoint for complex queries (optional)

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS configuration
- SQL injection prevention via Prisma
- XSS protection

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker Production
```bash
docker build -t snapdocs .
docker run -p 3000:3000 snapdocs
```

### Manual Deployment
```bash
npm run build
npm run start
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Component Library](./docs/components.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Notion's collaborative workspace concept
- Built with [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: your-email@example.com

---

**Note**: This is an independent project and not affiliated with any other companies.