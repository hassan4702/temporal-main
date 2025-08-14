// activities.ts
import { inventoryService } from './inventory-service';

export async function checkInventoryActivity({ productId, quantity }: { productId: string; quantity: number }) {
    try {
        // Use shared inventory service for thread-safe operations
        const result = await inventoryService.checkAndReserveInventory(productId, quantity);
        
        if (result.available) {
            console.log(`✅ Inventory check successful: Reserved ${result.reservedQuantity} ${productId} at $${result.unitPrice} each`);
        } else {
            console.log(`❌ Inventory check failed: Insufficient stock for ${quantity} ${productId}`);
        }
        
        return {
            available: result.available,
            reservedQuantity: result.reservedQuantity,
            unitPrice: result.unitPrice,
            reservationId: result.reservationId
        };
    } catch (error) {
        console.error('Error in checkInventoryActivity:', error);
        return { available: false, reservedQuantity: 0, unitPrice: 0 };
    }
}

export async function processPaymentActivity({ reservedQuantity, unitPrice, customerId }: { reservedQuantity: number; unitPrice: number; customerId: string }) {
    const totalAmount = reservedQuantity * unitPrice;
    
    // Test scenario: Payment failure for specific customer IDs
    if (customerId.includes('fail')) {
        console.log(`❌ Payment failed for customer: ${customerId}`);
        return { paymentSuccessful: false, transactionId: `TXN-FAILED-${Math.floor(Math.random() * 10000)}`, totalAmount };
    }
    
    const paymentSuccessful = Math.random() > 0.5; // 50% chance of success
    const transactionId = `TXN-${Math.floor(Math.random() * 10000)}`;
    
    if (paymentSuccessful) {
        console.log(`✅ Payment successful: ${transactionId}, amount: ${totalAmount}`);
    } else {
        console.log(`❌ Payment failed: ${transactionId}, amount: ${totalAmount}`);
    }
    
    return { paymentSuccessful, transactionId, totalAmount };
}

export async function releaseInventoryActivity({ productId, quantity }: { productId: string; quantity: number }) {
    try {
        // Use shared inventory service to release reserved items
        const result = await inventoryService.releaseInventory(productId, quantity);
        
        if (result.released) {
            console.log(`✅ Released ${quantity} of ${productId} back to inventory`);
        } else {
            console.log(`❌ Failed to release ${quantity} of ${productId}`);
        }
        
        return { released: result.released };
    } catch (error) {
        console.error('Error in releaseInventoryActivity:', error);
        return { released: false };
    }
}

export async function confirmInventoryActivity({ productId, quantity }: { productId: string; quantity: number }) {
    try {
        // Use shared inventory service to confirm the reservation
        const result = await inventoryService.confirmInventory(productId, quantity);
        
        if (result.confirmed) {
            console.log(`✅ Confirmed ${quantity} of ${productId} - stock reduced`);
        } else {
            console.log(`❌ Failed to confirm ${quantity} of ${productId}`);
        }
        
        return { confirmed: result.confirmed };
    } catch (error) {
        console.error('Error in confirmInventoryActivity:', error);
        return { confirmed: false };
    }
}

export async function calculateShippingActivity({ reservedQuantity, totalAmount, customerAddress }: { reservedQuantity: number; totalAmount: number; customerAddress: string }) {
    const shippingCost = reservedQuantity * 10;
    const estimatedDelivery = `${3 + Math.floor(Math.random() * 5)} business days`;
    
    console.log(`📦 Shipping calculated: ${shippingCost} for ${reservedQuantity} items to ${customerAddress}`);
    
    return { shippingCost, estimatedDelivery, finalTotal: totalAmount + shippingCost };
}


export async function getInventoryActivity({ productId }: { productId?: string | undefined }) {
    try {
        const inventory = await inventoryService.getInventoryStatus(productId);
        const stats = inventoryService.getInventoryStats();
        
        return {
            inventory,
            stats
        };
    } catch (error) {
        console.error('Error in getInventoryActivity:', error);
        return { inventory: [], stats: { totalProducts: 0, totalQuantity: 0 } };
    }
}

export async function resetInventoryActivity() {
    try {
        await inventoryService.resetInventory();
        console.log('✅ Inventory reset successfully');
        return { reset: true };
    } catch (error) {
        console.error('Error in resetInventoryActivity:', error);
        return { reset: false };
    }
}
