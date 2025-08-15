import { NextRequest, NextResponse } from 'next/server';
import { temporalClient, TASK_QUEUE } from '@/lib/temporal';
import type { OrderRequest, OrderResponse } from '@/types/order';

export async function POST(request: NextRequest): Promise<NextResponse<OrderResponse | { error: string }>> {
  try {
    const body: OrderRequest = await request.json();
    
    if (!body.productId || !body.quantity || !body.customerId || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, customerId, customerAddress' },
        { status: 400 }
      );
    }

    const workflowId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Start the workflow
    const handle = await temporalClient.workflow.start('ProcessOrderWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [body],
      workflowExecutionTimeout: '30 seconds',
      workflowTaskTimeout: '10 seconds',
    });

    return NextResponse.json({
      workflowId,
      status: 'pending' as const,
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    
    let errorMessage = 'Failed to start order processing workflow';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
