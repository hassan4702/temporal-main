import Link from 'next/link'
import { ShoppingBag, BarChart3 } from 'lucide-react'
import OrderProcessingWrapper from '@/components/OrderProcessingWrapper'

export default function Home() {
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
              <ShoppingBag className="w-4 h-4 mr-2" />
              Visit Store
            </Link>
            <Link 
              href="/inventory" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Inventory Dashboard
            </Link>
          </div>
        </div>

        <OrderProcessingWrapper />

      </div>
    </main>
  )
}
