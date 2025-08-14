import { Client } from '@temporalio/client';

// Create client with proper configuration
export const temporalClient = new Client({
  namespace: 'default',
  connection: {
    address: process.env.TEMPORAL_HOST || 'localhost:7233',
  },
  // Add connection timeout
  connectionOptions: {
    connectTimeout: 10000, // 10 seconds for container networking
  }
});

export const TASK_QUEUE = 'order-task-queue';
