import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  MagicLinkEmailRequest,
  MagicLinkPhoneRequest,
  MagicLinkResponse,
  ValidateMagicLinkRequest,
  ValidateMagicLinkResponse,
  CreateS2COrderRequest,
  CreateC2SOrderRequest,
  OrderAuthResponse,
  OrderStatusResponse,
  AuthToken,
  OrderType
} from '../models/OrderAuth';

@Injectable({
  providedIn: 'root'
})
export class OrderAuthService {
  private readonly apiBaseUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api';
  private readonly orderAuthUrl = `${this.apiBaseUrl}/OrderAuth`;
  private readonly orderUrl = `${this.apiBaseUrl}/Order`;
  
  private authTokenSubject = new BehaviorSubject<AuthToken | null>(null);
  public authToken$ = this.authTokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Only check for existing token if user came from magic link or explicitly requested
    // Don't automatically load tokens to prevent unwanted persistence
    console.log('🔧 OrderAuthService initialized, checking if should load stored token...');
    
    if (this.shouldLoadStoredToken()) {
      console.log('✅ Loading stored token because user came from magic link');
      this.loadTokenFromStorage();
    } else {
      console.log('❌ Not loading stored token - user did not come from magic link');
      // Clear any stale tokens if user didn't come from magic link
      this.clearStaleTokensIfPresent();
    }
  }

  /**
   * Check if we should load stored token based on URL or other indicators
   */
  private shouldLoadStoredToken(): boolean {
    if (typeof window === 'undefined') {
      return false; // Server-side rendering
    }
    
    const currentPath = window.location.pathname;
    const hasAuthInPath = currentPath.includes('/auth');
    const hasReturnFromAuthParam = window.location.search.includes('returnFromAuth=true');
    
    console.log('🔍 Checking if should load stored token:', {
      currentPath,
      hasAuthInPath,
      hasReturnFromAuthParam,
      decision: hasAuthInPath || hasReturnFromAuthParam
    });
    
    return hasAuthInPath || hasReturnFromAuthParam;
  }

  /**
   * Clear stale tokens if user didn't come from magic link
   */
  private clearStaleTokensIfPresent(): void {
    const stored = localStorage.getItem('orderAuthToken');
    if (stored) {
      console.log('🧹 Clearing stale authentication token - user did not come from magic link');
      localStorage.removeItem('orderAuthToken');
      this.authTokenSubject.next(null);
    }
  }

  /**
   * Explicitly load token from storage (for cases where we know we need it)
   */
  public loadStoredTokenExplicitly(): void {
    console.log('🔄 Explicitly loading stored token...');
    this.loadTokenFromStorage();
  }

  // ==================== MAGIC LINK GENERATION ====================

  /**
   * Generate magic link for email authentication
   */
  generateMagicLinkForEmail(request: MagicLinkEmailRequest): Observable<MagicLinkResponse> {
    const headers = this.getJsonHeaders();
    return this.http.post<MagicLinkResponse>(
      `${this.orderAuthUrl}/GenerateMagicLinkForEmail`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generate magic link for phone authentication
   */
  generateMagicLinkForPhone(request: MagicLinkPhoneRequest): Observable<MagicLinkResponse> {
    const headers = this.getJsonHeaders();
    return this.http.post<MagicLinkResponse>(
      `${this.orderAuthUrl}/GenerateMagicLinkForPhone`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate magic link
   */
  validateMagicLink(request: ValidateMagicLinkRequest): Observable<ValidateMagicLinkResponse> {
    const headers = this.getJsonHeaders();
    return this.http.post<ValidateMagicLinkResponse>(
      `${this.orderAuthUrl}/ValidateMagicLink`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Process magic link URL and extract JWT token
   */
  processMagicLinkUrl(url: string): boolean {
    try {
      console.log('🔍 Processing magic link URL:', url);
      
      // Extract token from URL using multiple strategies
      const token = this.extractTokenFromUrl(url);
      
      if (!token) {
        console.error('❌ No token found in URL:', url);
        return false;
      }
      
      console.log('🎫 Extracted token:', token.substring(0, 50) + '...');
      
      if (this.isValidJWT(token)) {
        const decodedToken = this.decodeJWT(token);
        // Extract email/phone with multiple property name variations
        const emailOrPhone = decodedToken.emailOrPhone || decodedToken.emailorphone || decodedToken.email || decodedToken.phone;
        
        console.log('✅ JWT decoded successfully:', {
          emailOrPhone: emailOrPhone,
          exp: new Date(decodedToken.exp * 1000),
          authType: decodedToken.auth_type,
          iat: new Date(decodedToken.iat * 1000),
          rawPayload: decodedToken
        });
        
        const authToken: AuthToken = {
          token: token,
          expiresAt: new Date(decodedToken.exp * 1000),
          emailOrPhone: emailOrPhone,
          type: decodedToken.email || emailOrPhone.includes('@') ? 'email' : 'phone'
        };
        
        // Validate token is not expired
        if (this.isTokenValid(authToken)) {
          this.setAuthToken(authToken);
          console.log('🎉 Magic link authentication successful!');
          return true;
        } else {
          console.error('❌ Token is expired');
          return false;
        }
      } else {
        console.error('❌ Invalid JWT format');
        return false;
      }
    } catch (error) {
      console.error('❌ Error processing magic link URL:', error);
      return false;
    }
  }

  /**
   * Extract JWT token from magic link URL using multiple strategies
   */
  private extractTokenFromUrl(url: string): string | null {
    console.log('🔧 Attempting to extract token from URL:', url);
    
    // Strategy 1: Extract from path after 'auth/'
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    console.log('📍 URL pathname:', pathname);
    
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    console.log('📂 URL segments:', segments);
    
    const authIndex = segments.findIndex(segment => segment === 'auth');
    if (authIndex !== -1 && authIndex < segments.length - 1) {
      const token = segments[authIndex + 1];
      console.log('✅ Token found using auth segment strategy:', token.substring(0, 20) + '...');
      return token;
    }
    
    // Strategy 2: Check if the last segment is a JWT (fallback)
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && this.isValidJWT(lastSegment)) {
      console.log('✅ Token found using last segment strategy:', lastSegment.substring(0, 20) + '...');
      return lastSegment;
    }
    
    // Strategy 3: Check URL hash (in case token is in fragment)
    const hash = urlObj.hash.substring(1); // Remove the # character
    if (hash && this.isValidJWT(hash)) {
      console.log('✅ Token found in URL hash:', hash.substring(0, 20) + '...');
      return hash;
    }
    
    console.warn('⚠️ No JWT token found in URL using any strategy');
    return null;
  }

  /**
   * Process JWT token directly (alternative method)
   */
  processJWTToken(token: string): boolean {
    try {
      console.log('🎫 Processing JWT token directly:', token.substring(0, 50) + '...');
      
      if (this.isValidJWT(token)) {
        const decodedToken = this.decodeJWT(token);
        
        // Extract email/phone with multiple property name variations
        const emailOrPhone = decodedToken.emailOrPhone || decodedToken.emailorphone || decodedToken.email || decodedToken.phone;
        
        console.log('✅ JWT decoded successfully (direct token processing):', {
          emailOrPhone: emailOrPhone,
          exp: new Date(decodedToken.exp * 1000),
          authType: decodedToken.auth_type,
          rawPayload: decodedToken
        });
        
        const authToken: AuthToken = {
          token: token,
          expiresAt: new Date(decodedToken.exp * 1000),
          emailOrPhone: emailOrPhone,
          type: decodedToken.email || emailOrPhone.includes('@') ? 'email' : 'phone'
        };
        
        // Validate token is not expired
        if (this.isTokenValid(authToken)) {
          this.setAuthToken(authToken);
          console.log('🎉 JWT token processing successful!');
          return true;
        } else {
          console.error('❌ Token is expired');
          return false;
        }
      } else {
        console.error('❌ Invalid JWT format');
        return false;
      }
    } catch (error) {
      console.error('❌ Error processing JWT token:', error);
      return false;
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(authToken: AuthToken): void {
    console.log('💾 Setting authentication token:', {
      emailOrPhone: authToken.emailOrPhone,
      type: authToken.type,
      expiresAt: authToken.expiresAt,
      timeUntilExpiry: Math.round((authToken.expiresAt.getTime() - Date.now()) / 1000 / 60) + ' minutes'
    });
    
    this.authTokenSubject.next(authToken);
    this.saveTokenToStorage(authToken);
    
    console.log('✅ Authentication token set and saved successfully');
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): AuthToken | null {
    return this.authTokenSubject.value;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authTokenSubject.next(null);
    this.removeTokenFromStorage();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Check if token is valid (not expired and not too old)
   */
  private isTokenValid(token: AuthToken): boolean {
    const now = new Date();
    
    // Check if token is expired
    if (token.expiresAt <= now) {
      console.log('❌ Token is expired:', {
        expiresAt: token.expiresAt,
        now: now,
        expiredBy: Math.round((now.getTime() - token.expiresAt.getTime()) / 1000 / 60) + ' minutes'
      });
      return false;
    }
    
    // Check if token is too old (older than 24 hours from creation)
    // This prevents tokens from persisting indefinitely across browser sessions
    const tokenAge = now.getTime() - (token.expiresAt.getTime() - (24 * 60 * 60 * 1000)); // Assume 24hr expiry
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      console.log('❌ Token is too old (older than 24 hours):', {
        tokenAge: Math.round(tokenAge / 1000 / 60 / 60) + ' hours',
        maxAge: Math.round(maxAge / 1000 / 60 / 60) + ' hours',
        emailOrPhone: token.emailOrPhone
      });
      return false;
    }
    
    console.log('✅ Token is valid:', {
      emailOrPhone: token.emailOrPhone,
      expiresIn: Math.round((token.expiresAt.getTime() - now.getTime()) / 1000 / 60) + ' minutes',
      ageInHours: Math.round(tokenAge / 1000 / 60 / 60) + ' hours'
    });
    
    return true;
  }

  /**
   * Get authentication status with detailed information
   */
  getAuthenticationStatus(): { 
    isAuthenticated: boolean; 
    token: AuthToken | null; 
    timeRemaining?: number;
    errorMessage?: string;
  } {
    const token = this.getAuthToken();
    
    if (!token) {
      return {
        isAuthenticated: false,
        token: null,
        errorMessage: 'No authentication token found'
      };
    }

    const isValid = this.isTokenValid(token);
    if (!isValid) {
      return {
        isAuthenticated: false,
        token: null,
        errorMessage: 'Authentication token has expired'
      };
    }

    const timeRemaining = token.expiresAt.getTime() - Date.now();
    return {
      isAuthenticated: true,
      token: token,
      timeRemaining: timeRemaining
    };
  }

  /**
   * Validate authentication before making orders
   */
  validateAuthenticationForOrder(): Promise<boolean> {
    return new Promise((resolve) => {
      const status = this.getAuthenticationStatus();
      
      if (!status.isAuthenticated) {
        console.error('🚫 Order blocked - Authentication required:', status.errorMessage);
        resolve(false);
        return;
      }

      // Check if token expires within 5 minutes
      if (status.timeRemaining! < 5 * 60 * 1000) {
        console.warn('⚠️ Authentication token expires soon. Consider refreshing.');
      }

      console.log('✅ Authentication validated for order:', {
        emailOrPhone: status.token!.emailOrPhone,
        timeRemaining: Math.round(status.timeRemaining! / 1000 / 60) + ' minutes'
      });
      
      resolve(true);
    });
  }

  // ==================== ORDER OPERATIONS ====================

  /**
   * Create Service-to-Customer order
   */
  createS2COrder(orderData: CreateS2COrderRequest): Observable<OrderAuthResponse> {
    console.log('🛒 Creating S2C Order with authentication...');
    
    try {
      const headers = this.getAuthHeaders();
      const authStatus = this.getAuthenticationStatus();
      
      console.log('📦 S2C Order Data:', {
        orderID: orderData.orderID,
        emailOrPhone: orderData.emailOrPhone,
        cost: orderData.cost,
        currency: orderData.currency,
        servicesCount: orderData.services.length,
        authenticatedAs: authStatus.token?.emailOrPhone
      });

      return this.http.post<OrderAuthResponse>(
        `${this.orderUrl}/CreateS2COrder`,
        orderData,
        { headers }
      ).pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ S2C Order created successfully:', response.orderId);
          } else {
            console.error('❌ S2C Order creation failed:', response.message);
          }
        }),
        catchError(this.handleError)
      );
    } catch (error) {
      console.error('❌ S2C Order creation failed - Authentication error:', error);
      return throwError(() => error);
    }
  }

  /**
   * Create Customer-to-Service order
   */
  createC2SOrder(orderData: CreateC2SOrderRequest): Observable<OrderAuthResponse> {
    console.log('🛒 Creating C2S Order with authentication...');
    
    try {
      const headers = this.getAuthHeaders();
      const authStatus = this.getAuthenticationStatus();
      
      console.log('📦 C2S Order Data:', {
        orderID: orderData.orderID,
        emailOrPhone: orderData.emailOrPhone,
        cost: orderData.cost,
        currency: orderData.currency,
        placeID: orderData.placeID,
        servicesCount: orderData.services.length,
        authenticatedAs: authStatus.token?.emailOrPhone
      });

      return this.http.post<OrderAuthResponse>(
        `${this.orderUrl}/CreateC2SOrder`,
        orderData,
        { headers }
      ).pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ C2S Order created successfully:', response.orderId);
          } else {
            console.error('❌ C2S Order creation failed:', response.message);
          }
        }),
        catchError(this.handleError)
      );
    } catch (error) {
      console.error('❌ C2S Order creation failed - Authentication error:', error);
      return throwError(() => error);
    }
  }

  /**
   * Get order payment status
   */
  getOrderPaymentStatus(orderId: string): Observable<OrderStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderStatusResponse>(
      `${this.orderUrl}/${orderId}/status`,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: string): Observable<OrderStatusResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderStatusResponse[]>(
      `${this.orderUrl}/status/${status}`,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== TESTING & DEBUGGING METHODS ====================

  /**
   * Test authentication flow (for debugging)
   */
  testAuthenticationFlow(): void {
    console.log('🧪 Testing authentication flow...');
    
    // Check localStorage
    const stored = localStorage.getItem('orderAuthToken');
    console.log('📦 localStorage token:', stored ? 'Present' : 'Not found');
    
    // Check current token
    const currentToken = this.getAuthToken();
    console.log('🎫 Current token:', currentToken ? currentToken.emailOrPhone : 'None');
    
    // Check authentication status
    const authStatus = this.getAuthenticationStatus();
    console.log('🔍 Auth status:', authStatus);
    
    // Check if token is valid
    if (currentToken) {
      const isValid = this.isTokenValid(currentToken);
      console.log('✅ Token valid:', isValid);
      
      if (isValid) {
        const timeRemaining = Math.round((currentToken.expiresAt.getTime() - Date.now()) / 1000 / 60);
        console.log(`⏰ Time remaining: ${timeRemaining} minutes`);
      }
    }
  }

  /**
   * Clear all authentication data (for testing)
   */
  clearAllAuthData(): void {
    console.log('🧹 Clearing all authentication data...');
    this.clearAuthToken();
    localStorage.removeItem('orderAuthToken');
    console.log('✅ All authentication data cleared');
  }

  /**
   * Test JWT processing with a specific token (for debugging)
   */
  testSpecificToken(token: string): boolean {
    console.log('🧪 Testing specific JWT token...');
    console.log('🎫 Token preview:', token.substring(0, 100) + '...');
    
    try {
      const result = this.processJWTToken(token);
      console.log('🎯 Test result:', result ? 'SUCCESS' : 'FAILED');
      
      if (result) {
        const authStatus = this.getAuthenticationStatus();
        console.log('✅ Authentication status after test:', authStatus);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Determine order type based on location selection
   */
  determineOrderType(hasAddress: boolean, hasPlaceId: boolean): OrderType {
    if (hasAddress) {
      return OrderType.S2C;
    } else if (hasPlaceId) {
      return OrderType.C2S;
    }
    throw new Error('Unable to determine order type - missing address or place information');
  }

  /**
   * Generate order ID
   */
  generateOrderId(): string {
    return 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current website name from URL
   */
  private getCurrentWebsiteName(): string {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const segments = path.split('/').filter(segment => segment.length > 0);
      return segments.length > 0 ? segments[0] : 'hello'; // fallback to 'hello'
    }
    return 'hello'; // fallback for server-side rendering
  }

  /**
   * Generate magic link URL with proper website structure
   */
  generateMagicLinkUrl(baseUrl?: string): string {
    const websiteName = this.getCurrentWebsiteName();
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200');
    return `${origin}/${websiteName}/auth`;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get JSON headers
   */
  private getJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get authenticated headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (!token || !this.isTokenValid(token)) {
      throw new Error('No valid authentication token available');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.token}`
    });
  }

  /**
   * Validate JWT format
   */
  private isValidJWT(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Decode JWT token (basic decode without verification)
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid JWT token format');
    }
  }

  /**
   * Save token to localStorage
   */
  private saveTokenToStorage(token: AuthToken): void {
    const tokenData = {
      token: token.token,
      expiresAt: token.expiresAt.toISOString(),
      emailOrPhone: token.emailOrPhone,
      type: token.type
    };
    
    console.log('💾 Saving token to localStorage:', {
      emailOrPhone: tokenData.emailOrPhone,
      type: tokenData.type,
      expiresAt: tokenData.expiresAt
    });
    
    localStorage.setItem('orderAuthToken', JSON.stringify(tokenData));
    
    // Verify it was saved
    const saved = localStorage.getItem('orderAuthToken');
    console.log('✅ Token saved to localStorage, length:', saved ? saved.length : 0);
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    try {
      console.log('🔍 Loading token from localStorage...');
      const stored = localStorage.getItem('orderAuthToken');
      
      if (stored) {
        console.log('📦 Found stored token, length:', stored.length);
        const tokenData = JSON.parse(stored);
        console.log('📋 Parsed token data:', {
          emailOrPhone: tokenData.emailOrPhone,
          type: tokenData.type,
          expiresAt: tokenData.expiresAt
        });
        
        const authToken: AuthToken = {
          token: tokenData.token,
          expiresAt: new Date(tokenData.expiresAt),
          emailOrPhone: tokenData.emailOrPhone,
          type: tokenData.type
        };

        if (this.isTokenValid(authToken)) {
          console.log('✅ Loaded valid token from storage:', authToken.emailOrPhone);
          this.authTokenSubject.next(authToken);
        } else {
          console.warn('⚠️ Stored token is expired, removing from storage');
          this.removeTokenFromStorage();
        }
      } else {
        console.log('ℹ️ No token found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading token from storage:', error);
      this.removeTokenFromStorage();
    }
  }

  /**
   * Remove token from localStorage
   */
  private removeTokenFromStorage(): void {
    localStorage.removeItem('orderAuthToken');
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('OrderAuth API Error:', error);
    
    // Handle 401 Unauthorized - clear token and redirect to auth
    if (error.status === 401) {
      this.clearAuthToken();
    }

    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
} 