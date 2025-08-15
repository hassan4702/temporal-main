import { useState, useEffect, useRef } from 'react';

interface WorkflowUpdate {
  type: string;
  workflowId?: string;
  data?: any;
  error?: string;
  timestamp?: string;
}

export function useWorkflowSSE(workflowId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [activityProgress, setActivityProgress] = useState({
    inventoryCheck: 'pending' as 'pending' | 'completed' | 'failed',
    paymentProcessing: 'pending' as 'pending' | 'completed' | 'failed',
    shippingCalculation: 'pending' as 'pending' | 'completed' | 'failed'
  });
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const workflowCompletedRef = useRef(false);

  useEffect(() => {
    if (!workflowId) {
      return;
    }

    // Reset completion flag for new workflow
    workflowCompletedRef.current = false;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const eventSource = new EventSource(`/api/workflows/${workflowId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const update: WorkflowUpdate = JSON.parse(event.data);
        
        if (update.type === 'connected') {
          // Connection established
        } else if (update.type === 'workflow_update') {
          setWorkflowData(update.data);
          if (update.data.activityProgress) {
            setActivityProgress(update.data.activityProgress);
          }
          setError(null);
          
          // Mark workflow as completed to prevent reconnection
          if (update.data?.status === 'COMPLETED' || update.data?.status === 'FAILED') {
            workflowCompletedRef.current = true;
          }
        } else if (update.type === 'error') {
          setError(update.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (error) => {
      // Don't reconnect if workflow is already completed
      if (workflowCompletedRef.current) {
        setIsConnected(false);
        setError(null); // Clear error since this is expected
        return;
      }
      
      setIsConnected(false);
      setError('SSE connection failed');
    };

    // Cleanup
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [workflowId]);

  return {
    isConnected,
    workflowData,
    activityProgress,
    error
  };
}
