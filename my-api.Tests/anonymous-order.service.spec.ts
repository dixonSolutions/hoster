import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AnonymousOrderService } from '../src/app/services/anonymous-order.service';
import {
  AnonymousS2COrderRequest,
  AnonymousC2SOrderRequest,
  AnonymousOrderResponse,
  PaymentPreference,
  OrderFormData,
  AnonymousOrderItem
} from '../src/app/models/AnonymousOrder';

describe('AnonymousOrderService', () => {
  let service: AnonymousOrderService;
  let httpMock: HttpTestingController;
  
  const mockApiUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/Order';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnonymousOrderService]
    });
    service = TestBed.inject(AnonymousOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('S2C Order Submission', () => {
    it('should create S2C order with pay_now preference', () => {
      const mockRequest: AnonymousS2COrderRequest = {
        EmailOrPhone: 'test@example.com',
        OrderID: 'PLACEHOLDER_123',
        OrderDate: '2024-01-01T00:00:00Z',
        RequestedDeliveryDate: '2024-01-02T00:00:00Z',
        Cost: 100,
        Currency: 'AUD',
        AddressCountry: 'Australia',
        AddressState: 'NSW',
        AddressSuburb: 'Sydney',
        AddressPostcode: '2000',
        AddressStreetAdr: '123 Test St',
        DeliveryNote: 'Test delivery',
        PaymentStatus: 'pending',
        PaymentPreference: 'pay_now',
        Services: [{ BusinessID: 'BUS123', ServiceID: 'SVC123' }]
      };

      const mockResponse: AnonymousOrderResponse = {
        OrderID: 'ORD_123456',
        Status: 'pending',
        Message: 'Payment link sent to your email'
      };

      service.createS2COrder(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.Status).toBe('pending');
        expect(response.Message).toContain('payment link');
      });

      const req = httpMock.expectOne(`${mockApiUrl}/CreateS2COrder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.has('Authorization')).toBeFalsy();
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should create S2C order with pay_later preference', () => {
      const mockRequest: AnonymousS2COrderRequest = {
        EmailOrPhone: '+61412345678',
        OrderID: 'PLACEHOLDER_456',
        OrderDate: '2024-01-01T00:00:00Z',
        RequestedDeliveryDate: '2024-01-02T00:00:00Z',
        Cost: 150,
        Currency: 'AUD',
        AddressCountry: 'Australia',
        AddressState: 'VIC',
        AddressSuburb: 'Melbourne',
        AddressPostcode: '3000',
        AddressStreetAdr: '456 Test Ave',
        PaymentStatus: 'unconfirmed',
        PaymentPreference: 'pay_later',
        Services: [{ BusinessID: 'BUS456', ServiceID: 'SVC456' }]
      };

      const mockResponse: AnonymousOrderResponse = {
        OrderID: 'ORD_789012',
        Status: 'unconfirmed',
        Message: 'Confirmation link sent to your phone'
      };

      service.createS2COrder(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.Status).toBe('unconfirmed');
        expect(response.Message).toContain('confirmation link');
      });

      const req = httpMock.expectOne(`${mockApiUrl}/CreateS2COrder`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle S2C order validation errors', () => {
      const mockRequest: AnonymousS2COrderRequest = {
        EmailOrPhone: 'invalid-email',
        OrderID: 'PLACEHOLDER_123',
        OrderDate: '2024-01-01T00:00:00Z',
        RequestedDeliveryDate: '2024-01-02T00:00:00Z',
        Cost: 100,
        Currency: 'AUD',
        AddressCountry: 'Australia',
        AddressState: 'NSW',
        AddressSuburb: 'Sydney',
        AddressPostcode: '2000',
        AddressStreetAdr: '123 Test St',
        PaymentStatus: 'pending',
        PaymentPreference: 'pay_now',
        Services: [{ BusinessID: 'BUS123', ServiceID: 'SVC123' }]
      };

      const mockErrorResponse = {
        errors: {
          EmailOrPhone: ['Invalid email format']
        },
        title: 'Validation Failed',
        status: 400
      };

      service.createS2COrder(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Validation failed');
          expect(error.details).toEqual(mockErrorResponse);
        }
      });

      const req = httpMock.expectOne(`${mockApiUrl}/CreateS2COrder`);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('C2S Order Submission', () => {
    it('should create C2S order with pay_now preference', () => {
      const mockRequest: AnonymousC2SOrderRequest = {
        EmailOrPhone: 'customer@example.com',
        OrderID: 'PLACEHOLDER_789',
        OrderDate: '2024-01-01T00:00:00Z',
        RequestedDeliveryDate: '2024-01-02T00:00:00Z',
        Cost: 75,
        Currency: 'AUD',
        PlaceID: 'PLACE_123',
        DeliveryNote: 'Come to front desk',
        PaymentStatus: 'pending',
        PaymentPreference: 'pay_now',
        Services: [{ BusinessID: 'BUS789', ServiceID: 'SVC789' }]
      };

      const mockResponse: AnonymousOrderResponse = {
        OrderID: 'ORD_345678',
        Status: 'pending',
        Message: 'Payment link sent to your email'
      };

      service.createC2SOrder(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.Status).toBe('pending');
      });

      const req = httpMock.expectOne(`${mockApiUrl}/CreateC2SOrder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBeFalsy();
      req.flush(mockResponse);
    });

    it('should handle network errors', () => {
      const mockRequest: AnonymousC2SOrderRequest = {
        EmailOrPhone: 'test@example.com',
        OrderID: 'PLACEHOLDER_999',
        PlaceID: 'PLACE_123',
        PaymentStatus: 'pending',
        PaymentPreference: 'pay_now',
        Services: [{ BusinessID: 'BUS999', ServiceID: 'SVC999' }]
      };

      service.createC2SOrder(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Unable to connect to the service');
        }
      });

      const req = httpMock.expectOne(`${mockApiUrl}/CreateC2SOrder`);
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });
  });

  describe('Order Building Utilities', () => {
    const mockFormData: OrderFormData = {
      customerName: 'John Doe',
      emailOrPhone: 'john@example.com',
      paymentPreference: 'pay_now',
      serviceDate: new Date('2024-01-02'),
      notes: 'Test notes',
      address: '123 Test St',
      city: 'Sydney',
      state: 'NSW',
      postalCode: '2000',
      country: 'Australia'
    };

    const mockItems: AnonymousOrderItem[] = [
      {
        service: {
          serviceID: 'SVC123',
          businessID: 'BUS123',
          serviceName: 'Test Service',
          servicePrice: 100,
          servicePriceCurrencyUnit: 'AUD'
        },
        quantity: 1,
        selectedLocation: {
          type: 'S2C',
          placeID: undefined
        }
      }
    ];

    it('should build S2C order request correctly', () => {
      const result = service.buildS2COrderRequest(mockFormData, mockItems, 100);

      expect(result.EmailOrPhone).toBe('john@example.com');
      expect(result.PaymentPreference).toBe('pay_now');
      expect(result.PaymentStatus).toBe('pending');
      expect(result.Cost).toBe(100);
      expect(result.AddressStreetAdr).toBe('123 Test St');
      expect(result.Services).toEqual([{ BusinessID: 'BUS123', ServiceID: 'SVC123' }]);
    });

    it('should build C2S order request correctly', () => {
      const result = service.buildC2SOrderRequest(mockFormData, mockItems, 100, 'PLACE_123');

      expect(result.EmailOrPhone).toBe('john@example.com');
      expect(result.PaymentPreference).toBe('pay_now');
      expect(result.PaymentStatus).toBe('pending');
      expect(result.PlaceID).toBe('PLACE_123');
      expect(result.Services).toEqual([{ BusinessID: 'BUS123', ServiceID: 'SVC123' }]);
    });

    it('should set correct payment status for pay_later preference', () => {
      const payLaterFormData = { ...mockFormData, paymentPreference: 'pay_later' as PaymentPreference };
      const result = service.buildS2COrderRequest(payLaterFormData, mockItems, 100);

      expect(result.PaymentStatus).toBe('unconfirmed');
    });
  });

  describe('Validation Methods', () => {
    it('should validate email addresses correctly', () => {
      expect(service.validateEmailOrPhone('test@example.com')).toEqual({
        isValid: true,
        type: 'email'
      });

      expect(service.validateEmailOrPhone('user.name+tag@domain.co.uk')).toEqual({
        isValid: true,
        type: 'email'
      });

      expect(service.validateEmailOrPhone('invalid-email')).toEqual({
        isValid: false,
        type: 'unknown'
      });
    });

    it('should validate phone numbers correctly', () => {
      expect(service.validateEmailOrPhone('+61412345678')).toEqual({
        isValid: true,
        type: 'phone'
      });

      expect(service.validateEmailOrPhone('0412345678')).toEqual({
        isValid: true,
        type: 'phone'
      });

      expect(service.validateEmailOrPhone('+1-555-123-4567')).toEqual({
        isValid: true,
        type: 'phone'
      });

      expect(service.validateEmailOrPhone('abc123')).toEqual({
        isValid: false,
        type: 'unknown'
      });
    });

    it('should validate order form data', () => {
      const validFormData: OrderFormData = {
        customerName: 'John Doe',
        emailOrPhone: 'john@example.com',
        paymentPreference: 'pay_now',
        serviceDate: new Date(),
        address: '123 Test St',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2000'
      };

      const errors = service.validateOrderForm(validFormData, true);
      expect(errors).toEqual([]);
    });

    it('should return validation errors for invalid form data', () => {
      const invalidFormData: OrderFormData = {
        customerName: '',
        emailOrPhone: 'invalid-email',
        paymentPreference: 'pay_now',
        serviceDate: new Date()
      };

      const errors = service.validateOrderForm(invalidFormData, true);
      expect(errors).toContain('Customer name is required');
      expect(errors).toContain('Please enter a valid email address or phone number');
      expect(errors).toContain('Address is required for home/mobile services');
    });
  });

  describe('Utility Methods', () => {
    it('should generate placeholder order IDs', () => {
      const orderId1 = (service as any).generateOrderId();
      const orderId2 = (service as any).generateOrderId();

      expect(orderId1).toMatch(/^PLACEHOLDER_\d+_[a-z0-9]+$/);
      expect(orderId2).toMatch(/^PLACEHOLDER_\d+_[a-z0-9]+$/);
      expect(orderId1).not.toBe(orderId2);
    });

    it('should provide correct payment preference descriptions', () => {
      expect(service.getPaymentPreferenceDescription('pay_now'))
        .toBe('Pay immediately - receive payment link right away');
      
      expect(service.getPaymentPreferenceDescription('pay_later'))
        .toBe('Pay later - confirm order first, then receive payment link');
    });

    it('should provide correct workflow messages', () => {
      expect(service.getWorkflowMessage('pay_now', 'email'))
        .toContain('payment link will be sent to your email immediately');
      
      expect(service.getWorkflowMessage('pay_later', 'phone'))
        .toContain('confirmation link will be sent to your SMS');
    });
  });
}); 