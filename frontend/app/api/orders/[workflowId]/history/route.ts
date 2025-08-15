import { NextRequest, NextResponse } from 'next/server';
import { temporalClient } from '@/lib/temporal';

interface SimpleHistoryEvent {
  timestamp: string;
  activity: string;
  status: 'started' | 'completed' | 'failed' | 'scheduled';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
): Promise<NextResponse<{ events: SimpleHistoryEvent[] } | { error: string }>> {
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

    // Get workflow history
    const history = await handle.fetchHistory();

    if (!history) {
      return NextResponse.json(
        { error: 'Workflow history not found' },
        { status: 404 }
      );
    }

    // Transform history events to simple format
    const events: SimpleHistoryEvent[] = [];

    history.events?.forEach((event) => {
      
      const timestamp = event.eventTime?.seconds?.toNumber() 
        ? new Date(event.eventTime.seconds.toNumber() * 1000).toISOString()
        : new Date().toISOString();

      // Extract activity name and status based on event type
      let activity = '';
      let status: 'started' | 'completed' | 'failed' | 'scheduled' = 'scheduled';

      if (event.workflowExecutionStartedEventAttributes) {
        activity = 'Workflow Started';
        status = 'started';
      } else if (event.workflowExecutionCompletedEventAttributes) {
        activity = 'Workflow Completed';
        status = 'completed';
      } else if (event.workflowExecutionFailedEventAttributes) {
        activity = 'Workflow Failed';
        status = 'failed';
      } else if (event.activityTaskScheduledEventAttributes) {
        activity = event.activityTaskScheduledEventAttributes.activityType?.name || 'Unknown Activity';
        status = 'scheduled';
      } else if (event.activityTaskStartedEventAttributes) {
        activity = 'Activity Started';
        status = 'started';
      } else if (event.activityTaskCompletedEventAttributes) {
        activity = 'Activity Completed';
        status = 'completed';
      } else if (event.activityTaskFailedEventAttributes) {
        activity = 'Activity Failed';
        status = 'failed';
      }

      // Only add events that have meaningful activity names
      if (activity && activity !== 'Unknown Activity') {
        events.push({
          timestamp,
          activity,
          status
        });
      }
    });

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      events,
    });

  } catch (error) {
    console.error('Error getting workflow history:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow history' },
      { status: 500 }
    );
  }
}
