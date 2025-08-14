import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  workflowId?: string;
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
}

interface WorkflowUpdate {
  type: 'workflow_update';
  workflowId: string;
  data: {
    status: string;
    result: any;
    activityProgress: {
      inventoryCheck: 'pending' | 'completed' | 'failed';
      paymentProcessing: 'pending' | 'completed' | 'failed';
      shippingCalculation: 'pending' | 'completed' | 'failed';
    };
    description: any;
  };
  timestamp: string;
}

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:8081',
    onMessage,
    onError,
    onClose,
    onOpen,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // If we're in the process of disconnecting, wait a bit
    if (isDisconnectingRef.current) {
      setTimeout(() => connect(), 100);
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        isConnectingRef.current = false;
        hasConnectedRef.current = true;
        setIsConnected(true);
        setIsConnecting(false);
        setError(null); // Clear any previous errors when connection succeeds
        reconnectAttemptsRef.current = 0;
        onOpen?.();

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          // Clear error state when we receive messages (indicates connection is working)
          if (error) {
            setError(null);
          }
          onMessage?.(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        // Only log errors if we haven't successfully connected yet
        if (!hasConnectedRef.current) {
          console.warn('WebSocket connection attempt failed, will retry...');
          setError('WebSocket connection error');
        }
        // Don't set error if we've already connected successfully
        onError?.(event);
      };

      ws.onclose = (event) => {
        // Only log disconnection if it's not a normal closure and we were connected
        if (event.code !== 1000 && hasConnectedRef.current) {
          console.log('WebSocket disconnected unexpectedly:', event.code, event.reason);
          setError('WebSocket disconnected unexpectedly');
        }
        
        isConnectingRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Only attempt to reconnect if not a normal closure and not manually disconnecting
        if (event.code !== 1000 && !isDisconnectingRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [url, onMessage, onError, onClose, onOpen, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    isDisconnectingRef.current = true;
    hasConnectedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    // Reset flags after a short delay
    setTimeout(() => {
      isDisconnectingRef.current = false;
    }, 200);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribeToWorkflow = useCallback((workflowId: string) => {
    return sendMessage({
      type: 'subscribe_workflow',
      workflowId
    });
  }, [sendMessage]);

  const unsubscribeFromWorkflow = useCallback((workflowId: string) => {
    return sendMessage({
      type: 'unsubscribe_workflow',
      workflowId
    });
  }, [sendMessage]);

  // Auto-connect on mount with a small delay to prevent rapid connect/disconnect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      disconnect();
    };
  }, [connect, disconnect]);

  // Clear error when connection is established
  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [isConnected, error]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    subscribeToWorkflow,
    unsubscribeFromWorkflow
  };
}

// Specialized hook for workflow updates
export function useWorkflowWebSocket(workflowId?: string) {
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [activityProgress, setActivityProgress] = useState({
    inventoryCheck: 'pending' as 'pending' | 'completed' | 'failed',
    paymentProcessing: 'pending' as 'pending' | 'completed' | 'failed',
    shippingCalculation: 'pending' as 'pending' | 'completed' | 'failed'
  });

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'workflow_update' && message.workflowId === workflowId) {
      const update = message as WorkflowUpdate;
      setWorkflowData(update.data);
      setActivityProgress(update.data.activityProgress);
    }
  }, [workflowId]);

  const { isConnected, isConnecting, error, connect, disconnect, subscribeToWorkflow, unsubscribeFromWorkflow } = useWebSocket({
    onMessage: handleMessage
  });

  // Auto-subscribe when workflowId changes, with a small delay
  useEffect(() => {
    if (!workflowId) return;

    const timeoutId = setTimeout(() => {
      if (isConnected && workflowId) {
        subscribeToWorkflow(workflowId);
      }
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      if (workflowId) {
        unsubscribeFromWorkflow(workflowId);
      }
    };
  }, [isConnected, workflowId, subscribeToWorkflow, unsubscribeFromWorkflow]);

  return {
    isConnected,
    isConnecting,
    error,
    workflowData,
    activityProgress,
    connect,
    disconnect
  };
}
