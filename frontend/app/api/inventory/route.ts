import { NextRequest, NextResponse } from 'next/server';
import { temporalClient, TASK_QUEUE } from '@/lib/temporal';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface InventoryItem {
  stock: number;
  price: number;
  reserved: number;
  lastUpdated: string;
}

interface Inventory {
  [productId: string]: InventoryItem;
}

// Function to read inventory from JSON file
function readInventoryFromFile(): Inventory | null {
  try {
    // Try multiple possible paths to find the inventory file
    const possiblePaths = [
      join(process.cwd(), '..', 'backend', 'data', 'inventory.json'),
      join(process.cwd(), 'backend', 'data', 'inventory.json'),
      join(__dirname, '..', '..', '..', 'backend', 'data', 'inventory.json'),
      join(process.cwd(), '..', '..', 'backend', 'data', 'inventory.json')
    ];

    let inventoryPath = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        inventoryPath = path;
        break;
      }
    }

    if (!inventoryPath) {
      console.warn('Inventory file not found in any of these paths:', possiblePaths);
      console.warn('Current working directory:', process.cwd());
      return null;
    }

    console.log('Found inventory file at:', inventoryPath);

    const fileContent = readFileSync(inventoryPath, 'utf8');
    console.log('File content length:', fileContent.length);
    console.log('File content preview:', fileContent.substring(0, 200));

    const inventory = JSON.parse(fileContent) as Inventory;
    console.log('Parsed inventory keys:', Object.keys(inventory));
    console.log('Shirts stock:', inventory.Shirts?.stock);

    // Add lastUpdated timestamp if not present
    Object.keys(inventory).forEach(productId => {
      if (!inventory[productId].lastUpdated) {
        inventory[productId].lastUpdated = new Date().toISOString();
      }
    });

    return inventory;
  } catch (error) {
    console.error('Error reading inventory file:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    console.log('GET /api/inventory called with productId:', productId);

    // TEMPORARILY DISABLE TEMPORAL TO TEST FILE READING
    // Start a Temporal workflow to get inventory
    /*
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
    
    console.log('Temporal workflow successful, returning result');
    return NextResponse.json(result);
    */

    // Force file reading for testing
    throw new Error('Temporal temporarily disabled for testing');

  } catch (error) {
    console.error('Error getting inventory via Temporal:', error);
    console.log('Falling back to file reading...');

    // Fallback to reading from JSON file if Temporal is unavailable
    const inventory = readInventoryFromFile();

    if (!inventory) {
      console.log('File reading failed, using hardcoded fallback data');
      // If file reading fails, use minimal fallback data
      const fallbackInventory: Inventory = {
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
        const item = fallbackInventory[productId];
        if (!item) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }
        console.log('Returning fallback item for productId:', productId, 'stock:', item.stock);
        return NextResponse.json(item);
      } else {
        const products = Object.values(fallbackInventory);
        const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
        const totalReserved = products.reduce((sum, item) => sum + item.reserved, 0);
        const totalAvailable = totalStock - totalReserved;

        const stats = {
          totalProducts: products.length,
          totalStock,
          totalReserved,
          totalAvailable
        };

        console.log('Returning fallback inventory with stats:', stats);
        return NextResponse.json({
          inventory: fallbackInventory,
          stats,
          note: 'Using fallback data - Temporal service and file reading unavailable'
        });
      }
    }

    console.log('File reading successful, using file data');
    const productId = new URL(request.url).searchParams.get('productId');

    if (productId) {
      const item = inventory[productId];
      if (!item) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      console.log('Returning file item for productId:', productId, 'stock:', item.stock, 'reserved:', item.reserved);
      return NextResponse.json(item);
    } else {
      const products = Object.values(inventory);
      const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
      const totalReserved = products.reduce((sum, item) => sum + item.reserved, 0);
      const totalAvailable = totalStock - totalReserved;

      const stats = {
        totalProducts: products.length,
        totalStock,
        totalReserved,
        totalAvailable
      };

      console.log('Returning file inventory with stats:', stats);
      console.log('Shirts stock from file:', inventory.Shirts?.stock);
      return NextResponse.json({
        inventory,
        stats,
        note: 'Using file data - Temporal service unavailable'
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
