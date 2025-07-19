import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderAuthService } from '../src/app/services/order-auth.service';
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
} from '../src/app/models/OrderAuth';

describe('OrderAuthService', () => {
  let service: OrderAuthService;
  let httpMock: HttpTestingController;
  const apiBaseUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderAuthService]
    });
    service = TestBed.inject(OrderAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Magic Link Generation', () => {
    it('should generate magic link for email', () => {
      const mockRequest: MagicLinkEmailRequest = {
        email: 'test@example.com',
        linkFormat: 'https://example.com/auth'
      };

      const mockResponse: MagicLinkResponse = {
        success: true,
        message: 'Magic link sent successfully'
      };

      service.generateMagicLinkForEmail(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/OrderAuth/GenerateMagicLinkForEmail`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should generate magic link for phone', () => {
      const mockRequest: MagicLinkPhoneRequest = {
        phoneNumber: '+1234567890',
        linkFormat: 'https://example.com/auth'
      };

      const mockResponse: MagicLinkResponse = {
        success: true,
        message: 'Magic link sent successfully'
      };

      service.generateMagicLinkForPhone(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/OrderAuth/GenerateMagicLinkForPhone`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle magic link generation error', () => {
      const mockRequest: MagicLinkEmailRequest = {
        email: 'test@example.com',
        linkFormat: 'https://example.com/auth'
      };

      service.generateMagicLinkForEmail(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Failed to send magic link');
        }
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/OrderAuth/GenerateMagicLinkForEmail`);
      req.flush(
        { message: 'Failed to send magic link' }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('Magic Link Validation', () => {
    it('should validate magic link', () => {
      const mockRequest: ValidateMagicLinkRequest = {
        magicLinkId: 'test-magic-link-id'
      };

      const mockResponse: ValidateMagicLinkResponse = {
        isValid: true,
        message: 'Magic link is valid'
      };

      service.validateMagicLink(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/OrderAuth/ValidateMagicLink`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle invalid magic link', () => {
      const mockRequest: ValidateMagicLinkRequest = {
        magicLinkId: 'invalid-link-id'
      };

      const mockResponse: ValidateMagicLinkResponse = {
        isValid: false,
        message: 'Magic link is invalid or expired'
      };

      service.validateMagicLink(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.isValid).toBeFalse();
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/OrderAuth/ValidateMagicLink`);
      req.flush(mockResponse);
    });
  });

  describe('Token Management', () => {
    it('should process valid magic link URL', () => {
      // Create a mock JWT token (header.payload.signature)
      const mockPayload = {
        emailOrPhone: 'test@example.com',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                     btoa(JSON.stringify(mockPayload)) + 
                     '.signature';
      
      const testUrl = `https://example.com/auth/${mockJWT}`;
      
      const result = service.processMagicLinkUrl(testUrl);
      
      expect(result).toBeTrue();
      expect(service.isAuthenticated()).toBeTrue();
      
      const authToken = service.getAuthToken();
      expect(authToken).not.toBeNull();
      expect(authToken!.emailOrPhone).toBe('test@example.com');
      expect(authToken!.type).toBe('email');
    });

    it('should reject invalid JWT format', () => {
      const testUrl = 'https://example.com/auth/invalid-token';
      
      const result = service.processMagicLinkUrl(testUrl);
      
      expect(result).toBeFalse();
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should store and retrieve auth token from localStorage', () => {
      const mockToken: AuthToken = {
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000),
        emailOrPhone: 'test@example.com',
        type: 'email'
      };

      service.setAuthToken(mockToken);
      
      // Verify token is stored
      expect(service.getAuthToken()).toEqual(mockToken);
      expect(service.isAuthenticated()).toBeTrue();
      
      // Verify localStorage
      const stored = localStorage.getItem('orderAuthToken');
      expect(stored).not.toBeNull();
      
      const parsedStored = JSON.parse(stored!);
      expect(parsedStored.emailOrPhone).toBe('test@example.com');
    });

    it('should clear expired tokens from localStorage', () => {
      // Set expired token in localStorage
      const expiredToken = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        emailOrPhone: 'test@example.com',
        type: 'email'
      };
      
      localStorage.setItem('orderAuthToken', JSON.stringify(expiredToken));
      
      // Create new service instance to trigger token loading
      const newService = TestBed.inject(OrderAuthService);
      
      expect(newService.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('orderAuthToken')).toBeNull();
    });

    it('should clear auth token', () => {
      const mockToken: AuthToken = {
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000),
        emailOrPhone: 'test@example.com',
        type: 'email'
      };

      service.setAuthToken(mockToken);
      expect(service.isAuthenticated()).toBeTrue();
      
      service.clearAuthToken();
      
      expect(service.getAuthToken()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('orderAuthToken')).toBeNull();
    });
  });

  describe('Order Operations', () => {
    beforeEach(() => {
      // Set up authenticated state for order operations
      const mockToken: AuthToken = {
        token: 'valid-jwt-token',
        expiresAt: new Date(Date.now() + 3600000),
        emailOrPhone: 'test@example.com',
        type: 'email'
      };
      service.setAuthToken(mockToken);
    });

    it('should create S2C order', () => {
      const mockOrder: CreateS2COrderRequest = {
        emailOrPhone: 'test@example.com',
        orderID: 'ORD_123456',
        orderDate: new Date().toISOString(),
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
        cost: 100.00,
        currency: 'AUD',
        addressCountry: 'Australia',
        addressState: 'NSW',
        addressSuburb: 'Sydney',
        addressPostcode: '2000',
        addressStreetAdr: '123 Test St',
        deliveryNote: 'Test delivery note',
        paymentStatus: 'Pending',
        services: [
          { BusinessID: 'BUS_123', ServiceID: 'SVC_123' }
        ]
      };

      const mockResponse: OrderAuthResponse = {
        success: true,
        message: 'Order created successfully',
        orderId: 'ORD_123456'
      };

      service.createS2COrder(mockOrder).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/Order/CreateS2COrder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockOrder);
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
      req.flush(mockResponse);
    });

    it('should create C2S order', () => {
      const mockOrder: CreateC2SOrderRequest = {
        emailOrPhone: 'test@example.com',
        orderID: 'ORD_789012',
        orderDate: new Date().toISOString(),
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
        cost: 75.00,
        currency: 'AUD',
        placeID: 'PLACE_123',
        deliveryNote: 'Visit business location',
        paymentStatus: 'Pending',
        services: [
          { BusinessID: 'BUS_123', ServiceID: 'SVC_456' }
        ]
      };

      const mockResponse: OrderAuthResponse = {
        success: true,
        message: 'Order created successfully',
        orderId: 'ORD_789012'
      };

      service.createC2SOrder(mockOrder).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/Order/CreateC2SOrder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockOrder);
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
      req.flush(mockResponse);
    });

    it('should get order payment status', () => {
      const orderId = 'ORD_123456';
      const mockResponse: OrderStatusResponse = {
        orderId: orderId,
        paymentStatus: 'Completed',
        message: 'Payment completed successfully'
      };

      service.getOrderPaymentStatus(orderId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/Order/${orderId}/status`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
      req.flush(mockResponse);
    });

    it('should get orders by status', () => {
      const status = 'Pending';
      const mockResponse: OrderStatusResponse[] = [
        {
          orderId: 'ORD_123456',
          paymentStatus: 'Pending',
          message: 'Payment pending'
        },
        {
          orderId: 'ORD_789012',
          paymentStatus: 'Pending',
          message: 'Payment pending'
        }
      ];

      service.getOrdersByStatus(status).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/Order/status/${status}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
      req.flush(mockResponse);
    });

    it('should handle 401 unauthorized and clear token', () => {
      const orderId = 'ORD_123456';

      service.getOrderPaymentStatus(orderId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('An error occurred');
          expect(service.isAuthenticated()).toBeFalse();
        }
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/Order/${orderId}/status`);
      req.flush(
        { message: 'Unauthorized' }, 
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should reject order operations without authentication', () => {
      service.clearAuthToken(); // Remove authentication

      const mockOrder: CreateS2COrderRequest = {
        emailOrPhone: 'test@example.com',
        orderID: 'ORD_123456',
        orderDate: new Date().toISOString(),
        requestedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
        cost: 100.00,
        currency: 'AUD',
        addressCountry: 'Australia',
        addressState: 'NSW',
        addressSuburb: 'Sydney',
        addressPostcode: '2000',
        addressStreetAdr: '123 Test St',
        paymentStatus: 'Pending',
        services: []
      };

      expect(() => service.createS2COrder(mockOrder)).toThrowError('No valid authentication token available');
    });
  });

  describe('Utility Methods', () => {
    it('should determine S2C order type', () => {
      const orderType = service.determineOrderType(true, false);
      expect(orderType).toBe(OrderType.S2C);
    });

    it('should determine C2S order type', () => {
      const orderType = service.determineOrderType(false, true);
      expect(orderType).toBe(OrderType.C2S);
    });

    it('should throw error for ambiguous order type', () => {
      expect(() => service.determineOrderType(false, false))
        .toThrowError('Unable to determine order type - missing address or place information');
    });

    it('should generate unique order IDs', () => {
      const orderId1 = service.generateOrderId();
      const orderId2 = service.generateOrderId();
      
      expect(orderId1).toMatch(/^ORD_\d+_[a-z0-9]+$/);
      expect(orderId2).toMatch(/^ORD_\d+_[a-z0-9]+$/);
      expect(orderId1).not.toBe(orderId2);
    });
  });

  describe('Observable Subscriptions', () => {
    it('should emit auth token changes', (done) => {
      let emissionCount = 0;
      
      service.authToken$.subscribe(token => {
        emissionCount++;
        
        if (emissionCount === 1) {
          // Initial emission should be null
          expect(token).toBeNull();
        } else if (emissionCount === 2) {
          // After setting token
          expect(token).not.toBeNull();
          expect(token!.emailOrPhone).toBe('test@example.com');
        } else if (emissionCount === 3) {
          // After clearing token
          expect(token).toBeNull();
          done();
        }
      });

      // Set a token
      const mockToken: AuthToken = {
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000),
        emailOrPhone: 'test@example.com',
        type: 'email'
      };
      service.setAuthToken(mockToken);

      // Clear the token
      setTimeout(() => service.clearAuthToken(), 10);
    });
  });
}); 