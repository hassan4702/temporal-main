'use client'

import { useState } from 'react'
import OrderForm from '@/components/OrderForm'
import OrderStatus from '@/components/OrderStatus'

export default function OrderProcessingWrapper() {
  const [latestWorkflowId, setLatestWorkflowId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <OrderForm onOrderCreated={setLatestWorkflowId} />
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8">
        <OrderStatus latestWorkflowId={latestWorkflowId} />
      </div>
    </div>
  )
}
