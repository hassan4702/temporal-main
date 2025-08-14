import { WebSocketServer, WebSocket } from 'ws';
import { Client } from '@temporalio/client';
import { Connection } from '@temporalio/client';

interface WorkflowSubscription {
  workflowId: string;
  clients: Set<WebSocket>;
}

interface WorkflowUpdate {
  type: 'workflow_update' | 'activity_progress' | 'history_update';
  workflowId: string;
  data: any;
  timestamp: string;
}

class TemporalWebSocketServer {
  private wss: WebSocketServer;
  private temporalClient: Client;
  private workflowSubscriptions = new Map<string, WorkflowSubscription>();
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.temporalClient = new Client({ namespace: 'default' });
    
    console.log(`WebSocket server starting on port ${port}`);
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid JSON message' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.removeClientFromAllSubscriptions(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClientFromAllSubscriptions(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to Temporal WebSocket server',
        timestamp: new Date().toISOString()
      }));
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'subscribe_workflow':
        this.subscribeToWorkflow(ws, data.workflowId);
        break;
      case 'unsubscribe_workflow':
        this.unsubscribeFromWorkflow(ws, data.workflowId);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: `Unknown message type: ${data.type}` 
        }));
    }
  }

  private subscribeToWorkflow(ws: WebSocket, workflowId: string) {
    console.log(`Subscribing to workflow: ${workflowId}`);
    
    // Add client to subscription
    if (!this.workflowSubscriptions.has(workflowId)) {
      this.workflowSubscriptions.set(workflowId, {
        workflowId,
        clients: new Set()
      });
      
      // Start polling for this workflow
      this.startWorkflowPolling(workflowId);
    }
    
    const subscription = this.workflowSubscriptions.get(workflowId)!;
    subscription.clients.add(ws);
    
    // Send immediate status
    this.sendWorkflowUpdate(workflowId);
    
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      workflowId,
      message: `Subscribed to workflow ${workflowId}`,
      timestamp: new Date().toISOString()
    }));
  }

  private unsubscribeFromWorkflow(ws: WebSocket, workflowId: string) {
    console.log(`Unsubscribing from workflow: ${workflowId}`);
    
    const subscription = this.workflowSubscriptions.get(workflowId);
    if (subscription) {
      subscription.clients.delete(ws);
      
      // If no more clients, stop polling and remove subscription
      if (subscription.clients.size === 0) {
        this.stopWorkflowPolling(workflowId);
        this.workflowSubscriptions.delete(workflowId);
      }
    }
    
    ws.send(JSON.stringify({
      type: 'unsubscription_confirmed',
      workflowId,
      message: `Unsubscribed from workflow ${workflowId}`,
      timestamp: new Date().toISOString()
    }));
  }

  private removeClientFromAllSubscriptions(ws: WebSocket) {
    for (const [workflowId, subscription] of this.workflowSubscriptions.entries()) {
      subscription.clients.delete(ws);
      
      // If no more clients, stop polling and remove subscription
      if (subscription.clients.size === 0) {
        this.stopWorkflowPolling(workflowId);
        this.workflowSubscriptions.delete(workflowId);
      }
    }
  }

  private startWorkflowPolling(workflowId: string) {
    if (this.pollingIntervals.has(workflowId)) {
      return; // Already polling
    }
    
    const interval = setInterval(async () => {
      await this.sendWorkflowUpdate(workflowId);
    }, 2000); // Poll every 2 seconds
    
    this.pollingIntervals.set(workflowId, interval);
    console.log(`Started polling for workflow: ${workflowId}`);
  }

  private stopWorkflowPolling(workflowId: string) {
    const interval = this.pollingIntervals.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(workflowId);
      console.log(`Stopped polling for workflow: ${workflowId}`);
    }
  }

  private async sendWorkflowUpdate(workflowId: string) {
    try {
      const subscription = this.workflowSubscriptions.get(workflowId);
      if (!subscription || subscription.clients.size === 0) {
        return;
      }

      // Get workflow status
      const handle = this.temporalClient.workflow.getHandle(workflowId);
      const description = await handle.describe();
      const result = await handle.result().catch(() => null);
      
      // Get workflow history for activity progress
      const history = await handle.fetchHistory().catch(() => null);
      
      // Determine activity progress from history
      const activityProgress = this.parseActivityProgress(history);
      
      // Create workflow update with actual result content
      const update: WorkflowUpdate = {
        type: 'workflow_update',
        workflowId,
        data: {
          status: description.status.name,
          result: result, // Include the actual workflow result
          activityProgress,
          description
        },
        timestamp: new Date().toISOString()
      };
      
      // Send to all subscribed clients
      const message = JSON.stringify(update);
      for (const client of subscription.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
      
    } catch (error) {
      console.error(`Error sending workflow update for ${workflowId}:`, error);
      
      // Send error to clients
      const subscription = this.workflowSubscriptions.get(workflowId);
      if (subscription) {
        const errorMessage = JSON.stringify({
          type: 'error',
          workflowId,
          message: 'Failed to get workflow update',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        for (const client of subscription.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(errorMessage);
          }
        }
      }
    }
  }

  private parseActivityProgress(history: any) {
    const progress = {
      inventoryCheck: 'pending' as 'pending' | 'completed' | 'failed',
      paymentProcessing: 'pending' as 'pending' | 'completed' | 'failed',
      shippingCalculation: 'pending' as 'pending' | 'completed' | 'failed'
    };
    
    if (!history?.events) return progress;
    
    console.log('Parsing activity progress from history with', history.events.length, 'events');
    
    // Debug: Log all event types to see what we have
    console.log('Event types in history:');
    history.events.forEach((event: any, index: number) => {
      console.log(`Event ${index}: type=${event.eventType}, hasActivityScheduled=${!!event.activityTaskScheduledEventAttributes}, hasActivityCompleted=${!!event.activityTaskCompletedEventAttributes}, hasActivityFailed=${!!event.activityTaskFailedEventAttributes}`);
    });
    
    // First pass: Create a map of scheduledEventId to activityName from scheduled events
    const activityNameMap = new Map<string, string>();
    history.events.forEach((event: any, index: number) => {
      // Handle both string and number event types
      if ((event.eventType === '10' || event.eventType === 10) && event.activityTaskScheduledEventAttributes) {
        const activityName = event.activityTaskScheduledEventAttributes.activityType?.name;
        console.log(`Event ${index} (type ${event.eventType}) activity scheduled:`, activityName);
        if (activityName) {
          // Use the actual scheduledEventId from the event itself
          const scheduledEventId = event.eventId?.toString();
          if (scheduledEventId) {
            activityNameMap.set(scheduledEventId, activityName);
            console.log('Mapped activity:', scheduledEventId, '->', activityName);
          } else {
            console.log('No eventId found in scheduled event');
          }
        } else {
          console.log('Event 10 found but no activity name:', JSON.stringify(event.activityTaskScheduledEventAttributes, null, 2));
        }
      }
    });
    
    console.log('Activity name map size:', activityNameMap.size);
    console.log('Activity name map contents:', Array.from(activityNameMap.entries()));
    
    // Second pass: Parse completed and failed events using the map
    history.events.forEach((event: any, index: number) => {
      // Handle both string and number event types
      if ((event.eventType === '12' || event.eventType === 12) && event.activityTaskCompletedEventAttributes) {
        // For completed events, we need to find the scheduled event to get the activity name
        const scheduledEventId = event.activityTaskCompletedEventAttributes.scheduledEventId?.low?.toString() || 
                                event.activityTaskCompletedEventAttributes.scheduledEventId?.toString();
        
        console.log('Completed event scheduledEventId:', scheduledEventId);
        
        if (scheduledEventId) {
          const activityName = activityNameMap.get(scheduledEventId);
          console.log('Completed activity lookup:', scheduledEventId, '->', activityName);
          
          if (activityName) {
            if (activityName === 'checkInventoryActivity') {
              progress.inventoryCheck = 'completed';
              console.log('✅ Inventory check completed');
            } else if (activityName === 'processPaymentActivity') {
              progress.paymentProcessing = 'completed';
              console.log('✅ Payment processing completed');
            } else if (activityName === 'calculateShippingActivity') {
              progress.shippingCalculation = 'completed';
              console.log('✅ Shipping calculation completed');
            }
          } else {
            console.log('No activity name found for scheduledEventId:', scheduledEventId);
          }
        } else {
          console.log('No scheduledEventId found in completed event');
        }
      } else if ((event.eventType === '13' || event.eventType === 13) && event.activityTaskFailedEventAttributes) {
        // For failed events, we need to find the scheduled event to get the activity name
        const scheduledEventId = event.activityTaskFailedEventAttributes.scheduledEventId?.low?.toString() || 
                                event.activityTaskFailedEventAttributes.scheduledEventId?.toString();
        
        console.log('Failed event scheduledEventId:', scheduledEventId);
        
        if (scheduledEventId) {
          const activityName = activityNameMap.get(scheduledEventId);
          console.log('Failed activity lookup:', scheduledEventId, '->', activityName);
          
          if (activityName) {
            if (activityName === 'checkInventoryActivity') {
              progress.inventoryCheck = 'failed';
              console.log('❌ Inventory check failed');
            } else if (activityName === 'processPaymentActivity') {
              progress.paymentProcessing = 'failed';
              console.log('❌ Payment processing failed');
            } else if (activityName === 'calculateShippingActivity') {
              progress.shippingCalculation = 'failed';
              console.log('❌ Shipping calculation failed');
            }
          } else {
            console.log('No activity name found for scheduledEventId:', scheduledEventId);
          }
        } else {
          console.log('No scheduledEventId found in failed event');
        }
      }
    });
    
    console.log('Final activity progress:', progress);
    return progress;
  }

  public broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  public getStats() {
    return {
      connectedClients: this.wss.clients.size,
      activeSubscriptions: this.workflowSubscriptions.size,
      pollingWorkflows: this.pollingIntervals.size
    };
  }

  public close() {
    console.log('Closing WebSocket server...');
    
    // Stop all polling intervals
    for (const [workflowId, interval] of this.pollingIntervals.entries()) {
      clearInterval(interval);
      console.log(`Stopped polling for workflow: ${workflowId}`);
    }
    this.pollingIntervals.clear();
    
    // Close all client connections
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutting down');
      }
    });
    
    // Close the WebSocket server
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}

// Start the WebSocket server
const server = new TemporalWebSocketServer(8081);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  server.close();
  process.exit(0);
});

console.log('Temporal WebSocket server is running on port 8081');
