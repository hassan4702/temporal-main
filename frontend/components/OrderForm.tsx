'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Icons will be added after lucide-react is installed
import type { OrderRequest } from '@/types/order'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  stock: number
  price: number
  reserved: number
  lastUpdated: string
}

interface Product {
  id: string
  name: string
  price: number
  description: string
  stock: number
}

interface OrderFormProps {
  onOrderCreated?: (workflowId: string) => void
}

export default function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<OrderRequest>({
    productId: '',
    quantity: 1,
    customerId: '',
    customerAddress: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ workflowId: string; status: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from inventory API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()

      // Transform inventory data to products format
      const productList: Product[] = Object.entries(data.inventory || {}).map(([id, item]: [string, any]) => ({
        id,
        name: id, // Using id as name for now, could be enhanced with a name mapping
        price: item.price,
        description: `${id} - ${item.stock - item.reserved} units available`,
        stock: item.stock - item.reserved
      }))

      setProducts(productList)

      // Set default product if available
      if (productList.length > 0 && !formData.productId) {
        setFormData(prev => ({ ...prev, productId: productList[0].id }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [formData.productId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const selectedProduct = products.find(p => p.id === formData.productId)
  const totalPrice = selectedProduct ? selectedProduct.price * formData.quantity : 0

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      setResult(data)

      // Notify parent component about the new order
      if (onOrderCreated && data.workflowId) {
        onOrderCreated(data.workflowId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onOrderCreated])

  const handleInputChange = useCallback((name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(String(value)) || 1 : String(value),
    }))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Place New Order</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Place New Order</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800">Error</h4>
          <p className="text-red-700 mt-1">{error}</p>
          <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Place New Order</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No products available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Place New Order</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="productId" className="text-sm font-medium text-gray-700">
            Product
          </label>
          <Select value={formData.productId} onValueChange={(value: string) => handleInputChange('productId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex flex-row w-full justify-between items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(product.price)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProduct && (
            <p className="text-sm text-gray-600">{selectedProduct.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity
          </label>
          <Input
            type="number"
            id="quantity"
            min="1"
            max={selectedProduct?.stock || 1}
            value={formData.quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('quantity', e.target.value)}
            required
          />
          {selectedProduct && (
            <p className="text-sm text-gray-600">
              Available: {selectedProduct.stock} units
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="customerId" className="text-sm font-medium text-gray-700">
            Customer ID
          </label>
          <Input
            type="text"
            id="customerId"
            value={formData.customerId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customerId', e.target.value)}
            placeholder="Enter customer ID"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="customerAddress" className="text-sm font-medium text-gray-700">
            Shipping Address
          </label>
          <Textarea
            id="customerAddress"
            value={formData.customerAddress}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('customerAddress', e.target.value)}
            placeholder="Enter complete shipping address"
            required
            rows={3}
          />
        </div>

        {selectedProduct && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Product:</span>
                <span>{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{formData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Unit Price:</span>
                <span>{formatCurrency(selectedProduct.price)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base"
        >
          {isSubmitting ? 'Processing Order...' : 'Place Order'}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-red-800">Error</h4>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-green-800">Order Created Successfully!</h4>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="font-medium">Workflow ID:</span> {result.workflowId}</p>
            <p className="text-green-700">Check the Order Status panel for real-time updates</p>
          </div>
        </div>
      )}
    </div>
  )
}
