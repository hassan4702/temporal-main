import { NextRequest } from 'next/server';
import { Client } from '@temporalio/client';

const temporalClient = new Client({ namespace: 'default' });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ 
        type: 'connected', 
        workflowId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Poll workflow every 2 seconds
      const interval = setInterval(async () => {
        try {
          const handle = temporalClient.workflow.getHandle(workflowId);
          const description = await handle.describe();
          
          let result = null;
          
          // Only get result if workflow is completed
          if (description.status.name === 'COMPLETED') {
            result = await handle.result().catch(() => null);
          }
          
          const history = await handle.fetchHistory().catch(() => null);
          const activityProgress = parseActivityProgress(history, result);
          
          const update = {
            type: 'workflow_update',
            workflowId,
            data: {
              status: description.status.name,
              result,
              activityProgress,
              timestamp: new Date().toISOString()
            }
          };
          
          const message = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(message));
          
          // Stop polling if workflow is completed or failed, but keep connection open
          if (description.status.name === 'COMPLETED' || description.status.name === 'FAILED') {
            clearInterval(interval);

          }
        } catch (error) {
          console.error(`Error polling workflow ${workflowId}:`, error);
          const errorMessage = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
        }
      }, 2000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

function parseActivityProgress(history: any, workflowResult: any) {
  const progress = {
    inventoryCheck: 'pending' as 'pending' | 'completed' | 'failed',
    paymentProcessing: 'pending' as 'pending' | 'completed' | 'failed',
    shippingCalculation: 'pending' as 'pending' | 'completed' | 'failed'
  };
  
  if (!history?.events) return progress;
  
  // Map activity names to their scheduled event IDs
  const activityNameMap = new Map<string, string>();
  history.events.forEach((event: any) => {
    if ((event.eventType === '10' || event.eventType === 10) && event.activityTaskScheduledEventAttributes) {
      const activityName = event.activityTaskScheduledEventAttributes.activityType?.name;
      if (activityName) {
        const scheduledEventId = event.eventId?.toString();
        if (scheduledEventId) {
          activityNameMap.set(scheduledEventId, activityName);
        }
      }
    }
  });
  
  // Parse completed and failed events
  history.events.forEach((event: any) => {
    if ((event.eventType === '12' || event.eventType === 12) && event.activityTaskCompletedEventAttributes) {
      const scheduledEventId = event.activityTaskCompletedEventAttributes.scheduledEventId?.low?.toString() || 
                              event.activityTaskCompletedEventAttributes.scheduledEventId?.toString();
      
      if (scheduledEventId) {
        const activityName = activityNameMap.get(scheduledEventId);
        
        if (activityName) {
          if (activityName === 'checkInventoryActivity') {
            // Determine inventory success based on workflow result
            if (workflowResult && workflowResult.status === 'Out of Stock') {
              progress.inventoryCheck = 'failed';
            } else {
              progress.inventoryCheck = 'completed';
            }
          } else if (activityName === 'processPaymentActivity') {
            // Determine payment success based on workflow result
            if (workflowResult && workflowResult.status === 'Payment Failed') {
              progress.paymentProcessing = 'failed';
            } else {
              progress.paymentProcessing = 'completed';
            }
          } else if (activityName === 'calculateShippingActivity') {
            progress.shippingCalculation = 'completed';
          }
        }
      }
    } else if ((event.eventType === '13' || event.eventType === 13) && event.activityTaskFailedEventAttributes) {
      const scheduledEventId = event.activityTaskFailedEventAttributes.scheduledEventId?.low?.toString() || 
                              event.activityTaskFailedEventAttributes.scheduledEventId?.toString();
      
      if (scheduledEventId) {
        const activityName = activityNameMap.get(scheduledEventId);
        
        if (activityName) {
          if (activityName === 'checkInventoryActivity') {
            progress.inventoryCheck = 'failed';
          } else if (activityName === 'processPaymentActivity') {
            progress.paymentProcessing = 'failed';
          } else if (activityName === 'calculateShippingActivity') {
            progress.shippingCalculation = 'failed';
          }
        }
      }
    }
  });
  
  return progress;
}
