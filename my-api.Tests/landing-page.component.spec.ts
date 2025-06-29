import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { ScrollTopModule } from 'primeng/scrolltop';
import { MenuModule } from 'primeng/menu';
import { MegaMenuModule } from 'primeng/megamenu';
import { GalleriaModule } from 'primeng/galleria';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ChipModule } from 'primeng/chip';

import { LandingPageComponent } from '../src/app/landing-page/landing-page.component';
import { DataServiceService } from '../src/app/data-service.service';
import { BusinessRegistrationFullResponse, ServiceRegistration } from '../src/app/models/BusinessRegistration';
import { ServicesForBusiness } from '../src/app/models/ServicesForBusiness';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let dataService: jasmine.SpyObj<DataServiceService>;
  let router: jasmine.SpyObj<Router>;
  let messageService: jasmine.SpyObj<MessageService>;

  const mockUserResponse = {
    user: {
      userID: '123',
      userName: 'testuser',
      email: 'test@example.com'
    },
    token: {
      result: 'mock-jwt-token'
    }
  };

  const mockBusinessResponse: BusinessRegistrationFullResponse = {
    businessID: '456',
    basicInfo: {
      businessName: 'Test Business',
      email: 'business@example.com',
      phone: '+1234567890',
      website: 'https://testbusiness.com'
    },
    specificAddresses: [
      {
        addressID: '1',
        businessID: '456',
        addressType: 'primary',
        streetAddress: '123 Main St',
        city: 'Test City',
        state: 'TS',
        country: 'Test Country',
        postalCode: '12345'
      }
    ],
    services: [
      {
        serviceID: '1',
        serviceName: 'Consulting Service',
        serviceDescription: 'Professional consulting services',
        businessID: '456',
        serviceEstimatedTime: '2-4 weeks',
        price: 1000,
        currency: 'USD',
        serviceImageUrl: 'https://example.com/image1.jpg'
      },
      {
        serviceID: '2',
        serviceName: 'Technology Service',
        serviceDescription: 'Technology implementation services',
        businessID: '456',
        serviceEstimatedTime: '4-8 weeks',
        price: 2000,
        currency: 'USD',
        serviceImageUrl: 'https://example.com/image2.jpg'
      }
    ]
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataServiceService', [
      'getUserById',
      'getBusinessRegistration'
    ], {
      userID: '123',
      businessID: '456',
      User: null,
      JWTtoken: null
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        CarouselModule,
        InputTextModule,
        InputTextarea,
        SelectModule,
        DialogModule,
        ToastModule,
        ProgressSpinnerModule,
        TabViewModule,
        AccordionModule,
        TimelineModule,
        TagModule,
        RatingModule,
        DividerModule,
        ScrollTopModule,
        MenuModule,
        MegaMenuModule,
        GalleriaModule,
        PanelMenuModule,
        ChipModule
      ],
      providers: [
        { provide: DataServiceService, useValue: dataServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        FormBuilder
      ]
    }).compileComponents();

    dataService = TestBed.inject(DataServiceService) as jasmine.SpyObj<DataServiceService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.loading).toBe(true);
      expect(component.error).toBeNull();
      expect(component.businessDetails).toBeNull();
      expect(component.services).toEqual([]);
      expect(component.featuredServices).toEqual([]);
    });

    it('should initialize contact form with validators', () => {
      expect(component.contactForm).toBeDefined();
      expect(component.contactForm.get('name')).toBeDefined();
      expect(component.contactForm.get('email')).toBeDefined();
      expect(component.contactForm.get('phone')).toBeDefined();
      expect(component.contactForm.get('company')).toBeDefined();
      expect(component.contactForm.get('message')).toBeDefined();
      expect(component.contactForm.get('service')).toBeDefined();
    });

    it('should initialize new component data structures', () => {
      expect(component.megaMenuItems).toEqual([]);
      expect(component.galleriaImages).toBeDefined();
      expect(component.timelineEvents).toBeDefined();
      expect(component.faqItems).toBeDefined();
      expect(component.panelMenuItems).toEqual([]);
      expect(component.serviceTags).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    it('should load business data successfully', fakeAsync(() => {
      dataService.getUserById.and.returnValue(of(mockUserResponse));
      dataService.getBusinessRegistration.and.returnValue(of(mockBusinessResponse));

      component.ngOnInit();
      tick();

      expect(dataService.getUserById).toHaveBeenCalledWith('123');
      expect(dataService.getBusinessRegistration).toHaveBeenCalledWith('456');
      expect(component.businessDetails).toEqual(mockBusinessResponse);
      expect(component.services).toHaveLength(2);
      expect(component.featuredServices).toHaveLength(2);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle user data loading error', fakeAsync(() => {
      dataService.getUserById.and.returnValue(throwError(() => new Error('User not found')));

      component.ngOnInit();
      tick();

      expect(component.error).toBe('Failed to load user data');
      expect(component.loading).toBe(false);
    }));

    it('should handle business data loading error', fakeAsync(() => {
      dataService.getUserById.and.returnValue(of(mockUserResponse));
      dataService.getBusinessRegistration.and.returnValue(throwError(() => new Error('Business not found')));

      component.ngOnInit();
      tick();

      expect(component.error).toBe('Failed to load business details');
      expect(component.loading).toBe(false);
    }));

    it('should handle missing JWT token', fakeAsync(() => {
      const userResponseWithoutToken = { ...mockUserResponse, token: { result: null } };
      dataService.getUserById.and.returnValue(of(userResponseWithoutToken));

      component.ngOnInit();
      tick();

      expect(component.error).toBe('Failed to obtain authentication token');
      expect(component.loading).toBe(false);
    }));
  });

  describe('Menu Setup', () => {
    it('should setup menu items correctly', () => {
      component.setupMenuItems();

      expect(component.menuItems).toHaveLength(4);
      expect(component.menuItems[0].label).toBe('Services');
      expect(component.menuItems[1].label).toBe('About');
      expect(component.menuItems[2].label).toBe('Resources');
      expect(component.menuItems[3].label).toBe('Contact');
    });

    it('should setup mega menu items correctly', () => {
      component.setupMegaMenu();

      expect(component.megaMenuItems).toHaveLength(2);
      expect(component.megaMenuItems[0].label).toBe('Services');
      expect(component.megaMenuItems[1].label).toBe('Industries');
    });

    it('should setup panel menu items correctly', () => {
      component.setupPanelMenu();

      expect(component.panelMenuItems).toHaveLength(2);
      expect(component.panelMenuItems[0].label).toBe('Business Solutions');
      expect(component.panelMenuItems[1].label).toBe('Support & Resources');
    });
  });

  describe('Contact Form', () => {
    beforeEach(() => {
      component.contactForm.reset();
    });

    it('should validate required fields', () => {
      const form = component.contactForm;
      
      expect(form.valid).toBe(false);
      expect(form.get('name')?.errors?.['required']).toBe(true);
      expect(form.get('email')?.errors?.['required']).toBe(true);
      expect(form.get('phone')?.errors?.['required']).toBe(true);
      expect(form.get('message')?.errors?.['required']).toBe(true);
      expect(form.get('service')?.errors?.['required']).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('invalid-email');
      
      expect(emailControl?.errors?.['email']).toBe(true);
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors).toBeNull();
    });

    it('should validate phone number format', () => {
      const phoneControl = component.contactForm.get('phone');
      phoneControl?.setValue('invalid-phone');
      
      expect(phoneControl?.errors?.['pattern']).toBeDefined();
      
      phoneControl?.setValue('+1234567890');
      expect(phoneControl?.errors).toBeNull();
    });

    it('should validate minimum length requirements', () => {
      const nameControl = component.contactForm.get('name');
      const messageControl = component.contactForm.get('message');
      
      nameControl?.setValue('a');
      expect(nameControl?.errors?.['minlength']).toBeDefined();
      
      nameControl?.setValue('John Doe');
      expect(nameControl?.errors).toBeNull();
      
      messageControl?.setValue('short');
      expect(messageControl?.errors?.['minlength']).toBeDefined();
      
      messageControl?.setValue('This is a longer message that meets the minimum requirement');
      expect(messageControl?.errors).toBeNull();
    });

    it('should submit form successfully when valid', () => {
      component.contactForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        message: 'This is a test message that is long enough',
        service: { serviceID: '1', serviceName: 'Test Service' }
      });

      component.submitContactForm();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Thank you for your message! We\'ll get back to you soon.'
      });
      expect(component.contactDialogVisible).toBe(false);
    });

    it('should show error when form is invalid', () => {
      component.submitContactForm();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields correctly.'
      });
    });
  });

  describe('Newsletter Subscription', () => {
    it('should subscribe successfully with valid email', () => {
      component.newsletterEmail = 'test@example.com';
      
      component.subscribeNewsletter();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Thank you for subscribing to our newsletter!'
      });
      expect(component.newsletterEmail).toBe('');
    });

    it('should show error with invalid email', () => {
      component.newsletterEmail = 'invalid-email';
      
      component.subscribeNewsletter();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a valid email address.'
      });
    });

    it('should show error with empty email', () => {
      component.newsletterEmail = '';
      
      component.subscribeNewsletter();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a valid email address.'
      });
    });
  });

  describe('Service Filtering', () => {
    beforeEach(() => {
      component.services = [
        {
          serviceID: '1',
          serviceName: 'Consulting Service',
          serviceDescription: 'Professional consulting',
          businessID: '456',
          serviceEstimatedTime: '2-4 weeks',
          servicePrice: 1000,
          servicePriceCurrencyUnit: 'USD',
          serviceImageUrl: 'https://example.com/image1.jpg'
        },
        {
          serviceID: '2',
          serviceName: 'Technology Service',
          serviceDescription: 'Technology implementation',
          businessID: '456',
          serviceEstimatedTime: '4-8 weeks',
          servicePrice: 2000,
          servicePriceCurrencyUnit: 'USD',
          serviceImageUrl: 'https://example.com/image2.jpg'
        }
      ];
      component.featuredServices = [...component.services];
    });

    it('should show all services when category is "all"', () => {
      component.selectedCategory = 'all';
      
      component.filterServices();

      expect(component.featuredServices).toHaveLength(2);
    });

    it('should filter services by category', () => {
      component.selectedCategory = 'consulting';
      
      component.filterServices();

      expect(component.featuredServices).toHaveLength(1);
      expect(component.featuredServices[0].serviceName).toBe('Consulting Service');
    });

    it('should limit featured services to 6', () => {
      // Add more services to test the limit
      for (let i = 3; i <= 10; i++) {
        component.services.push({
          serviceID: i.toString(),
          serviceName: `Service ${i}`,
          serviceDescription: `Description ${i}`,
          businessID: '456',
          serviceEstimatedTime: '1-2 weeks',
          servicePrice: 500,
          servicePriceCurrencyUnit: 'USD',
          serviceImageUrl: `https://example.com/image${i}.jpg`
        });
      }
      
      component.selectedCategory = 'all';
      component.filterServices();

      expect(component.featuredServices).toHaveLength(6);
    });
  });

  describe('Navigation', () => {
    it('should navigate to service details', () => {
      const mockService: ServicesForBusiness = {
        serviceID: '1',
        serviceName: 'Test Service',
        serviceDescription: 'Test Description',
        businessID: '456',
        serviceEstimatedTime: '2-4 weeks',
        servicePrice: 1000,
        servicePriceCurrencyUnit: 'USD',
        serviceImageUrl: 'https://example.com/image.jpg'
      };

      component.navigateToService(mockService);

      expect(router.navigate).toHaveBeenCalledWith(['/services', '1']);
    });

    it('should navigate to contact page', () => {
      component.navigateToContact();

      expect(router.navigate).toHaveBeenCalledWith(['/contact-us']);
    });

    it('should scroll to section', () => {
      const mockElement = document.createElement('div');
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');

      component.scrollToSection('test-section');

      expect(document.getElementById).toHaveBeenCalledWith('test-section');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Dialog Management', () => {
    it('should open contact dialog', () => {
      component.openContactDialog();

      expect(component.contactDialogVisible).toBe(true);
    });

    it('should close contact dialog and reset form', () => {
      component.contactDialogVisible = true;
      component.contactForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com'
      });

      component.closeContactDialog();

      expect(component.contactDialogVisible).toBe(false);
      expect(component.contactForm.get('name')?.value).toBeNull();
      expect(component.contactForm.get('email')?.value).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should validate email correctly', () => {
      expect(component['isValidEmail']('test@example.com')).toBe(true);
      expect(component['isValidEmail']('invalid-email')).toBe(false);
      expect(component['isValidEmail']('test@')).toBe(false);
      expect(component['isValidEmail']('@example.com')).toBe(false);
      expect(component['isValidEmail']('')).toBe(false);
    });

    it('should get service icon', () => {
      const mockService: ServicesForBusiness = {
        serviceID: '1',
        serviceName: 'Test Service',
        serviceDescription: 'Test Description',
        businessID: '456',
        serviceEstimatedTime: '2-4 weeks',
        servicePrice: 1000,
        servicePriceCurrencyUnit: 'USD',
        serviceImageUrl: 'https://example.com/image.jpg'
      };

      const icon = component.getServiceIcon(mockService);
      expect(icon).toBe('pi pi-star'); // default icon
    });

    it('should handle animation visibility', () => {
      component.onElementVisible('hero');

      expect(component.animatedElements['hero']).toBe(true);
    });
  });

  describe('Galleria Component', () => {
    it('should handle galleria item change', () => {
      spyOn(console, 'log');
      const mockEvent = { index: 1 };

      component.onGalleriaItemChange(mockEvent);

      expect(console.log).toHaveBeenCalledWith('Galleria item changed:', mockEvent);
    });
  });

  describe('Component Lifecycle', () => {
    it('should call setup methods on init', () => {
      spyOn(component, 'loadBusinessData');
      spyOn(component, 'setupMenuItems');
      spyOn(component, 'setupMegaMenu');
      spyOn(component, 'setupPanelMenu');
      spyOn(component, 'initializeAnimations');

      component.ngOnInit();

      expect(component.loadBusinessData).toHaveBeenCalled();
      expect(component.setupMenuItems).toHaveBeenCalled();
      expect(component.setupMegaMenu).toHaveBeenCalled();
      expect(component.setupPanelMenu).toHaveBeenCalled();
      expect(component.initializeAnimations).toHaveBeenCalled();
    });

    it('should initialize animations correctly', () => {
      component.initializeAnimations();

      expect(component.animatedElements).toEqual({
        hero: false,
        services: false,
        testimonials: false,
        stats: false
      });
    });
  });

  describe('Data Structures', () => {
    it('should have correct galleria images structure', () => {
      expect(component.galleriaImages).toHaveLength(3);
      expect(component.galleriaImages[0]).toHaveProperty('itemImageSrc');
      expect(component.galleriaImages[0]).toHaveProperty('thumbnailImageSrc');
      expect(component.galleriaImages[0]).toHaveProperty('alt');
      expect(component.galleriaImages[0]).toHaveProperty('title');
    });

    it('should have correct timeline events structure', () => {
      expect(component.timelineEvents).toHaveLength(4);
      expect(component.timelineEvents[0]).toHaveProperty('status');
      expect(component.timelineEvents[0]).toHaveProperty('date');
      expect(component.timelineEvents[0]).toHaveProperty('icon');
      expect(component.timelineEvents[0]).toHaveProperty('color');
      expect(component.timelineEvents[0]).toHaveProperty('title');
      expect(component.timelineEvents[0]).toHaveProperty('description');
    });

    it('should have correct FAQ items structure', () => {
      expect(component.faqItems).toHaveLength(4);
      expect(component.faqItems[0]).toHaveProperty('header');
      expect(component.faqItems[0]).toHaveProperty('content');
    });

    it('should have correct service tags structure', () => {
      expect(component.serviceTags).toHaveLength(6);
      expect(component.serviceTags[0]).toHaveProperty('label');
      expect(component.serviceTags[0]).toHaveProperty('icon');
    });
  });

  describe('Error Handling', () => {
    it('should handle business data loading with no services', fakeAsync(() => {
      const businessResponseWithoutServices = { ...mockBusinessResponse, services: undefined };
      dataService.getUserById.and.returnValue(of(mockUserResponse));
      dataService.getBusinessRegistration.and.returnValue(of(businessResponseWithoutServices));

      component.ngOnInit();
      tick();

      expect(component.services).toEqual([]);
      expect(component.featuredServices).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle business data loading with empty services array', fakeAsync(() => {
      const businessResponseWithEmptyServices = { ...mockBusinessResponse, services: [] };
      dataService.getUserById.and.returnValue(of(mockUserResponse));
      dataService.getBusinessRegistration.and.returnValue(of(businessResponseWithEmptyServices));

      component.ngOnInit();
      tick();

      expect(component.services).toEqual([]);
      expect(component.featuredServices).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));
  });
}); 