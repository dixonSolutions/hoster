import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AnonymousS2COrderRequest,
  AnonymousC2SOrderRequest,
  AnonymousOrderResponse,
  AnonymousOrderStatusResponse,
  AnonymousOrderErrorResponse,
  PaymentPreference,
  AnonymousOrderSubmission,
  AnonymousOrderItem,
  OrderFormData
} from '../models/AnonymousOrder';

@Injectable({
  providedIn: 'root'
})
export class AnonymousOrderService {
  private readonly apiBaseUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api';
  private readonly orderUrl = `${this.apiBaseUrl}/Order`;

  constructor(private http: HttpClient) {}

  // ==================== ANONYMOUS ORDER SUBMISSION ====================

  /**
   * Create Service-to-Customer order anonymously
   * No authentication headers required
   */
  createS2COrder(orderData: AnonymousS2COrderRequest): Observable<AnonymousOrderResponse> {
    console.log('🛒 Creating anonymous S2C Order...');
    console.log('📦 S2C Order Data:', {
      OrderID: orderData.OrderID,
      EmailOrPhone: orderData.EmailOrPhone,
      Cost: orderData.Cost,
      Currency: orderData.Currency,
      PaymentPreference: orderData.PaymentPreference,
      PaymentStatus: orderData.PaymentStatus,
      ServicesCount: orderData.Services.length
    });

    // Create headers WITHOUT authorization - completely anonymous
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AnonymousOrderResponse>(
      `${this.orderUrl}/CreateS2COrder`,
      orderData,
      { headers }
    ).pipe(
      map(response => {
        console.log('✅ S2C Order created successfully:', response);
        this.logWorkflowInfo(orderData.PaymentPreference, response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Create Customer-to-Service order anonymously
   * No authentication headers required
   */
  createC2SOrder(orderData: AnonymousC2SOrderRequest): Observable<AnonymousOrderResponse> {
    console.log('🛒 Creating anonymous C2S Order...');
    console.log('📦 C2S Order Data:', {
      OrderID: orderData.OrderID,
      EmailOrPhone: orderData.EmailOrPhone,
      Cost: orderData.Cost,
      Currency: orderData.Currency,
      PlaceID: orderData.PlaceID,
      PaymentPreference: orderData.PaymentPreference,
      PaymentStatus: orderData.PaymentStatus,
      ServicesCount: orderData.Services.length
    });

    // Create headers WITHOUT authorization - completely anonymous
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AnonymousOrderResponse>(
      `${this.orderUrl}/CreateC2SOrder`,
      orderData,
      { headers }
    ).pipe(
      map(response => {
        console.log('✅ C2S Order created successfully:', response);
        this.logWorkflowInfo(orderData.PaymentPreference, response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== ORDER STATUS TRACKING ====================

  /**
   * Check order status (requires authentication)
   * This endpoint is different from submission - it requires auth
   */
  getOrderStatus(orderId: string, authToken: string): Observable<AnonymousOrderStatusResponse> {
    console.log(`🔍 Checking status for order: ${orderId}`);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'OrderAuth': authToken // Special auth header for status checking
    });

    return this.http.get<AnonymousOrderStatusResponse>(
      `${this.orderUrl}/${orderId}/status`,
      { headers }
    ).pipe(
      map(response => {
        console.log('📊 Order status retrieved:', response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== ORDER BUILDING UTILITIES ====================

  /**
   * Build S2C order request from form data and cart items
   */
  buildS2COrderRequest(
    formData: OrderFormData,
    items: AnonymousOrderItem[],
    totalCost: number
  ): AnonymousS2COrderRequest {
    const paymentStatus = formData.paymentPreference === 'pay_now' ? 'pending' : 'unconfirmed';
    
    return {
      EmailOrPhone: formData.emailOrPhone,
      OrderID: this.generateOrderId(), // placeholder
      OrderDate: this.formatDateTimeFor24HourAPI(new Date()),
      RequestedDeliveryDate: this.formatDateTimeFor24HourAPI(formData.serviceDate),
      Cost: totalCost,
      Currency: items[0]?.service.servicePriceCurrencyUnit || 'AUD',
      AddressCountry: formData.country || 'Australia',
      AddressState: formData.state || '',
      AddressSuburb: formData.city || '',
      AddressPostcode: formData.postalCode || '',
      AddressStreetAdr: formData.address || '',
      DeliveryNote: formData.notes || '',
      PaymentStatus: paymentStatus,
      PaymentPreference: formData.paymentPreference,
      Services: items.map(item => ({
        BusinessID: item.service.businessID,
        ServiceID: item.service.serviceID
      }))
    };
  }

  /**
   * Build C2S order request from form data and cart items
   */
  buildC2SOrderRequest(
    formData: OrderFormData,
    items: AnonymousOrderItem[],
    totalCost: number,
    placeID: string
  ): AnonymousC2SOrderRequest {
    const paymentStatus = formData.paymentPreference === 'pay_now' ? 'pending' : 'unconfirmed';
    
    return {
      EmailOrPhone: formData.emailOrPhone,
      OrderID: this.generateOrderId(), // placeholder
      OrderDate: this.formatDateTimeFor24HourAPI(new Date()),
      RequestedDeliveryDate: this.formatDateTimeFor24HourAPI(formData.serviceDate),
      Cost: totalCost,
      Currency: items[0]?.service.servicePriceCurrencyUnit || 'AUD',
      PlaceID: placeID,
      DeliveryNote: formData.notes || '',
      PaymentStatus: paymentStatus,
      PaymentPreference: formData.paymentPreference,
      Services: items.map(item => ({
        BusinessID: item.service.businessID,
        ServiceID: item.service.serviceID
      }))
    };
  }

  // ==================== VALIDATION UTILITIES ====================

  /**
   * Validate email or phone number format
   */
  validateEmailOrPhone(value: string): { isValid: boolean; type: 'email' | 'phone' | 'unknown' } {
    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Phone regex (various formats)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

    if (emailRegex.test(value)) {
      return { isValid: true, type: 'email' };
    } else if (phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return { isValid: true, type: 'phone' };
    } else {
      return { isValid: false, type: 'unknown' };
    }
  }

  /**
   * Validate order form data
   */
  validateOrderForm(formData: OrderFormData, hasS2CServices: boolean): string[] {
    const errors: string[] = [];

    if (!formData.customerName?.trim()) {
      errors.push('Customer name is required');
    }

    if (!formData.emailOrPhone?.trim()) {
      errors.push('Email or phone number is required');
    } else {
      const validation = this.validateEmailOrPhone(formData.emailOrPhone);
      if (!validation.isValid) {
        errors.push('Please enter a valid email address or phone number');
      }
    }

    if (!formData.paymentPreference) {
      errors.push('Payment preference is required');
    }

    if (!formData.serviceDate) {
      errors.push('Service date is required');
    }

    // Address validation for S2C services
    if (hasS2CServices) {
      if (!formData.address?.trim()) {
        errors.push('Address is required for home/mobile services');
      }
      if (!formData.city?.trim()) {
        errors.push('City is required for home/mobile services');
      }
      if (!formData.state?.trim()) {
        errors.push('State is required for home/mobile services');
      }
      if (!formData.postalCode?.trim()) {
        errors.push('Postal code is required for home/mobile services');
      }
    }

    return errors;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate placeholder order ID (API will replace with actual ID)
   */
  private generateOrderId(): string {
    return `PLACEHOLDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log workflow information based on payment preference
   */
  private logWorkflowInfo(paymentPreference: PaymentPreference, response: AnonymousOrderResponse): void {
    if (paymentPreference === 'pay_now') {
      console.log('💳 Pay Now Workflow: Payment link will be sent immediately');
      console.log(`📧 Expected: "${response.Message}" - payment link delivered via email/SMS`);
    } else {
      console.log('⏰ Pay Later Workflow: Confirmation link will be sent first');
      console.log(`📧 Expected: "${response.Message}" - confirmation link delivered via email/SMS`);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Anonymous order API error:', error);

    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorDetails: any = null;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400 && error.error?.errors) {
        // Validation errors
        const validationErrors = error.error as AnonymousOrderErrorResponse;
        const errorMessages = Object.values(validationErrors.errors).flat();
        errorMessage = `Validation failed: ${errorMessages.join(', ')}`;
        errorDetails = validationErrors;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the service. Please check your internet connection.';
      } else {
        errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }

    // Return error with additional context
    const enhancedError = {
      message: errorMessage,
      originalError: error,
      details: errorDetails
    };

    return throwError(() => enhancedError);
  }

  // ==================== PUBLIC UTILITIES ====================

  /**
   * Get user-friendly message for payment preferences
   */
  getPaymentPreferenceDescription(preference: PaymentPreference): string {
    return preference === 'pay_now' 
      ? 'Pay immediately - receive payment link right away'
      : 'Pay later - confirm order first, then receive payment link';
  }

  /**
   * Get expected workflow message for UI display
   */
  getWorkflowMessage(preference: PaymentPreference, communicationType: 'email' | 'phone'): string {
    const method = communicationType === 'email' ? 'email' : 'SMS';
    
    if (preference === 'pay_now') {
      return `A payment link will be sent to your ${method} immediately. Complete payment to confirm your order.`;
    } else {
      return `A confirmation link will be sent to your ${method}. Click to confirm your order, then you can pay when ready.`;
    }
  }

  /**
   * Format date and time for 24-hour API format
   * Supports both "2025-08-11T09:00:00Z" and "2025-08-11 09:00:00" formats
   */
  formatDateTimeFor24HourAPI(date: Date): string {
    // Get the date part in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get the time part in HH:mm:ss format (24-hour)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Return in ISO format with Z timezone indicator
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  }
} 