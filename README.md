# 📝 SnapDocs - A Modern, Open-Source Document Workspace

<div align="center">
  <img src="screenshots/pages.png" alt="SnapDocs Editor" width="100%" />
  
  <h3>🚀 A Modern, Open-Source Document Workspace</h3>
  
  <p>
    <strong>Build your second brain with a powerful block-based editor and real-time collaboration</strong>
  </p>
  
  <p>
    <strong>⚠️ Beta Status: This project is under active development. Features may change.</strong>
  </p>
  
  <p>
    <a href="https://github.com/BytesCraftIO/snapdocs/stargazers"><img src="https://img.shields.io/github/stars/BytesCraftIO/snapdocs?style=flat-square&logo=github&color=yellow" alt="GitHub stars"></a>
    <a href="https://github.com/BytesCraftIO/snapdocs/network/members"><img src="https://img.shields.io/github/forks/BytesCraftIO/snapdocs?style=flat-square&logo=github" alt="GitHub forks"></a>
    <a href="https://github.com/BytesCraftIO/snapdocs/issues"><img src="https://img.shields.io/github/issues/BytesCraftIO/snapdocs?style=flat-square&logo=github" alt="GitHub issues"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/BytesCraftIO/snapdocs?style=flat-square" alt="License"></a>
    <a href="https://hub.docker.com/r/BytesCraftIO/snapdocs"><img src="https://img.shields.io/docker/pulls/bytescraftio/snapdocs?style=flat-square&logo=docker" alt="Docker Pulls"></a>
  </p>
  
  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-docker-deployment">Docker</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## 🎯 What is SnapDocs?

SnapDocs is a **self-hostable, open-source document workspace ** that empowers teams and individuals to create, organize, and collaborate on documents with ease. Built with modern web technologies, it offers a seamless experience for managing your knowledge base, notes, and documentation.

### Why SnapDocs?

- 🔒 **Full Data Ownership** - Host on your infrastructure, keep your data private
- 🎨 **Modern & Clean UI** - Beautiful interface built with shadcn/ui
- ⚡ **Lightning Fast** - Optimized performance with Next.js 14
- 🔧 **Highly Customizable** - Open source and extensible
- 🐳 **Easy Deployment** - One-command Docker setup

## ✨ Features

### 📄 **Rich Block Editor**
- **Multiple Block Types** - Text, headings, lists, todos, code blocks, quotes, and more
- **Drag & Drop** - Effortlessly reorganize content by dragging blocks
- **Slash Commands** - Quick block insertion with `/` command menu
- **Nested Pages** - Create unlimited page hierarchies
- **Rich Text Formatting** - Bold, italic, underline, and more

### 👥 **Real-Time Collaboration** 
- **Live Presence** - See who's viewing and editing in real-time
- **Instant Sync** - Changes update across all users immediately
- **User Avatars** - Visual indicators showing active collaborators
- **@Mentions** - Tag team members with notifications
- **Activity Notifications** - Get notified when mentioned or when pages are updated

### 🏢 **Workspace Management**
- **Multiple Workspaces** - Organize content into separate workspaces
- **Member Management** - Invite team members and manage permissions
- **Page Organization** - Sidebar navigation with nested page structure
- **Favorites** - Quick access to important pages
- **Database Views** - Create structured databases within pages with table views
- **Custom Properties** - Add custom fields to database entries

### 🎨 **User Experience**
- **Search** - Quick search across all your content
- **Settings Panel** - Customize your workspace preferences
- **Responsive Design** - Works seamlessly on desktop and tablet

## 📸 Screenshots

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="screenshots/pages.png" alt="Editor Interface" />
        <p align="center"><i>Rich Block Editor with Real-time Collaboration</i></p>
      </td>
      <td width="50%">
        <img src="screenshots/settings.png" alt="Settings Panel" />
        <p align="center"><i>Comprehensive Settings & Customization</i></p>
      </td>
    </tr>
  </table>
</div>

## 🚀 Quick Start

Get SnapDocs running in under 5 minutes!

### Prerequisites

- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Git](https://git-scm.com/downloads)
- [Node.js 18+](https://nodejs.org/) (for local development)

### 🐳 Docker Installation (Recommended)

```bash
# Clone the repository
mkdir snapdocs && cd snapdocs
curl https://raw.githubusercontent.com/BytesCraftIO/snapdocs/refs/heads/main/docker-compose.yml -o docker-compose.yml

# Start all services with one command
docker-compose --profile production up -d

# Access SnapDocs at http://localhost:3000
```

That's it! SnapDocs is now running with all required services.

### 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/BytesCraftIO/snapdocs.git
cd snapdocs

# Install dependencies
pnpm install

# Start infrastructure services
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev

# Visit http://localhost:3000
```

## 🛠 Tech Stack

<div align="center">
  <table>
    <tr>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
        <br>Next.js 14
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
        <br>React 19
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
        <br>TypeScript
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
        <br>Tailwind CSS
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=postgresql" width="48" height="48" alt="PostgreSQL" />
        <br>PostgreSQL
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=mongodb" width="48" height="48" alt="MongoDB" />
        <br>MongoDB
      </td>
    </tr>
    <tr>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=redis" width="48" height="48" alt="Redis" />
        <br>Redis
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=prisma" width="48" height="48" alt="Prisma" />
        <br>Prisma
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=docker" width="48" height="48" alt="Docker" />
        <br>Docker
      </td>
      <td align="center" width="96">
        <img src="" width="48" height="48" alt="Socket.io" />
        <br>Socket.io
      </td>
      <td align="center" width="96">
        <img src="https://avatars.githubusercontent.com/u/139895814?s=48&v=4" width="48" height="48" alt="shadcn/ui" />
        <br>shadcn/ui
      </td>
      <td align="center" width="96">
        <img src="" width="48" height="48" alt="MinIO" />
        <br>MinIO S3
      </td>
    </tr>
  </table>
</div>

### Architecture Highlights

- **Frontend**: Next.js 14 App Router, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (built on Radix UI), Lucide Icons
- **Editor**: Custom block editor with drag-and-drop support
- **Databases**: PostgreSQL (metadata) + MongoDB (document content)
- **Real-time**: Socket.io for live collaboration
- **Authentication**: NextAuth.js with secure sessions
- **File Storage**: MinIO (S3-compatible object storage)
- **Caching**: Redis for performance optimization

## 🐳 Docker Deployment

### One-Command Setup

```bash
# Production deployment with all services
docker-compose --profile production up -d
```

This starts:
- ✅ PostgreSQL database
- ✅ MongoDB for document storage  
- ✅ Redis cache
- ✅ MinIO for file uploads
- ✅ SnapDocs application

### Environment Variables

Create a `.env` file for production:

```env
# Database
POSTGRES_PASSWORD=secure_password
MONGO_ROOT_PASSWORD=secure_password

# Authentication  
NEXTAUTH_SECRET=generate-a-secret-key

# Optional
REDIS_PASSWORD=optional_redis_password
S3_ACCESS_KEY=custom_minio_key
S3_SECRET_KEY=custom_minio_secret
```

### Docker Hub

Pull the pre-built image:

```bash
docker pull bytescraftio/snapdocs:latest
```

## 🤝 Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements, we welcome all help.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## 📝 Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/snapdocs` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:pass@localhost:27017/snapdocs` |
| `NEXTAUTH_SECRET` | Auth encryption secret | `your-secret-key-here` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

### Optional Services

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis cache connection | `redis://localhost:6379` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |

## 🗺️ Roadmap

- [x] **Database Views** - Table views within pages
- [x] **Mentions & Notifications** - Tag team members and get notified
- [ ] **Mobile Apps** - iOS and Android applications
- [ ] **API Access** - REST API for third-party integrations
- [ ] **Advanced Permissions** - Granular access control
- [ ] **Additional Database Views** - Kanban, Calendar, Gallery views
- [ ] **Templates** - Pre-built page templates
- [ ] **Webhooks** - Integration with external services
- [ ] **Export Options** - PDF, Markdown, HTML export
- [ ] **Plugin System** - Extensible architecture

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Block editor powered by [BlockNote](https://blocknote.dev)

## 💬 Community & Support

- 🐛 [Report Issues](https://github.com/BytesCraftIO/snapdocs/issues)
- 💡 [Request Features](https://github.com/BytesCraftIO/snapdocs/discussions)
- 📖 [Documentation](https://github.com/BytesCraftIO/snapdocs/wiki)
- 🌟 [Star on GitHub](https://github.com/BytesCraftIO/snapdocs)

---

<div align="center">
  <strong>Built with ❤️ by the SnapDocs Community</strong>
  
  <p>If you find SnapDocs useful, please consider giving it a ⭐ on GitHub!</p>
  
  <a href="https://github.com/BytesCraftIO/snapdocs/stargazers">
    <img src="https://img.shields.io/github/stars/BytesCraftIO/snapdocs?style=social" alt="Star on GitHub">
  </a>
</div>