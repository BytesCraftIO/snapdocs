# Docker Hub GitHub Actions Setup

This guide explains how to set up automatic Docker image builds and pushes to Docker Hub using GitHub Actions.

## Prerequisites

1. **Docker Hub Account**: Create an account at [hub.docker.com](https://hub.docker.com)
2. **Docker Hub Repository**: Create a repository named `snapdocs` in your Docker Hub account
3. **Access Token**: Generate a Docker Hub access token for GitHub Actions

## Setup Steps

### 1. Generate Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings** → **Security**
3. Click **New Access Token**
4. Give it a descriptive name like `github-actions`
5. Select **Read, Write, Delete** permissions
6. Click **Generate**
7. **Copy the token immediately** (you won't be able to see it again)

### 2. Configure GitHub Repository Secrets

Go to your GitHub repository and add the following secrets:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

   - **Name**: `DOCKERHUB_USERNAME`  
     **Value**: Your Docker Hub username

   - **Name**: `DOCKERHUB_TOKEN`  
     **Value**: The access token you generated in step 1

### 3. Workflow Triggers

The GitHub Action will automatically run when:

- **Push to main/master**: Builds and pushes with tag `main` or `master`
- **Version tags**: Push a tag like `v1.0.0` to build with semantic versioning
- **Pull Requests**: Builds but doesn't push (for testing)
- **Manual trigger**: Use the "Actions" tab to manually trigger with custom tag

## Usage

### Automatic Builds

Simply push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The image will be available at: `docker.io/YOUR_USERNAME/snapdocs:main`

### Version Releases

Create and push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates multiple tags:
- `YOUR_USERNAME/snapdocs:1.0.0`
- `YOUR_USERNAME/snapdocs:1.0`
- `YOUR_USERNAME/snapdocs:1`
- `YOUR_USERNAME/snapdocs:latest`

### Manual Deployment

1. Go to **Actions** tab in your GitHub repository
2. Select **Docker Build and Push to Docker Hub**
3. Click **Run workflow**
4. Optionally specify a custom tag
5. Click **Run workflow** button

## Docker Image Tags

The workflow creates the following tags based on the trigger:

| Trigger | Tags Created |
|---------|-------------|
| Push to `main` | `main`, `latest` |
| Push to `feature/xyz` | `feature-xyz` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| Pull Request #42 | `pr-42` (build only, no push) |
| Manual with tag `test` | `test` |

## Pulling the Image

Once published, users can pull your image:

```bash
# Latest version
docker pull YOUR_USERNAME/snapdocs:latest

# Specific version
docker pull YOUR_USERNAME/snapdocs:1.0.0

# Main branch (development)
docker pull YOUR_USERNAME/snapdocs:main
```

## Running the Container

```bash
# Quick start with docker-compose
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e MONGODB_URI="your-mongodb-uri" \
  -e NEXTAUTH_SECRET="your-secret" \
  YOUR_USERNAME/snapdocs:latest
```

## Multi-Architecture Support

The workflow builds for both:
- `linux/amd64` (Intel/AMD processors)
- `linux/arm64` (Apple Silicon, ARM servers)

Docker automatically pulls the correct architecture.

## Caching

The workflow uses GitHub Actions cache to speed up builds:
- Docker layers are cached between builds
- Only changed layers are rebuilt
- Significantly faster build times for minor changes

## Troubleshooting

### Build Fails

Check the Actions tab for error logs. Common issues:
- Missing secrets (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
- Docker Hub rate limits
- Dockerfile syntax errors

### Image Not Pushed

- Ensure you're not on a pull request (PRs only build, don't push)
- Verify Docker Hub credentials are correct
- Check if the repository exists on Docker Hub

### Wrong Tags

- Check the branch name or tag format
- Semantic versions must follow `vX.Y.Z` format
- Branch names with `/` are converted to `-` in tags

## Security Notes

- **Never commit secrets** to your repository
- Use GitHub Secrets for sensitive data
- Rotate Docker Hub access tokens periodically
- Consider using DOCKER_CONTENT_TRUST for image signing

## Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build-Push Action](https://github.com/docker/build-push-action)