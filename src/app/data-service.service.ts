import { inject, Injectable } from '@angular/core';
import { Account } from './models/account';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { BussinessBasicInfo } from './models/BussinessBasicInfo';
import { ServicesForBusiness } from './models/ServicesForBusiness';
import { User } from './models/user';
import { MessageService } from 'primeng/api';

// New imports for business operations
import { 
  BusinessRegistrationRequest, 
  BusinessRegistrationResponse,
  BusinessRegistrationFullResponse
} from './models/BusinessRegistration';
import { BusinessScheduleRequest } from './models/BusinessSchedule';
import { 
  CreateOrderRequest, 
  OrderResponse, 
  OrderDetails 
} from './models/Order';
import { 
  PaymentLinkRequest, 
  PaymentLinkResponse,
  StripeWebhookPayload 
} from './models/Payment';
import { 
  ApiResponse, 
  PaginatedResponse, 
  ErrorResponse, 
  ApiError,
  HttpOptions 
} from './models/ApiResponse';

export interface CartItem {
  service: ServicesForBusiness;
  quantity: number;
}

interface EmailVerificationRequest {
  to: string;
  from: string;
  email: string;
  subject: string;
  message:string;
}

interface TokenResponse {
  result: string;
  id: number;
  exception: any;
  status: number;
  isCanceled: boolean;
  isCompleted: boolean;
  isCompletedSuccessfully: boolean;
  creationOptions: number;
  asyncState: any;
  isFaulted: boolean;
}

