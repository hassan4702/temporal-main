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

## Running Without Docker

If you prefer not to use Docker, you can run the services individually:

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database running locally
- Temporal server running locally

### Backend Setup
1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend service:**
   ```bash
   npm start
   ```

4. **Start the WebSocket server (in a separate terminal):**
   ```bash
   npm run websocket
   ```

### Frontend Setup
1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### Access the applications:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8081
- **WebSocket Server**: ws://localhost:8081

**Note**: When running without Docker, you'll need to ensure PostgreSQL and Temporal server are running locally and update the environment variables accordingly.

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



## Setup

### 1. Start Temporal Server

First, start the Temporal server using Docker:

```bash
git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker compose up
```

This will start Temporal server on `localhost:7233` with the Temporal Web UI available at `http://localhost:8080`.

### 2. Start the Backend

In a new terminal, navigate to the backend directory and start both the worker and WebSocket server:

```bash
cd backend
npm install
npm start
```

This will start both:
- The Temporal worker that processes orders
- The WebSocket server that provides real-time updates to the frontend

Alternatively, you can run them separately:
- `npm run worker` - Start only the Temporal worker
- `npm run websocket` - Start only the WebSocket server

### 3. Start the Frontend

In another terminal, navigate to the frontend directory and start the development server:

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Temporal Web UI: [http://localhost:8233](http://localhost:8233)
