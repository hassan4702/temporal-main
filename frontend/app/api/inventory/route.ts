import { NextRequest, NextResponse } from 'next/server';
import { temporalClient, TASK_QUEUE } from '@/lib/temporal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    // Start a Temporal workflow to get inventory
    const workflowId = `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const handle = await temporalClient.workflow.start('GetInventoryWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [{ productId: productId || undefined }],
    });

    // Wait for the workflow to complete
    const result = await handle.result();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get inventory');
    }
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error getting inventory via Temporal:', error);
    return NextResponse.json(
      { error: 'Failed to get inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      // Start a Temporal workflow to reset inventory
      const workflowId = `reset-inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const handle = await temporalClient.workflow.start('ResetInventoryWorkflow', {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [],
      });

      // Wait for the workflow to complete
      const result = await handle.result();

      if (!result.reset) {
        throw new Error('Failed to reset inventory');
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating inventory via Temporal:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
