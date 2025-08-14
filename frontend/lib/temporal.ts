import { Client } from '@temporalio/client';

// Create client with minimal configuration
export const temporalClient = new Client({
  namespace: 'default',
});

export const TASK_QUEUE = 'order-task-queue';
