
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface InventoryItem {
  stock: number;
  price: number;
  reserved: number;
  lastUpdated: string;
}

export interface Inventory {
  [productId: string]: InventoryItem;
}

class InventoryService {
  private static instance: InventoryService;
  private inventory: Inventory = {};
  private readonly dataFile = join(__dirname, '../data/inventory.json');
  private isInitialized = false;

  private constructor() {
    this.ensureDataDirectory();
    this.loadInventory(); 
  }

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  private ensureDataDirectory(): void {
    const dataDir = join(__dirname, '../data');
    if (!existsSync(dataDir)) {
      const fs = require('fs');
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadInventory(): void {
    try {
      if (existsSync(this.dataFile)) {
        const data = readFileSync(this.dataFile, 'utf8');
        this.inventory = JSON.parse(data);
        console.log('Inventory loaded from file');
      } else {
        this.inventory = {
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
        this.saveInventory();
        console.log('Default inventory initialized');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading inventory:', error);
      this.inventory = {
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
      this.isInitialized = true;
    }
  }

  private saveInventory(): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.inventory, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }

  async checkAndReserveInventory(productId: string, quantity: number): Promise<{
    available: boolean;
    reservedQuantity: number;
    unitPrice: number;
    reservationId?: string;
  }> {
    if (!this.isInitialized) {
      throw new Error('Inventory service not initialized');
    }

    const item = this.inventory[productId];
    if (!item) {
      return { available: false, reservedQuantity: 0, unitPrice: 0 };
    }

    const availableStock = item.stock - item.reserved;

    if (availableStock < quantity) {
      console.log(`Insufficient stock: Requested ${quantity} ${productId}, available: ${availableStock}`);
      return { available: false, reservedQuantity: 0, unitPrice: 0 };
    }

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.inventory[productId] = {
      ...item,
      reserved: item.reserved + quantity,
      lastUpdated: new Date().toISOString()
    };

    this.saveInventory();

    console.log(`Reserved ${quantity} ${productId}, remaining available: ${item.stock - this.inventory[productId].reserved}`);

    return {
      available: true,
      reservedQuantity: quantity,
      unitPrice: item.price,
      reservationId
    };
  }

  async releaseInventory(productId: string, quantity: number): Promise<{ released: boolean }> {
    if (!this.isInitialized) {
      throw new Error('Inventory service not initialized');
    }

    const item = this.inventory[productId];
    if (!item) {
      console.error(`Product ${productId} not found in inventory`);
      return { released: false };
    }

    const newReserved = Math.max(0, item.reserved - quantity);

    this.inventory[productId] = {
      ...item,
      reserved: newReserved,
      lastUpdated: new Date().toISOString()
    };

    this.saveInventory();

    console.log(`Released ${quantity} ${productId}, remaining reserved: ${newReserved}`);
    return { released: true };
  }

  async confirmInventory(productId: string, quantity: number): Promise<{ confirmed: boolean }> {
    if (!this.isInitialized) {
      throw new Error('Inventory service not initialized');
    }

    const item = this.inventory[productId];
    if (!item) {
      console.error(`Product ${productId} not found in inventory`);
      return { confirmed: false };
    }

    const newStock = Math.max(0, item.stock - quantity);
    const newReserved = Math.max(0, item.reserved - quantity);

    this.inventory[productId] = {
      ...item,
      stock: newStock,
      reserved: newReserved,
      lastUpdated: new Date().toISOString()
    };

    this.saveInventory();

    console.log(`Confirmed ${quantity} ${productId}, new stock: ${newStock}, remaining reserved: ${newReserved}`);
    return { confirmed: true };
  }

  async getInventoryStatus(productId?: string): Promise<Inventory | InventoryItem | null> {
    if (!this.isInitialized) {
      throw new Error('Inventory service not initialized');
    }

    if (productId) {
      return this.inventory[productId] || null;
    }

    return { ...this.inventory };
  }

  async resetInventory(): Promise<void> {
    this.loadInventory();
    console.log('Inventory reset to default values');
  }

  getInventoryStats(): {
    totalProducts: number;
    totalStock: number;
    totalReserved: number;
    totalAvailable: number;
  } {
    const products = Object.values(this.inventory);
    const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
    const totalReserved = products.reduce((sum, item) => sum + item.reserved, 0);
    const totalAvailable = totalStock - totalReserved;

    return {
      totalProducts: products.length,
      totalStock,
      totalReserved,
      totalAvailable
    };
  }
}

export const inventoryService = InventoryService.getInstance();
