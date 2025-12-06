# FileServer - Docker Deployment Guide

## Quick Start with Docker

The easiest way to run FileServer on any Linux system.

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+ (optional)

### Method 1: Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

Access at: `http://localhost:30815`

### Method 2: Docker Run

```bash
# Build the image
docker build -t fileserver .

# Run the container
docker run -d \
  --name fileserver \
  -p 30815:30815 \
  -v fileserver_data:/app/storage \
  --restart unless-stopped \
  fileserver

# View logs
docker logs -f fileserver

# Stop
docker stop fileserver

# Remove
docker rm fileserver
```

## Configuration

### Environment Variables

```bash
docker run -d \
  --name fileserver \
  -p 30815:30815 \
  -e STORAGE_ROOT=/app/storage \
  -e MAX_FILE_SIZE_MB=500 \
  -v fileserver_data:/app/storage \
  fileserver
```

### Custom Port

```bash
# Run on port 8080 instead of 30815
docker run -d \
  --name fileserver \
  -p 8080:30815 \
  -v fileserver_data:/app/storage \
  fileserver
```

### Persistent Data

Data is stored in a Docker volume by default. To use a host directory:

```bash
docker run -d \
  --name fileserver \
  -p 30815:30815 \
  -v /path/on/host:/app/storage \
  fileserver
```

## Docker Compose Configuration

### Basic Setup

```yaml
version: '3.8'

services:
  fileserver:
    build: .
    ports:
      - "30815:30815"
    volumes:
      - fileserver_data:/app/storage
    restart: unless-stopped

volumes:
  fileserver_data:
```

### With Custom Configuration

```yaml
version: '3.8'

services:
  fileserver:
    build: .
    container_name: fileserver
    ports:
      - "30815:30815"
    volumes:
      - ./data:/app/storage
    environment:
      - STORAGE_ROOT=/app/storage
      - MAX_FILE_SIZE_MB=1000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:30815"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  fileserver_data:
```

### Behind Nginx Proxy

```yaml
version: '3.8'

services:
  fileserver:
    build: .
    expose:
      - "30815"
    volumes:
      - fileserver_data:/app/storage
    restart: unless-stopped
    networks:
      - web

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - fileserver
    networks:
      - web

networks:
  web:

volumes:
  fileserver_data:
```

## Building the Image

### From Source

```bash
# Clone the repository
git clone https://github.com/qtrewq/fileserver.git
cd fileserver

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Build Docker image
docker build -t fileserver:latest .
```

### Multi-stage Build (Smaller Image)

Create `Dockerfile.multistage`:

```dockerfile
# Build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Runtime stage
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/dist ./frontend/dist/
COPY launcher.py .

RUN mkdir -p /app/storage

ENV STORAGE_ROOT=/app/storage
ENV PYTHONUNBUFFERED=1

EXPOSE 30815

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "30815"]
```

Build:
```bash
docker build -f Dockerfile.multistage -t fileserver:latest .
```

## Management

### View Logs

```bash
# Follow logs
docker logs -f fileserver

# Last 100 lines
docker logs --tail 100 fileserver

# With timestamps
docker logs -t fileserver
```

### Execute Commands

```bash
# Open shell in container
docker exec -it fileserver /bin/bash

# Run Python command
docker exec fileserver python -c "print('Hello')"
```

### Backup Data

```bash
# Backup volume to tar file
docker run --rm \
  -v fileserver_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/fileserver-backup.tar.gz -C /data .

# Restore from backup
docker run --rm \
  -v fileserver_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/fileserver-backup.tar.gz -C /data
```

### Update

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### With Traefik

```yaml
version: '3.8'

services:
  fileserver:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fileserver.rule=Host(`files.example.com`)"
      - "traefik.http.routers.fileserver.entrypoints=websecure"
      - "traefik.http.routers.fileserver.tls.certresolver=letsencrypt"
      - "traefik.http.services.fileserver.loadbalancer.server.port=30815"
    volumes:
      - fileserver_data:/app/storage
    restart: unless-stopped
    networks:
      - web

networks:
  web:
    external: true

volumes:
  fileserver_data:
```

### Resource Limits

```yaml
services:
  fileserver:
    build: .
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs fileserver

# Inspect container
docker inspect fileserver

# Check if port is in use
sudo lsof -i :30815
```

### Permission Issues

```bash
# Fix volume permissions
docker exec -u root fileserver chown -R 1000:1000 /app/storage
```

### Database Locked

```bash
# Stop container
docker stop fileserver

# Remove lock file
docker exec fileserver rm /app/storage/fileserver.db-journal

# Start container
docker start fileserver
```

## Security

### Run as Non-Root

Add to Dockerfile:
```dockerfile
RUN useradd -m -u 1000 fileserver
USER fileserver
```

### Read-Only Root Filesystem

```yaml
services:
  fileserver:
    build: .
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - fileserver_data:/app/storage
```

## Default Credentials

- **Username**: `admin`
- **Password**: `adminpassword`

⚠️ Change immediately after first login!

## Support

For Docker-specific issues:
- Check logs: `docker logs fileserver`
- Verify image: `docker images | grep fileserver`
- Test connectivity: `docker exec fileserver curl localhost:30815`
