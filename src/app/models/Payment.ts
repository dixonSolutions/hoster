export interface PaymentLinkRequest {
  businessId: string;
  serviceId?: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentLinkResponse {
  success: boolean;
  message: string;
  paymentLink: string;
  paymentIntentId: string;
  errors?: string[];
}

export interface StripeWebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  };
  type: string;
}

export interface PaymentIntent {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  customer?: string;
  payment_method?: string;
  created: number;
  metadata: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  object: string;
  billing_details: {
    address: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    email?: string;
    name?: string;
    phone?: string;
  };
  card?: {
    brand: string;
    checks: {
      address_line1_check?: string;
      address_postal_code_check?: string;
      cvc_check?: string;
    };
    country: string;
    exp_month: number;
    exp_year: number;
    fingerprint: string;
    funding: string;
    generated_from?: string;
    last4: string;
    networks: {
      available: string[];
      preferred?: string;
    };
    three_d_secure_usage?: {
      supported: boolean;
    };
    wallet?: string;
  };
  created: number;
  customer?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  type: string;
} 