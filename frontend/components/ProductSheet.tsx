'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { X, ShoppingCart } from 'lucide-react'
import OrderStatusDialog from './OrderStatusDialog'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  reserved: number
  image: string
  category: string
  description: string
}

interface ProductSheetProps {
  product: Product
  availableStock: number
  currentPrice: number
  onClose: () => void
}

export default function ProductSheet({ product, availableStock, currentPrice, onClose }: ProductSheetProps) {
  const [quantity, setQuantity] = useState(1)
  const [customerId, setCustomerId] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  const totalPrice = quantity * currentPrice

  const handleOrder = async () => {
    if (!customerId.trim() || !customerAddress.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (quantity > availableStock) {
      alert('Quantity exceeds available stock')
      return
    }

    setIsOrdering(true)
    setOrderResult(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerId,
          customerAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      setOrderResult(result)
      setShowStatusDialog(true) // Show the status dialog
    } catch (error) {
      console.error('Order failed:', error)
      setOrderResult({ error: error instanceof Error ? error.message : 'Unknown error' })
      alert('Order failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsOrdering(false)
    }
  }

  const handleCloseStatusDialog = () => {
    setShowStatusDialog(false)
    // Optionally close the product sheet as well
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Sheet */}
        <div className="relative w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Product Info */}
            <Card>
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge 
                  className="absolute top-2 right-2"
                  variant={availableStock > 0 ? "default" : "destructive"}
                >
                  {availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-gray-600">{product.category}</p>
                <p className="text-sm text-gray-700">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentPrice)}
                </div>
              </CardContent>
            </Card>

            {/* Order Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Place Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    disabled={isOrdering}
                  />
                </div>

                <div>
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Enter your customer ID"
                    disabled={isOrdering}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Shipping Address</Label>
                  <Input
                    id="address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter your shipping address"
                    disabled={isOrdering}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isOrdering || availableStock === 0 || quantity > availableStock}
                  onClick={handleOrder}
                >
                  {isOrdering ? 'Processing...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Status Dialog */}
      {showStatusDialog && orderResult && (
        <OrderStatusDialog
          isOpen={showStatusDialog}
          onClose={handleCloseStatusDialog}
          workflowId={orderResult.workflowId}
          productName={product.name}
          quantity={quantity}
          totalPrice={totalPrice}
        />
      )}
    </>
  )
}

