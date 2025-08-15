# Temporal Order Management Application

A modern order management application built with Temporal workflows for reliable, scalable, and observable business processes. Features real-time order tracking with Server-Sent Events (SSE) and a clean, interview-ready architecture.

## 🏗️ Architecture

The application uses Temporal workflows for all business logic, providing:

- **Reliability**: Automatic retries and error handling
- **Observability**: Complete workflow history and real-time tracking
- **Scalability**: Distributed execution with horizontal scaling
- **Simplicity**: Clean separation of concerns

### Services

- **Temporal Server**: Workflow orchestration engine
- **PostgreSQL**: Database for Temporal
- **Temporal Web UI**: Web interface for monitoring workflows
- **Backend**: Node.js Temporal worker
- **Frontend**: Next.js application with SSE real-time updates

## 🚀 Quick Start

### Prerequisites
- Docker
- Docker Compose

### 1. Start All Services
```bash
docker compose up -d
```

### 2. Access Applications
- **Frontend**: http://localhost:3000
- **Temporal Web UI**: http://localhost:8080
- **Backend API**: Available through frontend

## 📋 Features

### Order Processing Workflow
- **Inventory Check**: Verifies product availability
- **Payment Processing**: Handles payment transactions
- **Shipping Calculation**: Calculates shipping costs
- **Real-time Updates**: Live status tracking via SSE

### Inventory Management
- **Get Inventory**: Retrieve current stock levels
- **Reset Inventory**: Reset to initial state
- **Real-time Stats**: Live inventory statistics

### Real-time Tracking
- **Activity Progress**: Individual step status
- **Workflow Status**: Overall order status
- **Error Handling**: Graceful error states
- **Auto-reconnection**: Browser handles SSE reconnection

## 🔧 API Endpoints

### Order Management
- `POST /api/orders` - Create new order (starts ProcessOrderWorkflow)
- `GET /api/orders/[workflowId]` - Get order status
- `GET /api/orders/[workflowId]/history` - Get workflow history

### Real-time Updates
- `GET /api/workflows/[workflowId]/events` - SSE endpoint for real-time updates

### Inventory Management
- `GET /api/inventory` - Get inventory status (starts GetInventoryWorkflow)
- `POST /api/inventory` - Reset inventory (starts ResetInventoryWorkflow)

## 🏛️ Workflow Architecture

### ProcessOrderWorkflow
```typescript
// Complete order processing with activities
const inventory = await checkInventoryActivity({ productId, quantity });
const payment = await processPaymentActivity({ reservedQuantity, unitPrice, customerId });
const shipping = await calculateShippingActivity({ reservedQuantity, totalAmount, customerAddress });
```

### Activity Progress Tracking
- **Inventory Check**: Verifies product availability
- **Payment Processing**: Handles payment transactions  
- **Shipping Calculation**: Calculates shipping costs

### Workflow States
1. **RUNNING**: Workflow executing activities
2. **COMPLETED**: Order processed successfully
3. **FAILED**: Order processing failed

## 🛠️ Development

### Running Without Docker

#### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Temporal server

#### Backend Setup
```bash
cd backend
npm install
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

#### Backend
- `TEMPORAL_HOST`: Temporal server host (default: temporal)
- `TEMPORAL_PORT`: Temporal server port (default: 7233)
- `TEMPORAL_NAMESPACE`: Temporal namespace (default: default)

#### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `TEMPORAL_HOST`: Temporal server host

## 📊 Real-time Updates

### SSE Implementation
- **Polling**: Checks Temporal every 2 seconds
- **Activity Parsing**: Extracts status from workflow history
- **State Management**: React hook manages connection and data
- **Auto-reconnection**: Browser handles connection management

### Activity Status Logic
- **Activity completes** → Check workflow result
- **Workflow success** → Mark activity as completed
- **Workflow failure** → Mark activity as failed

## 🔍 Monitoring

### Temporal Web UI
- **URL**: http://localhost:8080
- **Features**: Workflow monitoring, history, debugging

### Application Logs
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend
docker compose logs -f frontend
```
