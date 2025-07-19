import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';

import { ShoppingCartComponent } from '../src/app/shopping-cart/shopping-cart.component';
import { DataServiceService } from '../src/app/data-service.service';
import { WebsiteHosterService } from '../src/app/services/website-hoster.service';
import { OrderAuthService } from '../src/app/services/order-auth.service';
import { OrderType } from '../src/app/models/OrderAuth';

describe('ShoppingCartComponent - Simplified Flow', () => {
  let component: ShoppingCartComponent;
  let fixture: ComponentFixture<ShoppingCartComponent>;
  let mockDataService: jasmine.SpyObj<DataServiceService>;
  let mockWebsiteHosterService: jasmine.SpyObj<WebsiteHosterService>;
  let mockOrderAuthService: jasmine.SpyObj<OrderAuthService>;
  let mockCookieService: jasmine.SpyObj<CookieService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataServiceService', [
      'AddToCart', 'RemoveFromCart', 'IncrementQuantity', 'DecrementQuantity', 
      'updateItemsInCart', 'openSnackBar'
    ], {
      CartItems: [],
      itemsInCart: 0
    });

    const websiteHosterServiceSpy = jasmine.createSpyObj('WebsiteHosterService', [
      'getBusinessRegistrationByWebsiteName', 'getNextAvailableDays', 'getCurrentBusinessRegistration'
    ]);

    const orderAuthServiceSpy = jasmine.createSpyObj('OrderAuthService', [
      'generateMagicLinkForEmail', 'generateMagicLinkForPhone', 'generateMagicLinkUrl'
    ]);

    const cookieServiceSpy = jasmine.createSpyObj('CookieService', ['get', 'set']);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ShoppingCartComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: DataServiceService, useValue: dataServiceSpy },
        { provide: WebsiteHosterService, useValue: websiteHosterServiceSpy },
        { provide: OrderAuthService, useValue: orderAuthServiceSpy },
        { provide: CookieService, useValue: cookieServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ConfirmationService, useValue: jasmine.createSpyObj('ConfirmationService', ['confirm']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingCartComponent);
    component = fixture.componentInstance;
    
    mockDataService = TestBed.inject(DataServiceService) as jasmine.SpyObj<DataServiceService>;
    mockWebsiteHosterService = TestBed.inject(WebsiteHosterService) as jasmine.SpyObj<WebsiteHosterService>;
    mockOrderAuthService = TestBed.inject(OrderAuthService) as jasmine.SpyObj<OrderAuthService>;
    mockCookieService = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    mockMessageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    // Setup default mocks
    mockWebsiteHosterService.getCurrentBusinessRegistration.and.returnValue(null);
    mockWebsiteHosterService.getBusinessRegistrationByWebsiteName.and.returnValue(of({
      basicInfo: { businessID: 'test-id', businessName: 'Test Business', businessDescription: 'Test Description' },
      services: [],
      staff: []
    }));
    mockWebsiteHosterService.getNextAvailableDays.and.returnValue(of([new Date()]));
    mockOrderAuthService.generateMagicLinkUrl.and.returnValue('http://test.com/magic-link');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize order form with correct default values', () => {
      expect(component.orderForm.get('contactMethod')?.value).toBe('email');
      expect(component.orderForm.get('name')?.value).toBe('');
      expect(component.orderForm.get('contactValue')?.value).toBe('');
      expect(component.orderForm.get('notes')?.value).toBe('');
    });

    it('should have contact method options', () => {
      expect(component.contactMethods).toEqual([
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' }
      ]);
    });
  });

  describe('Location Logic', () => {
    beforeEach(() => {
      component.businessInfo = { 
        businessID: 'test-id', 
        businessName: 'Test Business', 
        businessDescription: 'Test Description' 
      };
    });

    it('should generate locations for service correctly', () => {
      const locations = component.getLocationsForService('test-service-id');
      
      expect(locations).toContain(jasmine.objectContaining({
        id: 'customer-location',
        name: 'At Your Location',
        type: OrderType.S2C
      }));

      expect(locations).toContain(jasmine.objectContaining({
        id: 'business-main',
        name: 'Business Location',
        type: OrderType.C2S
      }));
    });

    it('should auto-select smart default locations', () => {
      // Test mobile service
      const mobileService = {
        service: { serviceID: '1', serviceName: 'Mobile Cleaning Service' },
        quantity: 1,
        selectedLocation: undefined
      };
      
      component['autoSelectDefaultLocation'](mobileService);
      expect(mobileService.selectedLocation?.type).toBe(OrderType.S2C);

      // Test in-store service  
      const instoreService = {
        service: { serviceID: '2', serviceName: 'Hair Cut' },
        quantity: 1,
        selectedLocation: undefined
      };
      
      component['autoSelectDefaultLocation'](instoreService);
      expect(instoreService.selectedLocation?.type).toBe(OrderType.C2S);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct contact placeholder', () => {
      component.orderForm.patchValue({ contactMethod: 'email' });
      expect(component.getContactPlaceholder()).toBe('Enter your email address');

      component.orderForm.patchValue({ contactMethod: 'phone' });
      expect(component.getContactPlaceholder()).toBe('Enter your phone number');
    });

    it('should return correct contact label', () => {
      component.orderForm.patchValue({ contactMethod: 'email' });
      expect(component.getContactLabel()).toBe('Email Address');

      component.orderForm.patchValue({ contactMethod: 'phone' });
      expect(component.getContactLabel()).toBe('Phone Number');
    });

    it('should detect service-to-customer orders', () => {
      component.cartItemsWithLocations = [
        {
          service: { serviceID: '1', serviceName: 'Test Service' },
          quantity: 1,
          selectedLocation: { id: 'test', name: 'Test', type: OrderType.S2C }
        }
      ];

      expect(component.hasServiceToCustomerOrders()).toBe(true);

      component.cartItemsWithLocations[0].selectedLocation!.type = OrderType.C2S;
      expect(component.hasServiceToCustomerOrders()).toBe(false);
    });

    it('should check if all locations are selected', () => {
      component.cartItemsWithLocations = [
        {
          service: { serviceID: '1', serviceName: 'Test Service' },
          quantity: 1,
          selectedLocation: { id: 'test', name: 'Test', type: OrderType.S2C }
        }
      ];

      expect(component.allLocationsSelected()).toBe(true);

      component.cartItemsWithLocations[0].selectedLocation = undefined;
      expect(component.allLocationsSelected()).toBe(false);
    });
  });

  describe('Simplified Checkout Flow', () => {
    beforeEach(() => {
      mockDataService.CartItems = [
        {
          service: { serviceID: '1', serviceName: 'Test Service', servicePrice: 100 },
          quantity: 1
        }
      ];
      component.selectedDate = new Date();
    });

    it('should open simplified checkout dialog', () => {
      spyOn(component, 'initializeCartWithLocations');
      spyOn(component as any, 'loadSavedDataToOrderForm');

      component.CheckOutPessed();

      expect(component.showCustomerForm).toBe(true);
      expect(component.initializeCartWithLocations).toHaveBeenCalled();
      expect(component['loadSavedDataToOrderForm']).toHaveBeenCalled();
    });

    it('should load saved data to order form', () => {
      mockCookieService.get.and.callFake((key: string) => {
        const cookies: { [key: string]: string } = {
          'customerName': 'John Doe',
          'customerEmail': 'john@example.com'
        };
        return cookies[key] || '';
      });

      component['loadSavedDataToOrderForm']();

      expect(component.orderForm.get('name')?.value).toBe('John Doe');
      expect(component.orderForm.get('contactMethod')?.value).toBe('email');
      expect(component.orderForm.get('contactValue')?.value).toBe('john@example.com');
    });

    it('should submit order with email contact', async () => {
      // Setup form data
      component.orderForm.patchValue({
        name: 'John Doe',
        contactMethod: 'email',
        contactValue: 'john@example.com',
        notes: 'Test notes'
      });

      component.cartItemsWithLocations = [
        {
          service: { serviceID: '1', serviceName: 'Test Service', servicePrice: 100 },
          quantity: 1,
          selectedLocation: { id: 'test', name: 'Test Location', type: OrderType.S2C }
        }
      ];

      component.selectedDate = new Date();

      mockOrderAuthService.generateMagicLinkForEmail.and.returnValue(of({ success: true, message: 'Link sent' }));

      await component.submitOrderSimplified();

      expect(mockOrderAuthService.generateMagicLinkForEmail).toHaveBeenCalledWith({
        email: 'john@example.com',
        linkFormat: 'http://test.com/magic-link'
      });

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Order Submitted Successfully!'
      }));
    });

    it('should validate form before submission', async () => {
      component.orderForm.patchValue({
        name: '', // Invalid - required field
        contactMethod: 'email',
        contactValue: 'john@example.com'
      });

      await component.submitOrderSimplified();

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'warn',
        summary: 'Incomplete Order'
      }));
    });
  });

  describe('Location Selection', () => {
    it('should handle location selection', () => {
      const cartItem = {
        service: { serviceID: '1', serviceName: 'Test Service' },
        quantity: 1,
        selectedLocation: undefined
      };

      const location = { id: 'test', name: 'Test Location', type: OrderType.S2C };

      // onLocationSelected method should be implemented
      if (component.onLocationSelected) {
        component.onLocationSelected(cartItem, location);
        expect(cartItem.selectedLocation).toBe(location);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle order submission errors gracefully', async () => {
      component.orderForm.patchValue({
        name: 'John Doe',
        contactMethod: 'email',
        contactValue: 'john@example.com'
      });

      component.cartItemsWithLocations = [
        {
          service: { serviceID: '1', serviceName: 'Test Service', servicePrice: 100 },
          quantity: 1,
          selectedLocation: { id: 'test', name: 'Test Location', type: OrderType.S2C }
        }
      ];

      component.selectedDate = new Date();

      mockOrderAuthService.generateMagicLinkForEmail.and.returnValue(
        of({ success: false, message: 'Error sending email' })
      );

      await component.submitOrderSimplified();

      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Order Submission Failed'
      }));
    });
  });
}); 