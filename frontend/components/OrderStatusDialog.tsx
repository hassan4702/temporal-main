'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock } from 'lucide-react'
import OrderStatus from './OrderStatus'

interface OrderStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string | null
  productName: string
  quantity: number
  totalPrice: number
}

export default function OrderStatusDialog({
  isOpen,
  onClose,
  workflowId,
  productName,
  quantity,
  totalPrice
}: OrderStatusDialogProps) {
  const [shouldShowDialog, setShouldShowDialog] = useState(false)

  // Add a small delay to ensure WebSocket connection is stable
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShouldShowDialog(true)
      }, 300) // 300ms delay

      return () => {
        clearTimeout(timer)
        setShouldShowDialog(false)
      }
    } else {
      setShouldShowDialog(false)
    }
  }, [isOpen])

  return (
    <Dialog open={shouldShowDialog} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Order Status
          </DialogTitle>
          <DialogDescription>
            Tracking your order: {productName} (Qty: {quantity}) - Total: ${totalPrice}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <OrderStatus latestWorkflowId={workflowId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
