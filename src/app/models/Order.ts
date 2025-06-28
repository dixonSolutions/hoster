export interface CreateOrderRequest {
  userId: string;
  businessId: string;
  serviceId: string;
  placeId: string;
  orderDate: string;
  requestedDeliveryDate: string;
  cost: number;
  currency: string;
  deliveryNote?: string;
  paymentStatus: string;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  errors?: string[];
}

export interface OrderDetails {
  orderId: string;
  userId: string;
  businessId: string;
  serviceId: string;
  placeId: string;
  orderDate: string;
  requestedDeliveryDate: string;
  actualDeliveryDate?: string;
  cost: number;
  currency: string;
  deliveryNote?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentDetails?: PaymentDetails;
  deliveryDetails?: DeliveryDetails;
}

export enum PaymentStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
  Refunded = 'Refunded',
  Cancelled = 'Cancelled'
}

export enum OrderStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  InProgress = 'InProgress',
  Ready = 'Ready',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface PaymentDetails {
  paymentId: string;
  paymentMethod: string;
  paymentDate?: string;
  amount: number;
  currency: string;
  transactionId?: string;
}

export interface DeliveryDetails {
  deliveryAddress: string;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryStatus: DeliveryStatus;
}

export enum DeliveryStatus {
  Pending = 'Pending',
  InTransit = 'InTransit',
  Delivered = 'Delivered',
  Failed = 'Failed'
} 