# 🐳 Docker Guide for Picture Store API

This guide explains how to containerize and run the Picture Store API using Docker.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)
- Basic understanding of Docker concepts

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd omadocker

# Copy environment template
cp .env.example .env

# Edit .env with your settings (especially JWT_SECRET)
# nano .env

# Build and start the container
docker-compose up --build

# The API will be available at http://localhost:3001
```

### Option 2: Manual Docker Build

```bash
# Build the image
docker build -t picture-store-api .

# Run the container
docker run -p 3001:3001 --env-file .env picture-store-api
```

## 🔧 Configuration

### Environment Variables

The container uses these environment variables:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your_secure_64_character_jwt_secret
MONGODB_URI=mongodb://localhost:27017/picturestore
```

### Volume Mounts

The Docker setup includes persistent volumes for:

- `./data:/app/data` - Local database files
- `./uploads:/app/uploads` - Uploaded images

## 🏗️ Docker Architecture

### Multi-stage Build

The Dockerfile uses a multi-stage build:

1. **Builder Stage**: Compiles TypeScript to JavaScript
2. **Production Stage**: Creates optimized runtime image

### Security Features

- Non-root user (`nodejs`)
- Minimal Alpine Linux base image
- Health checks included
- Only production dependencies

### Health Checks

The container includes health checks that verify:
- API responds on `/health` endpoint
- Service is running correctly
- Automatic restart on failure

## 📊 Container Management

### View Logs
```bash
# View real-time logs
docker-compose logs -f picture-store-api

# View last 100 lines
docker-compose logs --tail=100 picture-store-api
```

### Stop/Start Services
```bash
# Stop all services
docker-compose down

# Start services in background
docker-compose up -d

# Restart a specific service
docker-compose restart picture-store-api
```

### Update Container
```bash
# Rebuild and restart
docker-compose up --build -d
```

## 🗄️ Database Options

### Option A: File-based Storage (Default)
The container automatically uses local file storage in the `data/` directory.

### Option B: External MongoDB
Set `MONGODB_URI` in your `.env` file to connect to external MongoDB:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Option C: Containerized MongoDB
Uncomment the MongoDB service in `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:6-alpine
  container_name: picture-store-mongo
  ports:
    - "27017:27017"
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=password123
  volumes:
    - mongodb_data:/data/db
```

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check container logs
docker-compose logs picture-store-api

# Check if port is already in use
netstat -tulpn | grep :3001

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Health Check Failures
```bash
# Check health status
docker-compose ps

# Test health endpoint manually
curl http://localhost:3001/health

# Check container resources
docker stats picture-store-backend
```

### File Permission Issues
```bash
# Fix ownership of data directories
sudo chown -R 1001:1001 data/ uploads/
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Use production environment
export NODE_ENV=production

# Set secure JWT secret
export JWT_SECRET=$(openssl rand -hex 32)

# Use production MongoDB
export MONGODB_URI=mongodb+srv://...
```

### Resource Limits
Add resource limits to `docker-compose.yml`:

```yaml
services:
  picture-store-api:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Reverse Proxy
Use nginx or similar for HTTPS and load balancing:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📈 Monitoring

### Container Metrics
```bash
# View resource usage
docker stats picture-store-backend

# View container info
docker inspect picture-store-backend
```

### Application Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# Export logs to file
docker-compose logs > app.log
```

## 🔒 Security Best Practices

1. **Use specific image tags** instead of `latest`
2. **Scan images for vulnerabilities** regularly
3. **Keep base images updated**
4. **Use secrets management** for sensitive data
5. **Enable Docker security features**
6. **Monitor container behavior**

## 🆘 Common Issues

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Out of Disk Space
```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Memory Issues
```bash
# Check container memory usage
docker stats --no-stream

# Increase Docker memory limit in Docker Desktop
```

---

For more help, check the main [README.md](../README.md) or create an issue in the repository.
