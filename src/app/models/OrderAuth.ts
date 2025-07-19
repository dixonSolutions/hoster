// Order Authentication Models for Magic Link System

export interface MagicLinkEmailRequest {
  email: string;
  linkFormat: string;
}

export interface MagicLinkPhoneRequest {
  phoneNumber: string;
  linkFormat: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export interface ValidateMagicLinkRequest {
  magicLinkId: string;
}

export interface ValidateMagicLinkResponse {
  isValid: boolean;
  message: string;
  errors?: string[];
}

// Service-to-Customer Order (S2C) - Business provides services at customer location
export interface CreateS2COrderRequest {
  emailOrPhone: string;
  orderID: string;
  orderDate: string;
  requestedDeliveryDate: string;
  cost: number;
  currency: string;
  addressCountry: string;
  addressState: string;
  addressSuburb: string;
  addressPostcode: string;
  addressStreetAdr: string;
  deliveryNote?: string;
  paymentStatus: string;
  services: ServiceSelection[];
}

// Customer-to-Service Order (C2S) - Customer visits business location
export interface CreateC2SOrderRequest {
  emailOrPhone: string;
  orderID: string;
  orderDate: string;
  requestedDeliveryDate: string;
  cost: number;
  currency: string;
  placeID: string;
  deliveryNote?: string;
  paymentStatus: string;
  services: ServiceSelection[];
}

export interface ServiceSelection {
  BusinessID: string;
  ServiceID: string;
}

export interface OrderAuthResponse {
  success: boolean;
  message: string;
  orderId?: string;
  errors?: string[];
}

export interface OrderStatusResponse {
  orderId: string;
  paymentStatus: string;
  message: string;
}

// Auth token management
export interface AuthToken {
  token: string;
  expiresAt: Date;
  emailOrPhone: string;
  type: 'email' | 'phone';
}

// Order type determination
export enum OrderType {
  S2C = 'service-to-customer',
  C2S = 'customer-to-service'
}

// Location types for services  
export interface ServiceLocation {
  id: string;
  name: string;
  type: OrderType;
  placeID?: string; // for C2S orders
  address?: string; // for display purposes
}

// Extended service info with location options
export interface ServiceWithLocations {
  serviceID: string;
  serviceName: string;
  serviceDescription: string;
  businessID: string;
  serviceEstimatedTime: string;
  servicePrice: number;
  servicePriceCurrencyUnit: string;
  serviceImageUrl?: string;
  locations: ServiceLocation[];
} 