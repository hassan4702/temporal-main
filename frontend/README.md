# Temporal Order Processing Frontend

A Next.js 15 application that provides a user interface for the Temporal order processing system.

## Features

- **Order Placement**: Submit new orders through a user-friendly form
- **Order Status Tracking**: Check the status of existing orders using workflow IDs
- **Workflow History**: View detailed execution history of workflows (bonus feature)
- **Real-time Updates**: Monitor order processing in real-time
- **Modern UI**: Built with Tailwind CSS for a responsive and modern interface

## API Routes

- `POST /api/orders` - Start a new order processing workflow
- `GET /api/orders/[workflowId]` - Get workflow status and result
- `GET /api/orders/[workflowId]/history` - Get workflow execution history

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Temporal backend running on `localhost:7233`
- Backend worker running with task queue `order-processing`

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

## Usage

1. **Place an Order**:
   - Fill out the order form with product details, quantity, customer ID, and address
   - Click "Place Order" to start the workflow
   - Copy the returned workflow ID for tracking

2. **Check Order Status**:
   - Enter a workflow ID in the status checker
   - Click "Check" to see the current status
   - View shipping details and transaction information

3. **View Workflow History**:
   - After checking status, click "View History" to see detailed execution events
   - Monitor each step of the workflow execution

## Technology Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Temporal Client** for workflow integration
- **Server-Side Rendering (SSR)** for better performance

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── orders/        # Order-related endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── OrderForm.tsx      # Order placement form
│   └── OrderStatus.tsx    # Status checking component
├── lib/                   # Utility libraries
│   └── temporal.ts        # Temporal client configuration
├── types/                 # TypeScript type definitions
│   └── order.ts           # Order-related types
└── package.json           # Dependencies and scripts
```

