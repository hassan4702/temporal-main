import { NextRequest, NextResponse } from 'next/server';
import { temporalClient, TASK_QUEUE } from '@/lib/temporal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    // Start a Temporal workflow to get inventory
    const workflowId = `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const handle = await temporalClient.workflow.start('GetInventoryWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [{ productId: productId || undefined }],
    });

    // Wait for the workflow to complete
    const result = await handle.result();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get inventory');
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting inventory via Temporal:', error);
    
    // Fallback to mock data if Temporal is unavailable
    const mockInventory = {
      "Shirts": { stock: 10, price: 100, reserved: 0, lastUpdated: new Date().toISOString() },
      "Pants": { stock: 20, price: 200, reserved: 0, lastUpdated: new Date().toISOString() },
      "Shoes": { stock: 30, price: 300, reserved: 0, lastUpdated: new Date().toISOString() },
      "Hats": { stock: 40, price: 400, reserved: 0, lastUpdated: new Date().toISOString() },
      "Socks": { stock: 50, price: 500, reserved: 0, lastUpdated: new Date().toISOString() },
      "Gloves": { stock: 60, price: 600, reserved: 0, lastUpdated: new Date().toISOString() },
      "Jackets": { stock: 70, price: 700, reserved: 0, lastUpdated: new Date().toISOString() },
      "Sweaters": { stock: 80, price: 800, reserved: 0, lastUpdated: new Date().toISOString() },
      "Jeans": { stock: 90, price: 900, reserved: 0, lastUpdated: new Date().toISOString() },
      "Dresses": { stock: 100, price: 1000, reserved: 0, lastUpdated: new Date().toISOString() }
    };

    const productId = new URL(request.url).searchParams.get('productId');
    
    if (productId) {
      const item = mockInventory[productId as keyof typeof mockInventory];
      if (!item) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(item);
    } else {
      const products = Object.values(mockInventory);
      const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
      const totalReserved = products.reduce((sum, item) => sum + item.reserved, 0);
      const totalAvailable = totalStock - totalReserved;
      
      const stats = {
        totalProducts: products.length,
        totalStock,
        totalReserved,
        totalAvailable
      };
      
      return NextResponse.json({
        inventory: mockInventory,
        stats,
        note: 'Using fallback data - Temporal service unavailable'
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'reset') {
      // Start a Temporal workflow to reset inventory
      const workflowId = `reset-inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const handle = await temporalClient.workflow.start('ResetInventoryWorkflow', {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [],
      });

      // Wait for the workflow to complete
      const result = await handle.result();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset inventory');
      }
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating inventory via Temporal:', error);
    
    return NextResponse.json(
      { error: 'Failed to update inventory - Temporal service unavailable' },
      { status: 503 }
    );
  }
}
