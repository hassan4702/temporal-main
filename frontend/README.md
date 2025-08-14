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
- Temporal backend running on `localhost:7233`
- Backend worker running with task queue `order-processing`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

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
