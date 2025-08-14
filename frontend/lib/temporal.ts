import { Client } from '@temporalio/client';

// Debug: Log the connection address
const temporalAddress = process.env.TEMPORAL_HOST || 'localhost:7233';
console.log('Temporal connection address:', temporalAddress);
console.log('Environment variables:', {
  TEMPORAL_HOST: process.env.TEMPORAL_HOST,
  NODE_ENV: process.env.NODE_ENV
});

// Create client with proper configuration
export const temporalClient = new Client({
  namespace: 'default',
});

export const TASK_QUEUE = 'order-task-queue';