interface GoogleClientRegistrationRequest {
  googleToken: string;
  businessId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataServiceService {
  private messageService = inject(MessageService);
  User: Account | undefined;
  JWTtoken: string | undefined;
  itemsInCart: number = 0;
  CartItems: CartItem[] = [];
  BasicBusinessInfo: BussinessBasicInfo | undefined;
  services: ServicesForBusiness[] | undefined;
  businessID: string = "BUS_31f5ebdc-df3f-4027-a914-c5a980b3df34";
  urlForServicesForBusiness: string = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/Marketplace/GetServicesForBusiness?businessId=';
  userID: string = "52127991-3353-4251-b731-6da879272ab1";
  URLforJWTtoken: string = "https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/User/GetUserById/";
  UrlforBusinessBasicInfo: string = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/Business/GetBusinessByBusinessID?businessID=';
  private apiUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api'; // Updated to Azure API URL
  
  // New API endpoints for business operations
  private businessRegistryUrl = `${this.apiUrl}/BusinessRegistry`;
  private managesBusinessesUrl = `${this.apiUrl}/ManagesBusinesses`;
  private orderUrl = `${this.apiUrl}/Order`;
  private subscriptionUrl = `${this.apiUrl}/Subscription`;
  private stripeWebhookUrl = `${this.apiUrl}/StripeWebhook`;
  user: User = {} as User;
  private authToken: string = '';

  constructor(private http: HttpClient) { }

  getUserById(id: string): Observable<{ user: Account, token: TokenResponse }> {
    return this.http.get<{ user: Account, token: TokenResponse }>(`${this.URLforJWTtoken}${id}`);
  }

  getBusinessByBusinessID(businessID: string, token: string): Observable<BussinessBasicInfo> {
    if (!token) {
      throw new Error('JWT token is required');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<BussinessBasicInfo>(`${this.UrlforBusinessBasicInfo}${businessID}`, { headers });
  }

  getServicesForBusiness(businessId: string, token: string): Observable<ServicesForBusiness[]> {
    if (!token) {
      throw new Error('JWT token is required');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ServicesForBusiness[]>(`${this.urlForServicesForBusiness}${businessId}`, { headers });
  }
  generateSecureCode(length: number = 6): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte % 10).join('');
  }
 

  AddToCart(service: ServicesForBusiness) {
    const existing = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (existing) {
      existing.quantity++;
    } else {
      this.CartItems.push({ service, quantity: 1 });
    }
    this.updateItemsInCart();
    }

  RemoveFromCart(service: ServicesForBusiness) {
    this.CartItems = this.CartItems.filter(item => item.service.serviceID !== service.serviceID);
    this.updateItemsInCart();
  }

  IncrementQuantity(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (item) item.quantity++;
    this.updateItemsInCart();
  }

  DecrementQuantity(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    if (item && item.quantity > 1) {
      item.quantity--;
    } else if (item) {
      this.RemoveFromCart(service);
    }
    this.updateItemsInCart();
  }

  updateItemsInCart() {
    this.itemsInCart = this.CartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
  getQuanityOfServiceInCart(service: ServicesForBusiness) {
    const item = this.CartItems.find(item => item.service.serviceID === service.serviceID);
    return item ? item.quantity : 0;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  getAuthToken(): string {
    return this.authToken;
  }

  createUser(user: User): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(`${this.apiUrl}/auth/google`, user, { headers });
  }

  generateSecurityCode(length: number): string {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, duration: number = 5000) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: duration,
    });
  }

  // Legacy method for backward compatibility
  openSnackBar(component: any, duration: number, message: string, action: string) {
    // Determine severity based on message content
    let severity: 'success' | 'info' | 'warn' | 'error' = 'info';
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
      severity = 'error';
    } else if (message.toLowerCase().includes('success') || message.toLowerCase().includes('added to cart')) {
      severity = 'success';
    } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('empty')) {
      severity = 'warn';
    }
    
    this.showToast(severity, action, message, duration);
  }

  // ==================== BUSINESS REGISTRATION OPERATIONS ====================

  /**
   * Register a complete business with all details
   */
  registerCompleteBusiness(businessData: BusinessRegistrationRequest): Observable<BusinessRegistrationResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<BusinessRegistrationResponse>(
      `${this.businessRegistryUrl}/RegisterCompleteBusiness`,
      businessData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get business registration details
   */
  getBusinessRegistration(businessId: string): Observable<BusinessRegistrationFullResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('businessId', businessId);
    return this.http.get<BusinessRegistrationFullResponse>(
      `${this.businessRegistryUrl}/GetBusinessRegistration`,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update business registration
   */
  updateBusinessRegistration(businessId: string, businessData: BusinessRegistrationRequest): Observable<BusinessRegistrationResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('businessId', businessId);
    return this.http.put<BusinessRegistrationResponse>(
      `${this.businessRegistryUrl}/UpdateBusinessRegistration`,
      businessData,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== BUSINESS SCHEDULE OPERATIONS ====================

  /**
   * Register business schedule
   */
  registerBusinessSchedule(businessId: string, scheduleData: BusinessScheduleRequest): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('businessId', businessId);
    return this.http.post<ApiResponse>(
      `${this.businessRegistryUrl}/RegisterBusinessSchedule`,
      scheduleData,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get business schedule with exceptions
   */
  getBusinessSchedule(businessId: string): Observable<BusinessScheduleRequest> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('businessId', businessId);
    return this.http.get<BusinessScheduleRequest>(
      `${this.managesBusinessesUrl}/GetBusinessScheduleWithExceptions`,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== ORDER MANAGEMENT OPERATIONS ====================
  
  /**
   * Create a new order (DEPRECATED - Use OrderAuthService for new magic link authentication)
   * @deprecated Use OrderAuthService.createS2COrder or OrderAuthService.createC2SOrder instead
   */
  createOrder(orderData: CreateOrderRequest): Observable<OrderResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<OrderResponse>(
      `${this.orderUrl}/CreateOrder`,
      orderData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if new Order Authentication system should be used
   * @returns true if magic link authentication is available
   */
  shouldUseOrderAuth(): boolean {
    // Check if we're in an environment that supports the new auth system
    return typeof window !== 'undefined' && 
           !!window.location.origin && 
           !this.isLegacyMode();
  }

  /**
   * Check if we're in legacy mode (fallback to old system)
   */
  private isLegacyMode(): boolean {
    // Can be configured via environment or feature flags
    return false; // For now, always use new system when available
  }

  /**
   * Get order authentication recommendation
   * @returns recommendation for which authentication system to use
   */
  getOrderAuthRecommendation(): 'magic-link' | 'legacy' | 'either' {
    if (this.shouldUseOrderAuth()) {
      return 'magic-link';
    }
    
    // If OrderAuth is not available, fall back to legacy
    return 'legacy';
  }

  /**
   * Get order details
   */
  getOrder(orderId: string): Observable<OrderDetails> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('orderId', orderId);
    return this.http.get<OrderDetails>(
      `${this.orderUrl}/GetOrder`,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== PAYMENT PROCESSING OPERATIONS ====================

  /**
   * Generate payment link for Stripe
   */
  generatePaymentLink(paymentData: PaymentLinkRequest): Observable<PaymentLinkResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<PaymentLinkResponse>(
      `${this.subscriptionUrl}/GeneratePaymentLink`,
      paymentData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Process Stripe webhook
   */
  processStripeWebhook(webhookPayload: StripeWebhookPayload, signature: string): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Stripe-Signature': signature
    });
    return this.http.post<ApiResponse>(
      `${this.stripeWebhookUrl}/ProcessWebhook`,
      webhookPayload,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== USER BUSINESS MANAGEMENT ====================

  /**
   * Get all businesses for a user
   */
  getAllBusinessesForUser(userId: string): Observable<BusinessRegistrationRequest[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('userId', userId);
    return this.http.get<BusinessRegistrationRequest[]>(
      `${this.managesBusinessesUrl}/GetAllBusinessesForUser`,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a business
   */
  deleteBusiness(businessId: string): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('businessId', businessId);
    return this.http.delete<ApiResponse>(
      `${this.managesBusinessesUrl}/DeleteBusiness`,
      { headers, params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.JWTtoken || this.authToken}`,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  /**
   * Handle API errors
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An error occurred';
    let apiError: ApiError = {
      type: 'server_error',
      message: errorMessage,
      statusCode: error.status,
      timestamp: new Date().toISOString()
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      apiError.type = 'network_error';
    } else {
      // Server-side error
      if (error.status === 401) {
        apiError.type = 'authentication';
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 403) {
        apiError.type = 'authorization';
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        apiError.type = 'not_found';
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 400) {
        apiError.type = 'validation';
        errorMessage = 'Invalid request data.';
        if (error.error?.errors) {
          apiError.details = error.error.errors.map((err: string) => ({
            field: 'unknown',
            message: err
          }));
        }
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    apiError.message = errorMessage;
    console.error('API Error:', apiError);
    
    // Show error message to user
    this.openSnackBar(null, 5000, errorMessage, 'Close');
    
    return throwError(() => apiError);
  };

  /**
   * Retry failed requests
   */
  private retryRequest<T>(request: Observable<T>, retries: number = 3): Observable<T> {
    return request.pipe(
      retry(retries),
      catchError(this.handleError)
    );
  }
}
