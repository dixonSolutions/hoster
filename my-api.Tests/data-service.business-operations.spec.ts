import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataServiceService } from '../src/app/data-service.service';
import { 
  BusinessRegistrationRequest, 
  BusinessRegistrationResponse,
  BusinessRegistrationFullResponse
} from '../src/app/models/BusinessRegistration';
import { BusinessScheduleRequest } from '../src/app/models/BusinessSchedule';
import { CreateOrderRequest, OrderResponse } from '../src/app/models/Order';
import { PaymentLinkRequest, PaymentLinkResponse } from '../src/app/models/Payment';
import { ApiResponse } from '../src/app/models/ApiResponse';

describe('DataServiceService - Business Operations', () => {
  let service: DataServiceService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataServiceService]
    });
    service = TestBed.inject(DataServiceService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Set up test JWT token
    service.JWTtoken = 'test-jwt-token';
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Business Registration Operations', () => {
    const mockBusinessData: BusinessRegistrationRequest = {
      basicInfo: {
        businessName: 'Test Business',
        businessDescription: 'A test business',
        phone: '+1234567890',
        email: 'test@business.com'
      },
      services: [{
        serviceName: 'Test Service',
        serviceDescription: 'A test service',
        duration: 60,
        price: 50.00,
        currency: 'USD'
      }],
      specificAddresses: [{
        streetAddress: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345'
      }],
      areaSpecifications: [{
        country: 'Test Country'
      }],
      unifiedPlaces: [{
        placeType: 'specific',
        streetAddress: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345'
      }],
      servicePlaceAssignments: [{
        serviceType: 'onsite'
      }]
    };

    const mockBusinessResponse: BusinessRegistrationResponse = {
      success: true,
      message: 'Business registered successfully',
      businessID: 'BUS_123456',
      serviceIDs: ['SVC_123'],
      placeIDs: ['PLACE_123'],
      staffIDs: []
    };

    const mockBusinessFullResponse: BusinessRegistrationFullResponse = {
      success: true,
      message: 'Business retrieved successfully',
      businessID: 'BUS_123456',
      serviceIDs: ['SVC_123'],
      placeIDs: ['PLACE_123'],
      staffIDs: [],
      basicInfo: {
        businessName: 'Test Business',
        businessDescription: 'A test business',
        phone: '+1234567890',
        email: 'test@business.com'
      },
      services: [{
        serviceName: 'Test Service',
        serviceDescription: 'A test service',
        duration: 60,
        price: 50.00,
        currency: 'USD'
      }],
      specificAddresses: [{
        streetAddress: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345'
      }],
      areaSpecifications: [{
        country: 'Test Country'
      }],
      unifiedPlaces: [{
        placeType: 'specific',
        streetAddress: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345'
      }],
      servicePlaceAssignments: [{
        serviceType: 'onsite'
      }],
      staff: []
    };

    it('should register a complete business', () => {
      service.registerCompleteBusiness(mockBusinessData).subscribe(response => {
        expect(response).toEqual(mockBusinessResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/RegisterCompleteBusiness`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      expect(req.request.body).toEqual(mockBusinessData);
      req.flush(mockBusinessResponse);
    });

    it('should get business registration details', () => {
      const businessId = 'BUS_123456';
      
      service.getBusinessRegistration(businessId).subscribe(response => {
        expect(response).toEqual(mockBusinessFullResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/GetBusinessRegistration?businessId=${businessId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush(mockBusinessFullResponse);
    });

    it('should update business registration', () => {
      const businessId = 'BUS_123456';
      
      service.updateBusinessRegistration(businessId, mockBusinessData).subscribe(response => {
        expect(response).toEqual(mockBusinessResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/UpdateBusinessRegistration?businessId=${businessId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      expect(req.request.body).toEqual(mockBusinessData);
      req.flush(mockBusinessResponse);
    });
  });

  describe('Business Schedule Operations', () => {
    const mockScheduleData: BusinessScheduleRequest = {
      businessId: 'BUS_123456',
      cycleType: 0, // Weekly
      cycleLengthInDays: 7,
      cycleStartDate: '2024-01-01T00:00:00Z',
      cycles: [{
        businessId: 'BUS_123456',
        cycleId: 1,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-07T23:59:59Z',
        isActive: true,
        days: [{
          businessId: 'BUS_123456',
          cycleId: 1,
          day: 1, // Monday
          availabilityStatus: 2, // SpecificHours
          openingPeriods: [{
            businessId: 'BUS_123456',
            cycleId: 1,
            day: 1,
            openingTime: '09:00:00',
            closingTime: '17:00:00'
          }]
        }]
      }],
      exceptions: []
    };

    const mockScheduleResponse: ApiResponse = {
      success: true,
      message: 'Schedule registered successfully'
    };

    it('should register business schedule', () => {
      const businessId = 'BUS_123456';
      
      service.registerBusinessSchedule(businessId, mockScheduleData).subscribe(response => {
        expect(response).toEqual(mockScheduleResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/RegisterBusinessSchedule?businessId=${businessId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      expect(req.request.body).toEqual(mockScheduleData);
      req.flush(mockScheduleResponse);
    });

    it('should get business schedule', () => {
      const businessId = 'BUS_123456';
      
      service.getBusinessSchedule(businessId).subscribe(response => {
        expect(response).toEqual(mockScheduleData);
      });

      const req = httpMock.expectOne(`${baseUrl}/ManagesBusinesses/GetBusinessScheduleWithExceptions?businessId=${businessId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush(mockScheduleData);
    });
  });

  describe('Order Management Operations', () => {
    const mockOrderData: CreateOrderRequest = {
      userId: 'USER_123',
      businessId: 'BUS_123456',
      serviceId: 'SVC_123',
      placeId: 'PLACE_123',
      orderDate: '2024-01-01T10:00:00Z',
      requestedDeliveryDate: '2024-01-02T10:00:00Z',
      cost: 50.00,
      currency: 'USD',
      deliveryNote: 'Please deliver to front door',
      paymentStatus: 'Pending'
    };

    const mockOrderResponse: OrderResponse = {
      success: true,
      message: 'Order created successfully',
      orderId: 'ORD_123456'
    };

    it('should create a new order', () => {
      service.createOrder(mockOrderData).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/Order/CreateOrder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      expect(req.request.body).toEqual(mockOrderData);
      req.flush(mockOrderResponse);
    });

    it('should get order details', () => {
      const orderId = 'ORD_123456';
      
      service.getOrder(orderId).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/Order/GetOrder?orderId=${orderId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush({});
    });
  });

  describe('Payment Processing Operations', () => {
    const mockPaymentData: PaymentLinkRequest = {
      businessId: 'BUS_123456',
      serviceId: 'SVC_123',
      amount: 50.00,
      currency: 'USD',
      description: 'Payment for Test Service',
      customerEmail: 'customer@test.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const mockPaymentResponse: PaymentLinkResponse = {
      success: true,
      message: 'Payment link generated successfully',
      paymentLink: 'https://checkout.stripe.com/pay/test',
      paymentIntentId: 'pi_test123'
    };

    it('should generate payment link', () => {
      service.generatePaymentLink(mockPaymentData).subscribe(response => {
        expect(response).toEqual(mockPaymentResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/Subscription/GeneratePaymentLink`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      expect(req.request.body).toEqual(mockPaymentData);
      req.flush(mockPaymentResponse);
    });
  });

  describe('User Business Management', () => {
    it('should get all businesses for user', () => {
      const userId = 'USER_123';
      const mockBusinesses = [{
        basicInfo: {
          businessName: 'Test Business',
          businessDescription: 'A test business',
          phone: '+1234567890',
          email: 'test@business.com'
        },
        services: [],
        specificAddresses: [],
        areaSpecifications: [],
        unifiedPlaces: [],
        servicePlaceAssignments: []
      }];
      
      service.getAllBusinessesForUser(userId).subscribe(response => {
        expect(response).toEqual(mockBusinesses);
      });

      const req = httpMock.expectOne(`${baseUrl}/ManagesBusinesses/GetAllBusinessesForUser?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush(mockBusinesses);
    });

    it('should delete a business', () => {
      const businessId = 'BUS_123456';
      const mockDeleteResponse: ApiResponse = {
        success: true,
        message: 'Business deleted successfully'
      };
      
      service.deleteBusiness(businessId).subscribe(response => {
        expect(response).toEqual(mockDeleteResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/ManagesBusinesses/DeleteBusiness?businessId=${businessId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush(mockDeleteResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', () => {
      service.registerCompleteBusiness({} as BusinessRegistrationRequest).subscribe({
        error: (error) => {
          expect(error.type).toBe('authentication');
          expect(error.message).toBe('Authentication failed. Please log in again.');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/RegisterCompleteBusiness`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 400 validation errors', () => {
      service.registerCompleteBusiness({} as BusinessRegistrationRequest).subscribe({
        error: (error) => {
          expect(error.type).toBe('validation');
          expect(error.message).toBe('Invalid request data.');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/RegisterCompleteBusiness`);
      req.flush({
        success: false,
        message: 'Validation failed',
        errors: ['Business name is required', 'Email is invalid']
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 404 not found errors', () => {
      service.getBusinessRegistration('INVALID_ID').subscribe({
        error: (error) => {
          expect(error.type).toBe('not_found');
          expect(error.message).toBe('The requested resource was not found.');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/BusinessRegistry/GetBusinessRegistration?businessId=INVALID_ID`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });
}); 