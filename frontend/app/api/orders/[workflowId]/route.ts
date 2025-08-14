import { NextRequest, NextResponse } from 'next/server';
import { temporalClient } from '@/lib/temporal';
import type { WorkflowResult } from '@/types/order';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
): Promise<NextResponse<WorkflowResult | { error: string }>> {
  try {
    const { workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Get the workflow handle
    const handle = temporalClient.workflow.getHandle(workflowId);

    // Check if workflow exists and get its status
    const description = await handle.describe();
    
    if (!description) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // If workflow is still running, return status
    if (description.status.name === 'RUNNING') {
      return NextResponse.json({
        status: 'processing',
      });
    }

    // If workflow is completed, get the result
    if (description.status.name === 'COMPLETED') {
      const result = await handle.result();
      return NextResponse.json(result as WorkflowResult);
    }

    // If workflow failed or was terminated
    if (description.status.name === 'FAILED' || description.status.name === 'TERMINATED') {
      return NextResponse.json({
        status: 'failed',
        error: description.status.name,
      });
    }

    return NextResponse.json({
      status: 'unknown',
    });

  } catch (error) {
    console.error('Error getting workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
}
