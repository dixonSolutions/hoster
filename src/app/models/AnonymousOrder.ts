// Anonymous Order System Models for ServiceFuzz API Integration
// These models support the frictionless order submission system without authentication

export type PaymentPreference = 'pay_now' | 'pay_later';

// Universal response structure for anonymous order submissions
export interface AnonymousOrderResponse {
  OrderID: string;
  Status: string;
  Message: string;
}

// Service-to-Customer Anonymous Order Request
export interface AnonymousS2COrderRequest {
  EmailOrPhone: string;
  OrderID: string; // placeholder, API generates actual ID
  OrderDate: string; // ISO timestamp
  RequestedDeliveryDate: string; // ISO timestamp  
  Cost: number;
  Currency: string;
  AddressCountry: string;
  AddressState: string;
  AddressSuburb: string;
  AddressPostcode: string;
  AddressStreetAdr: string;
  DeliveryNote?: string;
  PaymentStatus: 'pending' | 'unconfirmed'; // based on PaymentPreference
  PaymentPreference: PaymentPreference;
  Services: AnonymousServiceSelection[];
}

// Customer-to-Service Anonymous Order Request
export interface AnonymousC2SOrderRequest {
  EmailOrPhone: string;
  OrderID: string; // placeholder, API generates actual ID
  OrderDate?: string; // optional ISO timestamp
  RequestedDeliveryDate?: string; // optional ISO timestamp
  Cost?: number; // optional
  Currency?: string; // optional
  PlaceID: string; // business location reference
  DeliveryNote?: string;
  PaymentStatus: 'pending' | 'unconfirmed'; // based on PaymentPreference
  PaymentPreference: PaymentPreference;
  Services: AnonymousServiceSelection[];
}

export interface AnonymousServiceSelection {
  BusinessID: string;
  ServiceID: string;
}

// Order status values for tracking
export type AnonymousOrderStatus = 
  | 'unconfirmed'           // pay_later orders awaiting confirmation
  | 'confirmed_pay_later'   // confirmed orders with deferred payment
  | 'pending'               // orders with active payment links
  | 'completed'             // successful payments
  | 'failed'                // payment failures
  | 'expired';              // expired payment or confirmation links

// Order status tracking response
export interface AnonymousOrderStatusResponse {
  OrderID: string;
  Status: AnonymousOrderStatus;
  Message: string;
  PaymentLink?: string; // available for confirmed_pay_later status
}

// Error response structure
export interface AnonymousOrderErrorResponse {
  errors: { [key: string]: string[] };
  title: string;
  status: number;
  traceId?: string;
}

// UI-specific interfaces for form handling
export interface OrderFormData {
  customerName: string;
  emailOrPhone: string;
  paymentPreference: PaymentPreference;
  serviceDate: Date;
  notes?: string;
  // Address fields for S2C orders
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Cart item with service details for order submission
export interface AnonymousOrderItem {
  service: {
    serviceID: string;
    businessID: string;
    serviceName: string;
    servicePrice: number;
    servicePriceCurrencyUnit: string;
  };
  quantity: number;
  selectedLocation?: {
    type: 'S2C' | 'C2S';
    placeID?: string; // for C2S orders
  };
}

// Complete order submission data
export interface AnonymousOrderSubmission {
  formData: OrderFormData;
  items: AnonymousOrderItem[];
  totalCost: number;
} 