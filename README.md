# SnapDocs - Open Source Notion Clone

<div align="center">
  <h3>A modern, open-source collaborative document workspace</h3>
  <p>Built with Next.js, PostgreSQL, MongoDB, and real-time collaboration</p>
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>
</div>

## Overview

SnapDocs is a feature-rich, open-source alternative to Notion built with modern web technologies. It provides a powerful block-based editor, real-time collaboration, and flexible database views - all while being completely self-hostable and customizable.

## ✨ Features

### Block-Based Editor
- **Rich Content Blocks**: Text, headings, lists, code blocks, images, and more
- **Drag & Drop**: Intuitive block reordering and nesting
- **Slash Commands**: Quick block insertion with `/` menu
- **Markdown Support**: Write in markdown and see it transform
- **Nested Pages**: Create infinite hierarchies of documents

### Real-Time Collaboration
- **Live Cursors**: See where others are working
- **Instant Updates**: Changes sync across all users immediately
- **Presence Indicators**: Know who's viewing and editing
- **Conflict Resolution**: Automatic operational transformation

### Database Views
- **Table View**: Spreadsheet-like data management
- **Board View**: Kanban-style project management
- **Calendar View**: Date-based organization
- **Gallery View**: Visual card layout
- **List View**: Simple, clean lists

### Additional Features
- **Templates**: Reusable page and database templates
- **Search**: Full-text search across all content
- **Comments**: Inline comments and discussions
- **Version History**: Track changes and restore previous versions
- **Permissions**: Granular access control
- **Dark Mode**: Built-in theme support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
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

3. **Start all infrastructure services with one command**
```bash
docker-compose up -d
```

This starts PostgreSQL, MongoDB, Redis, and MinIO. All services are configured with default passwords for development.

4. **Set up environment variables**
```bash
cp .env.example .env.local
```

5. **Initialize the database**
```bash
npm run db:migrate
npm run db:generate
```

6. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` and start building!

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI), Lucide Icons
- **Editor**: BlockNote, Lexical, DnD Kit
- **Backend**: Next.js API Routes, Prisma ORM
- **Databases**: PostgreSQL (metadata), MongoDB (content)
- **Real-time**: Socket.io with operational transformation
- **Authentication**: NextAuth.js
- **File Storage**: MinIO (S3-compatible)
- **Caching**: Redis
- **Development**: Docker Compose, ESLint, Prettier

## 📁 Project Structure

```
snapdocs/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   └── (main)/         # Application pages
├── components/         # React components
│   ├── editor/        # Block editor components
│   ├── database/      # Database view components
│   └── ui/           # Base UI components
├── lib/               # Utilities and services
│   ├── db/           # Database connections
│   ├── services/     # Business logic
│   └── socket/       # Real-time collaboration
├── prisma/            # Database schema
├── types/             # TypeScript definitions
└── docker-compose.yml # Local development services
```

## 🐳 Docker Setup

### Development Mode

Start all infrastructure services with default configurations:

```bash
# Start PostgreSQL, MongoDB, Redis, and MinIO
docker-compose up -d

# View logs for all services
docker-compose logs -f

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

**Default Service Ports:**
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

### Production Mode

For production deployment with the Next.js app included:

```bash
# Create production environment file
cat > .env.production <<EOF
POSTGRES_PASSWORD=secure_postgres_pass
MONGO_ROOT_PASSWORD=secure_mongo_pass
REDIS_PASSWORD=secure_redis_pass
S3_ACCESS_KEY=secure_access_key
S3_SECRET_KEY=secure_secret_key
NEXTAUTH_SECRET=your_nextauth_secret_here
EOF

# Build and start everything including the app
docker-compose --profile production up -d

# This starts:
# - All infrastructure services
# - Next.js application (port 3000)
```

### Environment Configuration

The Docker setup supports environment variables with sensible defaults for development. You can override any value using a `.env` file in the project root.

**Configurable Variables:**
```env
# Database Passwords (default: 'password' for dev)
POSTGRES_PASSWORD=password
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
REDIS_PASSWORD=            # Empty by default (no auth)

# Service Ports
POSTGRES_PORT=5432
MONGODB_PORT=27017
REDIS_PORT=6379
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001

# MinIO/S3 Configuration
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=snapdocs

# Application (production profile only)
APP_PORT=3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Docker Commands Reference

```bash
# Development
docker-compose up -d                     # Start core services

# Production
docker-compose --profile production up -d # Full stack with app

# Management
docker-compose ps                        # List running services
docker-compose logs -f [service]        # View logs
docker-compose restart [service]        # Restart a service
docker-compose exec [service] sh        # Shell into container

# Cleanup
docker-compose down                     # Stop services
docker-compose down -v                  # Stop and remove volumes
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Database (matches docker-compose defaults)
DATABASE_URL="postgresql://postgres:password@localhost:5432/snapdocs"
MONGODB_URI="mongodb://admin:password@localhost:27017/snapdocs?authSource=admin"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis
REDIS_URL="redis://localhost:6379"

# File Storage (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="snapdocs"
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run format       # Format with Prettier
npm run test         # Run tests

# Database commands
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed sample data
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🗺 Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] Offline support with sync
- [annon formulas and calculations
- [ ] API for third-party integrations
- [ ] Plugin system for extensibility
- [ ] AI-powered writing assistance
- [ ] Advanced permissions and sharing
- [ ] Export to various formats (PDF, Markdown, HTML)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Notion](https://notion.so)
- Built with [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Block editor powered by [BlockNote](https://blocknote.dev)

## 💬 Community

- [GitHub Discussions](https://github.com/yourusername/snapdocs/discussions) - Ask questions and share ideas
- [Discord Server](https://discord.gg/snapdocs) - Real-time chat with the community
- [Twitter](https://twitter.com/snapdocs) - Follow for updates

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/snapdocs/issues) to report bugs or request features.

## 🔒 Security

For security issues, please email security@snapdocs.example.com instead of using the issue tracker.

## 📊 Status

![GitHub stars](https://img.shields.io/github/stars/yourusername/snapdocs)
![GitHub forks](https://img.shields.io/github/forks/yourusername/snapdocs)
![GitHub issues](https://img.shields.io/github/issues/yourusername/snapdocs)
![GitHub license](https://img.shields.io/github/license/yourusername/snapdocs)

---

<div align="center">
  Made with ❤️ by the SnapDocs Community
  
  <p>If you find this project useful, please consider giving it a ⭐</p>
</div>