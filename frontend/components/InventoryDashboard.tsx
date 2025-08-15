'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  stock: number
  price: number
  reserved: number
  lastUpdated: string
}

interface InventoryStats {
  totalProducts: number
  totalStock: number
  totalReserved: number
  totalAvailable: number
}

interface InventoryData {
  inventory: Record<string, InventoryItem>
  stats: InventoryStats
}

export default function InventoryDashboard() {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()
      console.log(data)
      setInventoryData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const resetInventory = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset inventory')
      }

      // Refresh inventory data
      await fetchInventory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset inventory')
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Inventory Dashboard</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Inventory Dashboard</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800">Error</h4>
          <p className="text-red-700 mt-1">{error}</p>
          <Button onClick={fetchInventory} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!inventoryData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Inventory Dashboard</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No inventory data available</p>
        </div>
      </div>
    )
  }

  const { inventory, stats } = inventoryData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory Dashboard</h3>
        <div className="flex gap-2">
          <Button onClick={fetchInventory} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={resetInventory} variant="outline" size="sm">
            Reset Inventory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalReserved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAvailable}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Product</th>
                  <th className="text-right py-2 font-medium">Stock</th>
                  <th className="text-right py-2 font-medium">Reserved</th>
                  <th className="text-right py-2 font-medium">Available</th>
                  <th className="text-right py-2 font-medium">Price</th>
                  <th className="text-right py-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventory).map(([productId, item]) => {
                  const available = item.stock - item.reserved
                  return (
                    <tr key={productId} className="border-b">
                      <td className="py-2 font-medium">{productId}</td>
                      <td className="py-2 text-right">{item.stock}</td>
                      <td className="py-2 text-right text-orange-600">{item.reserved}</td>
                      <td className="py-2 text-right text-green-600">{available}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right text-gray-500">
                        {new Date(item.lastUpdated).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
