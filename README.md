# SnapDocs

<div align="center">
  <h3>A modern, open-source collaborative document workspace</h3>
  <p>Built with Next.js, PostgreSQL, MongoDB, and real-time collaboration</p>
  
</div>

## Overview

SnapDocs is a feature-rich, open-source alternative to Notion built with modern web technologies. It provides a powerful block-based editor, real-time collaboration, and flexible database views - all while being completely self-hostable and customizable.

## 📸 Screenshots

<div align="center">
  <img src="screenshots/pages.png" alt="SnapDocs Pages Interface" width="100%" />
  <p><i>Clean and intuitive page editor with rich text formatting</i></p>
  
  <br/>
  
  <img src="screenshots/settings.png" alt="SnapDocs Settings" width="100%" />
  <p><i>Comprehensive settings panel for customization</i></p>
</div>

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

### Additional Features
- **Search**: Full-text search across all content
- **Comments**: Inline comments and discussions
- **Version History**: Track changes and restore previous versions
- **Permissions**: Granular access control
- **Dark Mode**: Built-in theme support

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose

### Installation

## 🐳 Docker Setup

Start all infrastructure services with default configurations:

```bash
# Start PostgreSQL, MongoDB, Redis, and MinIO
docker-compose --profile production up -d

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

### Configuring Environment Variables

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
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🗺 Roadmap

- [ ] Advanced formulas and calculations
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

<div align="center">
  <p>If you find this project useful, please consider giving it a ⭐</p>
</div>