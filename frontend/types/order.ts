export interface OrderRequest {
  productId: string;
  quantity: number;
  customerId: string;
  customerAddress: string;
}

export interface OrderResponse {
  workflowId: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface WorkflowResult {
  status: string;
  transactionId?: string;
  shipping?: {
    shippingCost: number;
    estimatedDelivery: string;
    finalTotal: number;
  };
  refunded?: boolean;
}

export interface WorkflowHistory {
  events: Array<{
    timestamp: string;
    activity: string;
    status: 'started' | 'completed' | 'failed' | 'scheduled';
  }>;
}

export interface WorkflowStatus {
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TERMINATED' | 'processing' | 'failed' | 'unknown';
  result?: WorkflowResult;
  error?: string;
}

export interface ActivityProgress {
  inventoryCheck: 'pending' | 'completed' | 'failed';
  paymentProcessing: 'pending' | 'completed' | 'failed';
  shippingCalculation: 'pending' | 'completed' | 'failed';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
}

export interface OrderSummary {
  workflowId: string;
  product: Product;
  quantity: number;
  customerId: string;
  customerAddress: string;
  status: WorkflowStatus['status'];
  totalAmount?: number;
  shippingCost?: number;
  estimatedDelivery?: string;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}
