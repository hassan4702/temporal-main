# Temporal Order Management Application

This is a containerized order management application built with Temporal for workflow orchestration, featuring a Next.js frontend and Node.js backend with WebSocket support.

## Architecture

The application consists of the following services:

- **Temporal Server**: Workflow orchestration engine
- **PostgreSQL**: Database for Temporal
- **Temporal Web UI**: Web interface for monitoring workflows
- **Backend**: Node.js service running both the Temporal worker and WebSocket server
- **Frontend**: Next.js application for order management

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Clone and navigate to the project directory:**
   ```bash
   cd temporal-main
   ```

2. **Start all services:**
   ```bash
   docker compose up -d
   ```

3. **Access the applications:**
   - **Frontend**: http://localhost:3000
   - **Temporal Web UI**: http://localhost:8088
   - **Backend API**: http://localhost:8081
   - **WebSocket Server**: ws://localhost:8081

## Service Details

### Temporal Services
- **PostgreSQL**: Database for Temporal (port 5432)
- **Temporal Server**: Main workflow engine (port 7233)
- **Temporal Web UI**: Web interface for workflow monitoring (port 8088)

### Application Services
- **Backend**: Runs both the Temporal worker and WebSocket server (port 8081)
- **Frontend**: Next.js application (port 3000)

## Development

### Running in Development Mode
The services are configured with volume mounts for development:
- Code changes in `./backend` and `./frontend` will be reflected immediately
- Node modules are preserved in Docker volumes

### Stopping Services
```bash
docker compose down
```

### Viewing Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f temporal
```

### Rebuilding Services
```bash
# Rebuild all services
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

## Environment Variables

### Backend Environment Variables
- `TEMPORAL_HOST`: Temporal server host (default: temporal)
- `TEMPORAL_PORT`: Temporal server port (default: 7233)
- `TEMPORAL_NAMESPACE`: Temporal namespace (default: default)
- `WEBSOCKET_PORT`: WebSocket server port (default: 8081)

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WEBSOCKET_URL`: WebSocket server URL

## Troubleshooting

### Common Issues

1. **Temporal connection errors**: Ensure the temporal service is healthy before starting the backend
2. **Port conflicts**: Check if ports 3000, 8081, 7233, 8088, or 5432 are already in use
3. **Build failures**: Ensure Docker has sufficient resources allocated

### Health Checks
All services include health checks. You can monitor them with:
```bash
docker compose ps
```

### Cleanup
To completely remove all containers, volumes, and images:
```bash
docker compose down -v --rmi all
```

## Production Deployment

For production deployment, consider:
- Using production-grade PostgreSQL
- Setting up proper SSL/TLS certificates
- Configuring external monitoring and logging
- Using Docker secrets for sensitive environment variables
- Setting up proper backup strategies for the PostgreSQL database
