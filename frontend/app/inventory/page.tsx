import InventoryDashboard from '@/components/InventoryDashboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inventory Management Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage product inventory in real-time
          </p>
          <div className="mt-4">
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order Processing
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <InventoryDashboard />
        </div>
      </div>
    </main>
  )
}
