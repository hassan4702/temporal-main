'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { WorkflowResult, WorkflowHistory, WorkflowStatus, ActivityProgress } from '@/types/order'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useWorkflowSSE } from '@/lib/useSSE'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface OrderStatusProps {
  latestWorkflowId?: string | null
}

export default function OrderStatus({ latestWorkflowId }: OrderStatusProps) {
  const [workflowId, setWorkflowId] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [history, setHistory] = useState<WorkflowHistory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // SSE hook for real-time updates
  const {
    isConnected,
    workflowData,
    activityProgress,
    error: sseError
  } = useWorkflowSSE(workflowId)

  // Auto-update workflow ID when latestWorkflowId prop changes
  useEffect(() => {
    if (latestWorkflowId && latestWorkflowId !== workflowId) {
      setWorkflowId(latestWorkflowId)
      // Automatically start checking status for new workflow
      if (latestWorkflowId) {
        handleCheckStatus(latestWorkflowId)
      }
    }
  }, [latestWorkflowId, workflowId])

  // Update result when SSE data changes
  useEffect(() => {
    if (workflowData) {
      const newResult = {
        status: workflowData.result?.status || workflowData.status, // Use result status if available, fallback to workflow status
        transactionId: workflowData.result?.transactionId,
        shipping: workflowData.result?.shipping,
        refunded: workflowData.result?.refunded
      };
      setResult(newResult);
    }
  }, [workflowData])


  const handleCheckStatus = async (id?: string) => {
    const targetWorkflowId = id || workflowId
    if (!targetWorkflowId.trim()) return

    setIsChecking(true)
    setError(null)
    setResult(null)
    setHistory(null)
    setShowHistory(false)

    try {
      // Initial status check via REST API
      const response = await fetch(`/api/orders/${targetWorkflowId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get order status')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsChecking(false)
    }
  }

  const checkHistory = async () => {
    if (!workflowId.trim()) return

    try {
      const response = await fetch(`/api/orders/${workflowId}/history`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get order history')
      }

      setHistory(data)
      setShowHistory(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get history')
    }
  }



  const getActivityStatusIcon = (status: 'pending' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Confirmed':
        return 'text-green-600'
      case 'Payment Failed':
        return 'text-red-600'
      case 'Out of Stock':
        return 'text-orange-600'
      case 'processing':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!workflowId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Order Status</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No active order workflow to track</p>
          <p className="text-sm text-gray-500 mt-2">Place an order to see real-time status updates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Status</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
          <span className={'text-green-600' }>
          Live Updates
          </span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Tracking Workflow</p>
            <p className="text-xs text-blue-600 font-mono">{workflowId}</p>
          </div>
          <div className="text-sm text-blue-600">
            
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Real-time Updates</span>
              </div>
     
          </div>
        </div>
      </div>
    

      {result && (
        <div className="space-y-4">
          {/* Activity Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">Activity Progress</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Inventory Check</span>
                  <p className="text-sm text-gray-600">Verifying product availability</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    activityProgress.inventoryCheck === 'completed' ? 'text-green-600' :
                    activityProgress.inventoryCheck === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {activityProgress.inventoryCheck === 'completed' ? 'In Stock' :
                     activityProgress.inventoryCheck === 'failed' ? 'Out of Stock' : 'Checking...'}
                  </span>
                  {getActivityStatusIcon(activityProgress.inventoryCheck)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Payment Processing</span>
                  <p className="text-sm text-gray-600">Processing payment transaction</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    activityProgress.paymentProcessing === 'completed' ? 'text-green-600' :
                    activityProgress.paymentProcessing === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {activityProgress.paymentProcessing === 'completed' ? 'Payment Successful' :
                     activityProgress.paymentProcessing === 'failed' ? 'Payment Failed' : 'Processing...'}
                  </span>
                  {getActivityStatusIcon(activityProgress.paymentProcessing)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Shipping Calculation</span>
                  <p className="text-sm text-gray-600">Calculating shipping costs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    activityProgress.shippingCalculation === 'completed' ? 'text-green-600' :
                    activityProgress.shippingCalculation === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {activityProgress.shippingCalculation === 'completed' ? 'Calculated' :
                     activityProgress.shippingCalculation === 'failed' ? 'Failed' : 'Calculating...'}
                  </span>
                  {getActivityStatusIcon(activityProgress.shippingCalculation)}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">Order Status</h4>
            <p className={`font-medium ${getStatusColor(result.status)}`}>
              Status: {result.status}
            </p>
            
            {result.transactionId && (
              <p className="text-sm text-gray-600 mt-1">
                Transaction ID: {result.transactionId}
              </p>
            )}

            {result.shipping && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h5 className="font-medium mb-2">Shipping Details</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Shipping Cost:</span>
                    <span>{formatCurrency(result.shipping.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{result.shipping.estimatedDelivery}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(result.shipping.finalTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {result.refunded !== undefined && (
              <p className="text-sm text-gray-600 mt-2">
                Refunded: {result.refunded ? 'Yes' : 'No'}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                onClick={checkHistory}
                variant="outline"
                size="sm"
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow History */}
      {showHistory && history && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Workflow Execution History</h4>
            <Button
              onClick={() => setShowHistory(false)}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {history.events.map((event, index) => {
              const eventNumber = history.events.length - index; // Reverse numbering
              
              return (
                <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                  {/* Event number and status indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-600 font-medium w-6 text-right">{eventNumber}</span>
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      event.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : event.status === 'failed'
                        ? 'bg-red-500 border-red-500'
                        : event.status === 'started'
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400'
                    }`}></div>
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      {/* Timestamp */}
                      <span className="text-gray-500 flex-shrink-0 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      
                      {/* Activity name */}
                      <span className="text-gray-900 font-medium">
                        {event.activity}
                      </span>
                      
                      {/* Status badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : event.status === 'started'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Events: {history.events.length}</span>
              <span>Workflow ID: {workflowId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
