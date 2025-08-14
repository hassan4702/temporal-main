// workflows.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { 
  checkInventoryActivity, 
  processPaymentActivity, 
  releaseInventoryActivity, 
  confirmInventoryActivity,
  calculateShippingActivity,
  getInventoryActivity,
  resetInventoryActivity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds'
});

export async function ProcessOrderWorkflow(input: {
  productId: string;
  quantity: number;
  customerId: string;
  customerAddress: string;
}) {
  // Step 1: Check inventory and reserve items
  const inventory = await checkInventoryActivity({
    productId: input.productId,
    quantity: input.quantity
  });

  if (!inventory.available) {
    return { status: 'Out of Stock' };
  }

  // Step 2: Process payment
  const payment = await processPaymentActivity({
    reservedQuantity: inventory.reservedQuantity,
    unitPrice: inventory.unitPrice,
    customerId: input.customerId
  });

  if (!payment.paymentSuccessful) {
    // Compensating transaction: release inventory
    await releaseInventoryActivity({
      productId: input.productId,
      quantity: inventory.reservedQuantity
    });

    return {
      status: 'Payment Failed',
      transactionId: payment.transactionId,
      refunded: false
    };
  }

  // Step 3: Confirm inventory (reduce actual stock)
  const inventoryConfirmed = await confirmInventoryActivity({
    productId: input.productId,
    quantity: inventory.reservedQuantity
  });

  if (!inventoryConfirmed.confirmed) {
    // If inventory confirmation fails, we need to handle this
    // For now, we'll still proceed but log the issue
    console.error('Inventory confirmation failed, but proceeding with order');
  }

  // Step 4: Calculate shipping
  const shipping = await calculateShippingActivity({
    reservedQuantity: inventory.reservedQuantity,
    totalAmount: payment.totalAmount,
    customerAddress: input.customerAddress
  });

  return {
    status: 'Order Confirmed',
    transactionId: payment.transactionId,
    shipping,
    inventoryReservationId: inventory.reservationId
  };
}

// New inventory management workflows
export async function GetInventoryWorkflow(input: { productId?: string }) {
  const result = await getInventoryActivity({ productId: input.productId || undefined });
  return result;
}

export async function ResetInventoryWorkflow() {
  const result = await resetInventoryActivity();
  return result;
}
