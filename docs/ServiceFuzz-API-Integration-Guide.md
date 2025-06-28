# ServiceFuzz API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating Angular business websites with the ServiceFuzz API for payment processing, order management, and business operations.

## Authentication Setup

### Bearer Token Implementation

All API requests require Bearer token authentication. The token should be included in the Authorization header for every request.

**Header Format:**
```
Authorization: Bearer {your-jwt-token}
```

## Core Business Operations

### 1. Business Registration and Management

#### Register Complete Business
**Endpoint:** `POST /api/BusinessRegistry/RegisterCompleteBusiness`

**Usage:**
```typescript
const businessData: BusinessRegistrationRequest = {
  basicInfo: {
    businessName: 'My Business',
    businessDescription: 'A comprehensive business description',
    phone: '+1234567890',
    email: 'business@example.com'
  },
  services: [{
    serviceName: 'Consultation',
    serviceDescription: 'Professional consultation service',
    duration: 60,
    price: 100.00,
    currency: 'USD'
  }],
  // ... other required fields
};

this.dataService.registerCompleteBusiness(businessData).subscribe({
  next: (response) => {
    console.log('Business registered:', response.businessID);
  },
  error: (error) => {
    console.error('Registration failed:', error);
  }
});
```

### 2. Order Management

#### Create Order
**Endpoint:** `POST /api/Order/CreateOrder`

**Usage:**
```typescript
const orderData: CreateOrderRequest = {
  userId: 'USER_123',
  businessId: 'BUS_123456',
  serviceId: 'SVC_123',
  placeId: 'PLACE_123',
  orderDate: new Date().toISOString(),
  requestedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  cost: 100.00,
  currency: 'USD',
  deliveryNote: 'Please deliver to front door',
  paymentStatus: 'Pending'
};

this.dataService.createOrder(orderData).subscribe({
  next: (response) => {
    console.log('Order created:', response.orderId);
  },
  error: (error) => {
    console.error('Order creation failed:', error);
  }
});
```

### 3. Payment Processing

#### Generate Payment Link
**Endpoint:** `POST /api/Subscription/GeneratePaymentLink`

**Usage:**
```typescript
const paymentData: PaymentLinkRequest = {
  businessId: 'BUS_123456',
  serviceId: 'SVC_123',
  amount: 100.00,
  currency: 'USD',
  description: 'Payment for Consultation Service',
  customerEmail: 'customer@example.com',
  successUrl: 'https://yourapp.com/payment/success',
  cancelUrl: 'https://yourapp.com/payment/cancel'
};

this.dataService.generatePaymentLink(paymentData).subscribe({
  next: (response) => {
    window.location.href = response.paymentLink;
  },
  error: (error) => {
    console.error('Payment link generation failed:', error);
  }
});
```

## Error Handling

### Common HTTP Status Codes

- **200 OK:** Successful operation
- **400 Bad Request:** Invalid request data or validation errors
- **401 Unauthorized:** Missing or invalid authentication token
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server-side error

### Error Response Structure
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## Security Considerations

### Token Management
- Store JWT tokens securely (HTTP-only cookies recommended)
- Implement token refresh logic
- Handle token expiration gracefully
- Never expose tokens in client-side code

### Data Validation
- Validate all input data on both client and server
- Sanitize user inputs to prevent injection attacks
- Use HTTPS for all API communications
- Implement rate limiting for API endpoints

## Testing

### Running Tests
```bash
# Run all tests
ng test

# Run specific test file
ng test --include="**/data-service.business-operations.spec.ts"
```

## Best Practices

1. **Always handle errors gracefully** - Use the provided error handling methods
2. **Validate data before sending** - Ensure all required fields are present
3. **Use TypeScript interfaces** - Leverage the provided type definitions
4. **Implement retry logic** - Use the retry mechanism for transient failures
5. **Log operations** - Maintain proper logging for debugging
6. **Test thoroughly** - Use the provided test suite and add more tests as needed 