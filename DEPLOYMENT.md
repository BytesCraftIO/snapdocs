# SnapDocs Deployment Guide

This guide covers various deployment options for SnapDocs, from simple one-click deployments to complex production setups.

## Table of Contents
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Production Setup](#production-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Quick Start

### One-Click Deployment with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/snapdocs.git
cd snapdocs

# Copy environment variables
cp .env.production.example .env.production

# Edit .env.production with your settings
nano .env.production

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Run database migrations
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

Your application will be available at `http://localhost:3000`

## Docker Deployment

### Building the Docker Image

```bash
# Build for production
docker build -t snapdocs:latest .

# Or build with specific version tag
docker build -t snapdocs:v1.0.0 .

# Multi-platform build (AMD64 and ARM64)
docker buildx build --platform linux/amd64,linux/arm64 -t snapdocs:latest .
```

### Running with Docker

```bash
# Run standalone container
docker run -d \
  --name snapdocs \
  -p 3000:3000 \
  --env-file .env.production \
  snapdocs:latest

# With docker-compose (recommended)
docker-compose -f docker-compose.production.yml up -d
```

### Docker Hub Deployment

```bash
# Tag and push to Docker Hub
docker tag snapdocs:latest yourusername/snapdocs:latest
docker push yourusername/snapdocs:latest

# Pull and run from Docker Hub
docker pull yourusername/snapdocs:latest
docker run -d -p 3000:3000 --env-file .env.production yourusername/snapdocs:latest
```

## Cloud Deployments

### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Click the button above
2. Configure environment variables
3. Deploy

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables from `.env.production.example`

### Deploy to DigitalOcean App Platform

```bash
# Install doctl CLI
brew install doctl

# Create app
doctl apps create --spec .do/app.yaml
```

### Deploy to AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t snapdocs .
docker tag snapdocs:latest $ECR_REGISTRY/snapdocs:latest
docker push $ECR_REGISTRY/snapdocs:latest

# Deploy with ECS
aws ecs update-service --cluster snapdocs-cluster --service snapdocs-service --force-new-deployment
```

### Deploy to Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/snapdocs

# Deploy to Cloud Run
gcloud run deploy snapdocs \
  --image gcr.io/PROJECT_ID/snapdocs \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Deploy to Azure Container Instances

```bash
# Create resource group
az group create --name snapdocs-rg --location eastus

# Create container instance
az container create \
  --resource-group snapdocs-rg \
  --name snapdocs \
  --image yourusername/snapdocs:latest \
  --dns-name-label snapdocs \
  --ports 3000 \
  --environment-variables-file .env.production
```

## Production Setup

### Prerequisites

- Docker and Docker Compose
- Domain name with DNS configured
- SSL certificates (or use Let's Encrypt)
- Minimum 2GB RAM, 2 CPU cores
- 20GB storage

### Step-by-Step Production Deployment

1. **Prepare the server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone and configure**
```bash
# Clone repository
git clone https://github.com/yourusername/snapdocs.git /opt/snapdocs
cd /opt/snapdocs

# Setup environment
cp .env.production.example .env.production
# Edit .env.production with your production values
```

3. **Setup SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt install certbot -y

# Get certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./docker/nginx/ssl/
```

4. **Update nginx configuration**
```bash
# Edit nginx.conf
sed -i 's/your-domain.com/yourdomain.com/g' docker/nginx/nginx.conf
```

5. **Start services**
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Run migrations
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy

# Create first admin user (optional)
docker-compose -f docker-compose.production.yml exec app npm run seed:admin
```

## CI/CD Pipeline

### GitHub Actions Setup

The repository includes GitHub Actions workflows for:
- Continuous Integration (testing, linting, type checking)
- Docker image building and publishing
- Automated deployment to staging/production

To enable:

1. **Set GitHub Secrets**:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Docker Hub access token
   - `PRODUCTION_HOST`: Production server IP/hostname
   - `PRODUCTION_SSH_KEY`: SSH private key for deployment
   - `STAGING_HOST`: Staging server IP/hostname
   - `STAGING_SSH_KEY`: SSH private key for staging

2. **Configure deployment branches**:
   - `main` branch → Production deployment
   - `develop` branch → Staging deployment

3. **Trigger deployment**:
```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main

# Or create a release
git tag v1.0.0
git push origin v1.0.0
```

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
MONGODB_URI=mongodb://user:pass@host:27017/db

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Redis
REDIS_URL=redis://host:6379

# File Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_BUCKET=your-bucket
```

### Optional Variables

```env
# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS=GA-XXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
# Auto-renewal with cron
echo "0 0 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null
```

### Using Custom SSL Certificates

1. Place your certificates in `docker/nginx/ssl/`
2. Update `docker/nginx/nginx.conf` with correct paths
3. Restart nginx container

## Monitoring & Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check all services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f app
```

### Backup Strategy

```bash
# Backup PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U postgres snapdocs > backup-$(date +%Y%m%d).sql

# Backup MongoDB
docker-compose -f docker-compose.production.yml exec mongodb \
  mongodump --db snapdocs --out /backup/

# Backup uploaded files (MinIO/S3)
aws s3 sync s3://snapdocs s3://snapdocs-backup-$(date +%Y%m%d)/
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

### Scaling

For high-traffic deployments:

1. **Horizontal Scaling**:
```yaml
# docker-compose.production.yml
app:
  scale: 3  # Run 3 instances
```

2. **Load Balancing**:
- Use nginx as load balancer (included)
- Or use cloud load balancers (AWS ELB, GCP LB)

3. **Database Scaling**:
- Use managed databases (RDS, Cloud SQL)
- Set up read replicas
- Implement connection pooling

## Troubleshooting

### Common Issues

1. **Port already in use**:
```bash
# Find and kill process using port 3000
sudo lsof -i :3000
sudo kill -9 <PID>
```

2. **Database connection failed**:
```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres mongodb

# Test connection
docker-compose -f docker-compose.production.yml exec app npx prisma db push
```

3. **Out of memory**:
```bash
# Increase Docker memory limit
docker update --memory="4g" snapdocs
```

4. **SSL certificate issues**:
```bash
# Renew certificates
sudo certbot renew --force-renewal

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

## Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- GitHub Issues: [github.com/yourusername/snapdocs/issues](https://github.com/yourusername/snapdocs/issues)
- Documentation: [docs.snapdocs.app](https://docs.snapdocs.app)

## License

SnapDocs is open source software licensed under the MIT license.