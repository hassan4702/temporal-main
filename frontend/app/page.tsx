'use client'

import OrderForm from '@/components/OrderForm'
import OrderStatus from '@/components/OrderStatus'
import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [latestWorkflowId, setLatestWorkflowId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Temporal Order Processing System
          </h1>

          <div className="mt-4 flex justify-center space-x-4">
            <Link 
              href="/store" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🛍️ Visit Store
            </Link>
            <Link 
              href="/inventory" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              📊 Inventory Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <OrderForm onOrderCreated={setLatestWorkflowId} />
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <OrderStatus latestWorkflowId={latestWorkflowId} />
          </div>
        </div>

      </div>
    </main>
  )
}
