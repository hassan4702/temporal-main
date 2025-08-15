'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import ProductSheet from '@/components/ProductSheet'
import Link from 'next/link'

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
  stock: number
  reserved: number
  image: string
  category: string
  description: string
}

// Product metadata mapping (could be moved to a separate config file)
const PRODUCT_METADATA: Record<string, Omit<Product, 'id' | 'price' | 'stock' | 'reserved'>> = {
  'Shirts': {
    name: 'Premium Cotton Shirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    category: 'Tops',
    description: 'Comfortable and stylish cotton shirts perfect for any occasion.'
  },
  'Pants': {
    name: 'Classic Denim Pants',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    category: 'Bottoms',
    description: 'Timeless denim pants with perfect fit and durability.'
  },
  'Shoes': {
    name: 'Leather Sneakers',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    category: 'Footwear',
    description: 'Premium leather sneakers for comfort and style.'
  },
  'Hats': {
    name: 'Stylish Baseball Caps',
    image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=400&fit=crop',
    category: 'Accessories',
    description: 'Trendy baseball caps to complete your look.'
  },
  'Socks': {
    name: 'Comfortable Cotton Socks',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=400&fit=crop',
    category: 'Accessories',
    description: 'Soft and breathable cotton socks for everyday comfort.'
  },
  'Gloves': {
    name: 'Winter Warm Gloves',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
    category: 'Accessories',
    description: 'Warm and cozy gloves for cold weather protection.'
  },
  'Jackets': {
    name: 'Fashionable Jackets',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    category: 'Outerwear',
    description: 'Stylish jackets to keep you warm and fashionable.'
  },
  'Sweaters': {
    name: 'Cozy Knit Sweaters',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop',
    category: 'Tops',
    description: 'Soft and warm knit sweaters for chilly days.'
  },
  'Jeans': {
    name: 'Classic Blue Jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    category: 'Bottoms',
    description: 'Timeless blue jeans with perfect fit and style.'
  },
  'Dresses': {
    name: 'Elegant Dresses',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
    category: 'Dresses',
    description: 'Beautiful and elegant dresses for special occasions.'
  }
}

export default function StorePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()
      setInventoryData(data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const getProductStock = (productId: string) => {
    if (!inventoryData?.inventory) return 0
    const item = inventoryData.inventory[productId]
    if (!item) return 0
    return item.stock - item.reserved
  }

  const getProductPrice = (productId: string) => {
    if (!inventoryData?.inventory) return 0
    const item = inventoryData.inventory[productId]
    if (!item) return 0
    return item.price
  }

  // Transform inventory data to products with metadata
  const getProducts = (): Product[] => {
    if (!inventoryData?.inventory) return []

    return Object.entries(inventoryData.inventory).map(([id, item]: [string, any]) => {
      const metadata = PRODUCT_METADATA[id] || {
        name: id,
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
        category: 'General',
        description: `${id} - Premium quality product.`
      }

      return {
        id,
        ...metadata,
        price: item.price,
        stock: item.stock,
        reserved: item.reserved
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Fashion Store</h1>
                <Badge variant="secondary">Premium Garments</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Order Processing
                </Link>
                <Link href="/inventory" className="text-gray-600 hover:text-gray-900">
                  Inventory
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Fashion Store</h1>
                <Badge variant="secondary">Premium Garments</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Order Processing
                </Link>
                <Link href="/inventory" className="text-gray-600 hover:text-gray-900">
                  Inventory
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Products</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchInventory} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const products = getProducts()

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Fashion Store</h1>
                <Badge variant="secondary">Premium Garments</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Order Processing
                </Link>
                <Link href="/inventory" className="text-gray-600 hover:text-gray-900">
                  Inventory
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <p className="text-gray-600">No products available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Fashion Store</h1>
              <Badge variant="secondary">Premium Garments</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Order Processing
              </Link>
              <Link href="/inventory" className="text-gray-600 hover:text-gray-900">
                Inventory
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Discover Your Style</h2>
          <p className="text-xl mb-8">Premium garments for every occasion</p>
          <Button size="lg" variant="secondary" onClick={fetchInventory}>
            Refresh Inventory
          </Button>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const availableStock = getProductStock(product.id)
            const currentPrice = getProductPrice(product.id) || product.price

            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setSelectedProduct(product)}
              >
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentPrice)}
                    </span>
                    <Button
                      size="sm"
                      disabled={availableStock === 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProduct(product)
                      }}
                    >
                      {availableStock > 0 ? 'Order Now' : 'Out of Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Product Sheet */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          availableStock={getProductStock(selectedProduct.id)}
          currentPrice={getProductPrice(selectedProduct.id) || selectedProduct.price}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

