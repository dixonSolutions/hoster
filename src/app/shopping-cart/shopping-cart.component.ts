import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { CommonModule } from '@angular/common';
import { CartItem } from '../data-service.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { WebsiteHosterService } from '../services/website-hoster.service';
import { ServiceDto, BusinessBasicInfoDto } from '../models/WebsiteHoster';
import { OrderAuthService } from '../services/order-auth.service';
import { AnonymousOrderService } from '../services/anonymous-order.service';
import { BusinessPlaces } from '../models/BusinessPlaces';
import { 
  OrderType, 
  ServiceWithLocations, 
  ServiceLocation,
  MagicLinkEmailRequest,
  MagicLinkPhoneRequest,
  CreateS2COrderRequest,
  CreateC2SOrderRequest,
  ServiceSelection,
  AuthToken
} from '../models/OrderAuth';
import {
  PaymentPreference,
  AnonymousOrderResponse,
  AnonymousOrderItem,
  OrderFormData
} from '../models/AnonymousOrder';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ReviewsComponent } from '../reviews/reviews.component';

interface CustomerDetails {
  name: string;
  emailOrPhone: string;
  authType: 'email' | 'phone';
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface OrderData {
  customerDetails: CustomerDetails;
  selectedDate: Date;
  cartItems: CartItemWithLocation[];
  totalPrice: number;
}

interface CartItemWithLocation extends CartItem {
  selectedLocation?: ServiceLocation;
  selectedCustomerLocation?: ServiceLocation;
  selectedBusinessLocation?: ServiceLocation;
}

interface AuthStep {
  step: 'auth' | 'details' | 'confirmation';
  title: string;
}

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG Modules
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputTextarea,
    InputNumberModule,
    CalendarModule,
    DialogModule,
    ChipModule,
    TagModule,
    DividerModule,
    MessageModule,
    ProgressSpinnerModule,
    PanelModule,
    BadgeModule,
    TooltipModule,
    FloatLabelModule,
    ToastModule,
    DropdownModule,
    RadioButtonModule,
    ConfirmDialogModule,
    ReviewsComponent
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css',
  providers: [CookieService, MessageService, ConfirmationService],
  encapsulation: ViewEncapsulation.None
})
export class ShoppingCartComponent implements OnInit{
  public dataService = inject(DataServiceService);
  public websiteHosterService = inject(WebsiteHosterService);
  public orderAuthService = inject(OrderAuthService);
  public anonymousOrderService = inject(AnonymousOrderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Make OrderType available in template
  OrderType = OrderType;
  
  customerForm: FormGroup;
  authForm: FormGroup;
  orderForm: FormGroup;
  showCustomerForm = false;
  selectedDate: Date | undefined = undefined;
  minDate!: Date;
  isSubmittingOrder = false;

// Result: "https://organisely.app" or "http://localhost:4200"
  
  // Business data properties
  businessServices: ServiceDto[] = [];
  businessInfo: BusinessBasicInfoDto | null = null;
  isLoadingBusinessData = false;
  currentWebsiteName: string | null = null;
  
  // Available days properties
  availableDays: Date[] = [];
  isLoadingAvailableDays = false;
  disabledDates: Date[] = [];
  
  // Reviews dialog properties
  showReviewsDialog = false;
  selectedServiceForReviews: ServiceDto | null = null;
  
  // Order authentication properties
  currentAuthStep: AuthStep = { step: 'auth', title: 'Authentication' };
  authSteps: AuthStep[] = [
    { step: 'auth', title: 'Authentication' },
    { step: 'details', title: 'Details' },
    { step: 'confirmation', title: 'Confirmation' }
  ];
  isAuthenticated = false;
  authToken: AuthToken | null = null;
  isRequestingMagicLink = false;
  
  // Location selection properties
  businessPlaces: BusinessPlaces[] = [];
  businessAddresses: any[] = []; // Store specific addresses from business registration
  areaSpecifications: any[] = []; // Store area specifications for customer locations
  servicePlaceAssignments: any[] = []; // Store service to place assignments
  servicesWithLocations: ServiceWithLocations[] = [];
  cartItemsWithLocations: CartItemWithLocation[] = [];
  
  // Cached location data to avoid repeated calculations
  private locationCache: Map<string, { customerLocations: ServiceLocation[], businessLocations: ServiceLocation[] }> = new Map();
  
  // Auth type selection
  authTypes = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' }
  ];

  // Contact method options for simplified form
  contactMethods = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' }
  ];

  constructor(
    private fb: FormBuilder, 
    private cookieService: CookieService,
    private cdr: ChangeDetectorRef
  ) {
    // Authentication form
    this.authForm = this.fb.group({
      authType: ['email', [Validators.required]],
      emailOrPhone: ['', [Validators.required]]
    });

    // Customer details form (conditional validators will be added dynamically)
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]]
    });

    // Simplified order form for new flow with anonymous order support
    this.orderForm = this.fb.group({
      name: ['', [Validators.required]],
      contactMethod: ['email', [Validators.required]],
      contactValue: ['', [Validators.required]],
      paymentPreference: ['pay_now', [Validators.required]], // Default to pay now
      notes: ['']
    });

    // Subscribe to auth token changes
    this.orderAuthService.authToken$.subscribe(token => {
      this.authToken = token;
      this.isAuthenticated = !!token;
      if (token) {
        this.currentAuthStep = { step: 'details', title: 'Details' };
        console.log('✅ User authenticated via token change:', token.emailOrPhone);
      } else {
        console.log('ℹ️ User not authenticated or token cleared');
      }
    });

    // Make debug methods available globally for testing
    if (typeof window !== 'undefined') {
      (window as any).debugAuth = {
        testAuth: () => this.testAuth(),
        clearAuth: () => this.clearAuth(),
        checkStatus: () => this.orderAuthService.testAuthenticationFlow()
      };
      
      console.log('🛠️ Debug methods available:');
      console.log('  - window.debugAuth.testAuth() - Test authentication flow');
      console.log('  - window.debugAuth.clearAuth() - Clear authentication');
      console.log('  - window.debugAuth.checkStatus() - Check auth status');
    }
  }
  
  ngOnInit(): void {
    // Set minimum date to tomorrow
    const origin = window.location.origin;
    console.log('Origin:', origin); // Result: "https://organisely.app" or "http://localhost:4200"
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    
    this.loadBusinessData();
    this.loadSavedCustomerData();
    this.initializeCartWithLocations();
    
    // Check initial authentication status
    this.checkInitialAuthenticationStatus();
    
    // Check if user is returning from authentication
    this.checkReturnFromAuthentication();
    
    // Add debugging functionality
    this.setupDebugMethods();
  }

  /**
   * Setup debug methods for troubleshooting authentication issues
   */
  private setupDebugMethods(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugAuth = {
        testAuth: () => this.orderAuthService.testAuthenticationFlow(),
        clearAuth: () => {
          this.orderAuthService.clearAllAuthData();
          this.isAuthenticated = false;
          this.authToken = null;
          console.log('🧹 Authentication cleared manually');
        },
        checkStatus: () => {
          const status = this.orderAuthService.getAuthenticationStatus();
          console.log('🔍 Current auth status:', status);
          return status;
        },
        forceLoadToken: () => {
          this.orderAuthService.loadStoredTokenExplicitly();
          console.log('🔄 Forced token reload');
        },
        clearStaleTokens: () => {
          localStorage.removeItem('orderAuthToken');
          console.log('🧹 Cleared localStorage tokens');
        }
      };
      
      console.log('🛠️ Debug methods available:');
      console.log('  - window.debugAuth.testAuth() - Test authentication flow');
      console.log('  - window.debugAuth.clearAuth() - Clear authentication');
      console.log('  - window.debugAuth.checkStatus() - Check auth status');
      console.log('  - window.debugAuth.forceLoadToken() - Force load stored token');
      console.log('  - window.debugAuth.clearStaleTokens() - Clear localStorage tokens');
    }
  }

  /**
   * Check initial authentication status when component loads
   */
  private checkInitialAuthenticationStatus(): void {
    console.log('🔍 Checking initial authentication status...');
    
    // Get the actual authentication status from the service
    const authStatus = this.orderAuthService.getAuthenticationStatus();
    const hasValidToken = !!(authStatus.isAuthenticated && authStatus.token);
    
    console.log('🎫 Initial auth status check:', {
      serviceReportsAuthenticated: authStatus.isAuthenticated,
      hasActualToken: !!authStatus.token,
      tokenEmailOrPhone: authStatus.token?.emailOrPhone || 'No token',
      timeRemaining: authStatus.timeRemaining ? Math.round(authStatus.timeRemaining / 1000 / 60) + ' minutes' : 'No token',
      finalDecision: hasValidToken ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'
    });
    
    // Sync component state with actual authentication status
    this.isAuthenticated = hasValidToken;
    this.authToken = hasValidToken ? authStatus.token! : null;
    
    if (hasValidToken) {
      console.log('✅ User is authenticated on component load');
    } else {
      console.log('🔐 User is NOT authenticated on component load');
    }
  }

  /**
   * Check if user is returning from authentication and reopen checkout if needed
   */
  private checkReturnFromAuthentication(): void {
    // Use URL parameters or router state to detect return from auth
    const urlParams = new URLSearchParams(window.location.search);
    const returnFromAuth = urlParams.get('returnFromAuth');
    const requestNewAuth = urlParams.get('requestNewAuth');
    
    if (returnFromAuth === 'true') {
      console.log('🔄 User returning from authentication...');
      
      // Check if user is now authenticated
      setTimeout(() => {
        const authStatus = this.orderAuthService.getAuthenticationStatus();
        
        if (authStatus.isAuthenticated && this.dataService.CartItems.length > 0) {
          console.log('✅ User authenticated and has items in cart - preparing to reopen checkout');
          
          this.messageService.add({
            severity: 'success',
            summary: 'Authentication Successful',
            detail: 'You are now authenticated! Click checkout to continue with your order.',
            life: 6000
          });
          
          // Only automatically reopen if dialog is not already open
          if (!this.showCustomerForm) {
            console.log('📋 Auto-reopening checkout dialog after authentication');
            setTimeout(() => {
              this.openOrderForm();
            }, 1000);
          } else {
            console.log('ℹ️ Checkout dialog already open, skipping auto-reopen');
          }
        } else if (!authStatus.isAuthenticated) {
          console.log('❌ User not authenticated after return from auth page');
          
          this.messageService.add({
            severity: 'warn',
            summary: 'Authentication Required',
            detail: 'Please try authenticating again to continue with your order.',
            life: 5000
          });
        }
        
        // Clean up URL parameters
        this.cleanupUrlParameters();
      }, 1000); // Give some time for token processing
    }

    if (requestNewAuth === 'true') {
      console.log('🔄 User requesting new authentication...');
      this.messageService.add({
        severity: 'info',
        summary: 'Please Authenticate',
        detail: 'Please complete authentication to place your order.',
        life: 4000
      });
      this.cleanupUrlParameters();
    }
  }

  /**
   * Clean up URL parameters after processing return from auth
   */
  private cleanupUrlParameters(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('returnFromAuth');
    url.searchParams.delete('requestNewAuth');
    url.searchParams.delete('timestamp');
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Load business data from WebsiteHosterService
   */
  loadBusinessData(): void {
    // Get current website name from URL or use default
    this.currentWebsiteName = this.getCurrentWebsiteNameFromUrl() || 'hello';
    
    // Check if we already have cached business data
    const cachedBusinessData = this.websiteHosterService.getCurrentBusinessRegistration();
    if (cachedBusinessData) {
      this.businessServices = cachedBusinessData.services;
      this.businessInfo = cachedBusinessData.basicInfo;
        this.businessAddresses = cachedBusinessData.specificAddresses || [];
        this.areaSpecifications = cachedBusinessData.areaSpecifications || [];
        this.servicePlaceAssignments = cachedBusinessData.servicePlaceAssignments || [];
        
        // Clear location cache when cached data is used
        this.locationCache.clear();
        
        console.log('Using cached business data:', {
          services: this.businessServices.length,
          addresses: this.businessAddresses.length,
          areas: this.areaSpecifications.length,
          assignments: this.servicePlaceAssignments.length
        });
      
      // Load available days if we have business ID
      if (this.businessInfo?.businessID) {
        this.loadAvailableDays(this.businessInfo.businessID);
      }
      return;
    }
    
    // Load business data from API
    this.isLoadingBusinessData = true;
    this.websiteHosterService.getBusinessRegistrationByWebsiteName(this.currentWebsiteName).subscribe({
      next: (data) => {
        this.businessServices = data.services;
        this.businessInfo = data.basicInfo;
        this.businessAddresses = data.specificAddresses || [];
        this.areaSpecifications = data.areaSpecifications || [];
        this.servicePlaceAssignments = data.servicePlaceAssignments || [];
        this.isLoadingBusinessData = false;
        
        // Clear location cache when new data is loaded
        this.locationCache.clear();
        
        console.log('Business data loaded:', {
          services: data.services.length,
          addresses: this.businessAddresses.length,
          areas: this.areaSpecifications.length,
          assignments: this.servicePlaceAssignments.length,
          basicInfo: data.basicInfo
        });
        
        // Load available days after business data is loaded
        if (this.businessInfo?.businessID) {
          this.loadAvailableDays(this.businessInfo.businessID);
        }
      },
      error: (error) => {
        console.error('Error loading business data:', error);
        this.isLoadingBusinessData = false;
        this.dataService.openSnackBar(this, 5000, 'Error loading business services: ' + error.message, 'OK');
      }
    });
  }

  /**
   * Load available days for the business
   */
  loadAvailableDays(businessId: string): void {
    this.isLoadingAvailableDays = true;
    
    this.websiteHosterService.getNextAvailableDays(businessId).subscribe({
      next: (availableDays) => {
        this.availableDays = availableDays;
        this.updateDisabledDates();
        this.isLoadingAvailableDays = false;
        console.log(`Found ${availableDays.length} available days:`, availableDays);
        
        // If a selected date is no longer available, clear it
        if (this.selectedDate && !this.isDateAvailable(this.selectedDate)) {
          this.selectedDate = undefined;
          this.dataService.openSnackBar(this, 5000, 'Your previously selected date is no longer available. Please select a new date.', 'OK');
        }
      },
      error: (error) => {
        console.error('Error loading available days:', error);
        this.isLoadingAvailableDays = false;
        this.dataService.openSnackBar(this, 5000, 'Unable to load available dates. Please try again later.', 'OK');
        
        // Fallback: enable dates from tomorrow for 30 days
        this.setFallbackDates();
      }
    });
  }

  /**
   * Set fallback dates if available days API fails
   */
  private setFallbackDates(): void {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    this.availableDays = dates;
    this.updateDisabledDates();
    console.log('Using fallback dates for next 30 days');
  }

  /**
   * Update disabled dates array - disable all dates except available ones
   */
  private updateDisabledDates(): void {
    const disabled: Date[] = [];
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    // Generate all dates from today to one year from now
    const currentDate = new Date(today);
    while (currentDate <= oneYearFromNow) {
      // If this date is not in available days, add it to disabled
      if (!this.isDateAvailable(currentDate)) {
        disabled.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.disabledDates = disabled;
  }

  /**
   * Check if a date is in the available days list
   */
  isDateAvailable(date: Date): boolean {
    const dateStr = date.toDateString();
    return this.availableDays.some(availableDate => availableDate.toDateString() === dateStr);
  }



  /**
   * Get current website name from URL
   */
  private getCurrentWebsiteNameFromUrl(): string | null {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    return segments.length > 0 ? segments[0] : null;
  }

  /**
   * Add service to cart from business services
   */
  addServiceToCart(service: ServiceDto): void {
    // Convert ServiceDto to ServicesForBusiness format for compatibility
    const cartService = {
      serviceID: service.serviceID,
      serviceName: service.serviceName,
      serviceDescription: service.serviceDescription,
      servicePrice: service.price,
      servicePriceCurrencyUnit: service.currency,
      serviceImageUrl: service.serviceImageUrl,
      serviceEstimatedTime: service.duration.toString() + ' minutes',
      businessID: this.businessInfo?.businessID || ''
    };
    
    this.dataService.AddToCart(cartService);
    this.dataService.openSnackBar(this, 3000, `${service.serviceName} added to cart!`, 'OK');
  }

  /**
   * Check if service is already in cart
   */
  isServiceInCart(service: ServiceDto): boolean {
    return this.dataService.CartItems.some(item => item.service.serviceID === service.serviceID);
  }

  /**
   * Get quantity of service in cart
   */
  getServiceQuantityInCart(service: ServiceDto): number {
    const item = this.dataService.CartItems.find(item => item.service.serviceID === service.serviceID);
    return item ? item.quantity : 0;
  }

  /**
   * Convert ServiceDto to ServicesForBusiness format
   */
  private convertServiceDtoToServicesForBusiness(service: ServiceDto): any {
    return {
      serviceID: service.serviceID,
      serviceName: service.serviceName,
      serviceDescription: service.serviceDescription,
      servicePrice: service.price,
      servicePriceCurrencyUnit: service.currency,
      serviceImageUrl: service.serviceImageUrl,
      serviceEstimatedTime: service.duration.toString() + ' minutes',
      businessID: this.businessInfo?.businessID || ''
    };
  }

  /**
   * Increment service quantity in cart
   */
  incrementServiceQuantity(service: ServiceDto): void {
    const convertedService = this.convertServiceDtoToServicesForBusiness(service);
    this.dataService.IncrementQuantity(convertedService);
  }

  /**
   * Decrement service quantity in cart
   */
  decrementServiceQuantity(service: ServiceDto): void {
    const convertedService = this.convertServiceDtoToServicesForBusiness(service);
    this.dataService.DecrementQuantity(convertedService);
  }



  /**
   * Scroll to services section
   */
  scrollToServices(): void {
    const servicesSection = document.querySelector('.business-services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Open reviews dialog for a specific service
   */
  openReviewsDialog(service: ServiceDto): void {
    this.selectedServiceForReviews = service;
    this.showReviewsDialog = true;
    
    // Force fix dialog background after a short delay
    setTimeout(() => {
      this.fixDialogBackground();
    }, 100);
  }

  /**
   * Force fix PrimeNG dialog background
   */
  private fixDialogBackground(): void {
    // Find all possible dialog mask elements
    const maskSelectors = [
      '.p-dialog-mask',
      '.p-component-overlay',
      '.p-overlay-mask',
      '.p-overlay',
      '[data-pc-section="mask"]',
      'div[class*="p-dialog-mask"]',
      'div[class*="p-overlay"]',
      'div[class*="p-component-overlay"]'
    ];

    maskSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element: any) => {
        if (element.style) {
          element.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          element.style.background = 'rgba(0, 0, 0, 0.6)';
          element.style.backdropFilter = 'blur(2px)';
        }
      });
    });

    // Also try to find any div that might be the dialog overlay
    const allDivs = document.querySelectorAll('body > div:not([class*="app"]):not([id]):not([class*="ng"])');
    allDivs.forEach((div: any) => {
      if (div.style && div.children.length > 0) {
        // Check if this div contains a dialog
        const hasDialog = div.querySelector('.p-dialog') || div.querySelector('[class*="dialog"]');
        if (hasDialog) {
          div.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          div.style.background = 'rgba(0, 0, 0, 0.6)';
          div.style.backdropFilter = 'blur(2px)';
        }
      }
    });
  }

  CheckOutPessed() {
    // Prevent multiple dialogs from opening
    if (this.showCustomerForm) {
      console.log('ℹ️ Checkout dialog already open, ignoring click');
      return;
    }

    if (this.dataService.CartItems.length == 0) {
      this.dataService.openSnackBar(this, 5000, 'Your cart is empty, you need to add some services to checkout', 'OK');
    } else if (!this.selectedDate) {
      this.dataService.openSnackBar(this, 5000, 'Please select a service date before proceeding to checkout', 'OK');
    } else {
      console.log('🛒 Starting simplified checkout process...');
      
      // Initialize cart with smart location defaults
      this.initializeCartWithLocations();
      
      // Load saved data from cookies for the new form
      this.loadSavedDataToOrderForm();
      
      // Validate location selections before showing form
      this.validateAndRefreshLocationSelections();
      
      // Open the new simplified dialog
      this.showCustomerForm = true;
      
      // Force fix dialog background
      setTimeout(() => {
        this.fixDialogBackground();
      }, 100);
      
      console.log('✅ Simplified checkout dialog opened');
    }
  }

  /**
   * Load saved customer data into the new order form
   */
  private loadSavedDataToOrderForm(): void {
    const name = this.cookieService.get('customerName');
    const email = this.cookieService.get('customerEmail');
    const phone = this.cookieService.get('customerPhone');
    
    // Determine contact method and value
    let contactMethod = 'email';
    let contactValue = '';
    
    if (email) {
      contactMethod = 'email';
      contactValue = email;
    } else if (phone) {
      contactMethod = 'phone';
      contactValue = phone;
    }
    
    // Patch the order form
    this.orderForm.patchValue({
      name: name || '',
      contactMethod: contactMethod,
      contactValue: contactValue
    });
    
    console.log('📝 Loaded saved data to order form:', { name, contactMethod, contactValue });
  }

  // Try to get browser location and patch address fields
  tryPatchAddressFromLocation() {
    if (navigator.geolocation) {
      console.log('🗺️ Attempting to get user location with timeout...');
      
      // Set a timeout to prevent indefinite hanging
      const timeoutId = setTimeout(() => {
        console.log('⏰ Geolocation timeout after 5 seconds, skipping...');
      }, 5000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('✅ Geolocation success:', { lat, lng });
          
          // Use a timeout for the reverse geocoding as well
          Promise.race([
            this.reverseGeocode(lat, lng),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Reverse geocoding timeout')), 3000)
            )
          ]).then((addr: any) => {
            console.log('✅ Patching form from geolocation:', addr);
            // Only patch address-related fields to preserve existing personal information
            this.customerForm.patchValue({
              address: addr.address,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode
            });
            this.customerForm.updateValueAndValidity();
          }).catch((error) => {
            console.log('⚠️ Reverse geocoding failed or timed out:', error);
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('❌ Geolocation error:', error.message || error);
          // Don't show error to user, just continue without location
        },
        {
          // Add timeout and other options to prevent hanging
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log('ℹ️ Geolocation not supported by this browser');
    }
  }

  // Real reverse geocoding using Nominatim (OpenStreetMap) API
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    console.log('Reverse geocoding for:', { lat, lng });
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      const address = data.address || {};
      return {
        address: [address.road, address.house_number].filter(Boolean).join(' ') || '',
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        postalCode: address.postcode || ''
      };
    } catch (e) {
      console.error('Reverse geocoding failed:', e);
      return {
        address: '',
        city: '',
        state: '',
        postalCode: ''
      };
    }
  }



  submitOrder() {
    if (this.customerForm.valid && this.selectedDate) {
      const customerDetails: CustomerDetails = this.customerForm.value;
      const orderData: OrderData = {
        customerDetails,
        selectedDate: this.selectedDate,
        cartItems: this.dataService.CartItems,
        totalPrice: this.totalPrice
      };
      
      // Save customer details as cookies with 1000-year expiration
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1000);
      this.cookieService.set('customerName', customerDetails.name, expires, '/');
      this.cookieService.set('customerEmailOrPhone', customerDetails.emailOrPhone, expires, '/');
      this.cookieService.set('customerAuthType', customerDetails.authType, expires, '/');
      if (customerDetails.address) {
        this.cookieService.set('customerAddress', customerDetails.address, expires, '/');
      }
      if (customerDetails.city) {
        this.cookieService.set('customerCity', customerDetails.city, expires, '/');
      }
      if (customerDetails.state) {
        this.cookieService.set('customerState', customerDetails.state, expires, '/');
      }
      if (customerDetails.postalCode) {
        this.cookieService.set('customerPostalCode', customerDetails.postalCode, expires, '/');
      }

      console.log('Order submitted:', orderData);
      this.dataService.openSnackBar(this, 5000, 'Order submitted successfully!', 'OK');
      
      // Clear cart after successful order
      this.dataService.CartItems = [];
      this.dataService.updateItemsInCart();
      this.showCustomerForm = false;
      this.customerForm.reset();
      this.selectedDate = undefined;
    } else {
      this.dataService.openSnackBar(this, 5000, 'Please fill in all required fields and select a date', 'OK');
    }
  }

  /**
   * Cancel order and close dialog
   */
  cancelOrder(): void {
    console.log('❌ Cancelling order and closing dialog...');
    
    // Close the dialog
    this.showCustomerForm = false;
    
    // Reset authentication step
    this.currentAuthStep = { step: 'auth', title: 'Authentication' };
    
    // Reset any form states if needed
    this.isRequestingMagicLink = false;
    
    // Clear any selection states that might be causing issues
    this.cartItemsWithLocations.forEach(item => {
      item.selectedLocation = undefined;
    });
    
    console.log('✅ Order cancelled and dialog closed successfully');
    
    // Show a brief message
    this.messageService.add({
      severity: 'info',
      summary: 'Order Cancelled',
      detail: 'You can restart the checkout process anytime.',
      life: 3000
    });
  }

  // Helper function to clear saved address data from cookies
  clearSavedAddress() {
    this.cookieService.delete('customerAddress', '/');
    this.cookieService.delete('customerCity', '/');
    this.cookieService.delete('customerState', '/');
    this.cookieService.delete('customerPostalCode', '/');
    console.log('Saved address data cleared from cookies');
    this.dataService.openSnackBar(this, 3000, 'Saved address cleared. You can now enter a new address.', 'OK');
    
    // Clear the address fields in the form
    this.customerForm.patchValue({
      address: '',
      city: '',
      state: '',
      postalCode: ''
    });
    this.customerForm.updateValueAndValidity();
  }





  get totalPrice(): number {
    return this.dataService.CartItems.reduce((sum, item) => sum + (item.service.servicePrice || 0) * item.quantity, 0);
  }

  displayedColumns: string[] = ['serviceName', 'quantity'];
  
  get groupedByService() {
    // Group cart items by serviceID
    const groups: {[serviceID: string]: CartItem[]} = {};
    for (const item of this.dataService.CartItems) {
      const id = item.service.serviceID || '';
      if (!groups[id]) groups[id] = [];
      groups[id].push(item);
    }
    // Return as array of {service, items}
    return Object.values(groups).map(items => ({
      service: items[0].service,
      items
    }));
  }

  // ==================== NEW ORDER AUTH METHODS ====================

  /**
   * Load saved customer data from cookies
   */
  loadSavedCustomerData(): void {
    const savedName = this.cookieService.get('customerName');
    const savedEmailOrPhone = this.cookieService.get('customerEmailOrPhone');
    const savedAuthType = this.cookieService.get('customerAuthType') as 'email' | 'phone';

    if (savedEmailOrPhone && savedAuthType) {
      this.authForm.patchValue({
        authType: savedAuthType,
        emailOrPhone: savedEmailOrPhone
      });
    }

    if (savedName) {
      this.customerForm.patchValue({ name: savedName });
    }
  }

  /**
   * Initialize cart with smart location defaults
   */
  initializeCartWithLocations(): void {
    // Pre-compute location data for all services to avoid repeated calculations
    this.precomputeAllLocationData();
    
    this.cartItemsWithLocations = this.dataService.CartItems.map(item => {
      const cartItemWithLocation: CartItemWithLocation = {
      ...item,
      selectedLocation: undefined
      };
      
      // Auto-select smart default location
      this.autoSelectDefaultLocation(cartItemWithLocation);
      
      return cartItemWithLocation;
    });
    
    // Initialize form fields based on selected locations with delay to ensure proper DOM rendering
    setTimeout(() => {
      this.updateFormFieldsBasedOnSelections();
    }, 100);
    
    console.log('🛒 Initialized cart with smart location defaults:', this.cartItemsWithLocations);
  }

  /**
   * Pre-compute location data for all services in cart to avoid repeated calculations
   */
  private precomputeAllLocationData(): void {
    console.log('🔄 Pre-computing location data for all cart services...');
    
    const uniqueServiceIds = new Set(
      this.dataService.CartItems.map(item => item.service.serviceID).filter(id => id)
    );
    
    uniqueServiceIds.forEach(serviceId => {
      if (serviceId) {
        this.getLocationsForService(serviceId);
      }
    });
    
    console.log(`✅ Pre-computed location data for ${uniqueServiceIds.size} unique services`);
  }

  /**
   * Request magic link for authentication
   */
  requestMagicLink(): void {
    if (!this.authForm.valid) {
      this.markAuthFormFieldsAsTouched();
      return;
    }

    const { authType, emailOrPhone } = this.authForm.value;
    const linkFormat = this.orderAuthService.generateMagicLinkUrl();

    this.isRequestingMagicLink = true;

    const request$ = authType === 'email'
      ? this.orderAuthService.generateMagicLinkForEmail({ email: emailOrPhone, linkFormat })
      : this.orderAuthService.generateMagicLinkForPhone({ phoneNumber: emailOrPhone, linkFormat });

    request$.subscribe({
      next: (response) => {
        this.isRequestingMagicLink = false;
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Magic Link Sent',
            detail: `A magic link has been sent to your ${authType}. Click the link to authenticate and continue with your order.`,
            life: 8000
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to send magic link'
          });
        }
      },
      error: (error) => {
        this.isRequestingMagicLink = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to send magic link'
        });
      }
    });
  }

  /**
   * Mark auth form fields as touched for validation display
   */
  private markAuthFormFieldsAsTouched(): void {
    Object.keys(this.authForm.controls).forEach(key => {
      this.authForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Open order form and setup for authenticated user
   */
  openOrderForm(): void {
    console.log('🔧 Opening order form...');
    
    // Prevent opening if already open
    if (this.showCustomerForm) {
      console.log('⚠️ Order form already open, skipping...');
      return;
    }
    
    try {
      // Initialize cart with locations if not already done
      if (this.cartItemsWithLocations.length !== this.dataService.CartItems.length) {
        console.log('🔄 Initializing cart with locations...');
        this.initializeCartWithLocations();
      }

      // PROPERLY CHECK JWT TOKEN EXISTENCE - Don't rely on boolean flag
      const authStatus = this.orderAuthService.getAuthenticationStatus();
      const hasValidToken = !!(authStatus.isAuthenticated && authStatus.token);
      
      console.log('🔍 Authentication check:', {
        isAuthenticatedFlag: this.isAuthenticated,
        authStatusAuthenticated: authStatus.isAuthenticated,
        hasToken: !!authStatus.token,
        tokenEmailOrPhone: authStatus.token?.emailOrPhone || 'No token',
        finalDecision: hasValidToken ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'
      });

      // Set the appropriate step based on ACTUAL token existence
      if (!hasValidToken) {
        console.log('🔐 No valid JWT token found, starting with auth step');
        this.currentAuthStep = { step: 'auth', title: 'Authentication' };
        // Update the component's authentication flag to match reality
        this.isAuthenticated = false;
        this.authToken = null;
      } else {
        console.log('✅ Valid JWT token found, starting with details step');
        console.log('🎫 Token details:', {
          emailOrPhone: authStatus.token!.emailOrPhone,
          type: authStatus.token!.type,
          expiresAt: authStatus.token!.expiresAt,
          timeRemaining: authStatus.timeRemaining ? Math.round(authStatus.timeRemaining / 1000 / 60) + ' minutes' : 'Unknown'
        });
        this.currentAuthStep = { step: 'details', title: 'Details' };
        // Update the component's authentication state to match reality
        this.isAuthenticated = true;
        this.authToken = authStatus.token;
        
        // Test location service data to catch any errors
        console.log('🔍 Testing location service data...');
        try {
          for (const cartItem of this.cartItemsWithLocations) {
            const locations = this.getLocationsForService(cartItem.service.serviceID || '');
            console.log(`📍 Locations for ${cartItem.service.serviceName}:`, locations);
          }
        } catch (locationError) {
          console.error('❌ Error in location service:', locationError);
        }
      }
      
      // Open the dialog
      console.log('📋 Setting showCustomerForm = true...');
      this.showCustomerForm = true;
      
      // Force Angular change detection to ensure dialog appears
      this.cdr.detectChanges();
      
      // Force the timeout to execute even if there are template errors
      setTimeout(() => {
        try {
          console.log('🔄 Checking dialog state after change detection...');
          console.log('Dialog state check:', {
            showCustomerForm: this.showCustomerForm,
            currentAuthStep: this.currentAuthStep,
            cartItemsLength: this.cartItemsWithLocations.length,
            isAuthenticated: this.isAuthenticated
          });
          
          // Check if dialog actually appeared in DOM
          const dialogElement = document.querySelector('p-dialog');
          const dialogMask = document.querySelector('.p-dialog-mask');
          const dialogVisible = document.querySelector('p-dialog[style*="display: block"], p-dialog:not([style*="display: none"])');
          
          console.log('🌐 DOM check:', {
            dialogElement: !!dialogElement,
            dialogMask: !!dialogMask,
            dialogVisible: !!dialogVisible,
            dialogElementCount: document.querySelectorAll('p-dialog').length
          });
          
          if (!dialogElement && this.showCustomerForm) {
            console.error('❌ CRITICAL: Dialog should be open but not found in DOM!');
            console.error('This might be a PrimeNG rendering issue. Attempting recovery...');
            
            // Try to recover by forcing another change detection cycle
            this.showCustomerForm = false;
            this.cdr.detectChanges();
            setTimeout(() => {
              console.log('🔄 Attempting dialog recovery...');
              this.showCustomerForm = true;
              this.cdr.detectChanges();
            }, 100);
          } else if (dialogElement && !dialogVisible) {
            console.warn('⚠️ Dialog exists in DOM but may not be visible');
            // Try to fix visibility issues
            const pDialogElements = document.querySelectorAll('p-dialog');
            pDialogElements.forEach((el: any) => {
              if (el.style) {
                console.log('🔧 Dialog element style:', el.style.cssText);
              }
            });
          } else if (dialogElement && this.showCustomerForm) {
            console.log('✅ Dialog appears to be properly rendered and visible');
          }
          
          this.fixDialogBackground();
        } catch (timeoutError) {
          console.error('❌ Error in dialog check timeout:', timeoutError);
        }
      }, 300);
      
      console.log('✅ Order form setup completed');
      
    } catch (error) {
      console.error('❌ Error in openOrderForm:', error);
      console.error('Stack trace:', error);
      
      // Try to recover
      this.showCustomerForm = false;
      this.currentAuthStep = { step: 'auth', title: 'Authentication' };
    }
  }

  /**
   * Submit order with new authentication system
   */
  async submitOrderWithAuth(): Promise<void> {
    // Validate authentication first
    const isAuthValid = await this.orderAuthService.validateAuthenticationForOrder();
    if (!isAuthValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Authentication Required',
        detail: 'Please authenticate using magic link before placing orders.',
        life: 5000
      });
      this.currentAuthStep = { step: 'auth', title: 'Authentication' };
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to submit this order?',
      header: 'Confirm Order',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.processOrderSubmissionWithAuth();
      }
    });
  }

  /**
   * Process the actual order submission with authentication
   */
  private async processOrderSubmissionWithAuth(): Promise<void> {
    try {
      const customerDetails = this.customerForm.value;
      const authToken = this.authToken!;

      console.log('🛒 Starting order submission process...');

      // Group cart items by order type
      const s2cItems = this.cartItemsWithLocations.filter(item => 
        item.selectedLocation?.type === OrderType.S2C
      );
      const c2sItems = this.cartItemsWithLocations.filter(item => 
        item.selectedLocation?.type === OrderType.C2S
      );

      const orderPromises: Promise<any>[] = [];

      // Create S2C orders
      if (s2cItems.length > 0) {
        const s2cOrder = this.createS2COrderRequest(s2cItems, customerDetails, authToken);
        orderPromises.push(
          this.orderAuthService.createS2COrder(s2cOrder).toPromise()
        );
      }

      // Create C2S orders (group by place)
      const c2sOrdersByPlace = this.groupC2SOrdersByPlace(c2sItems);
      for (const placeId in c2sOrdersByPlace) {
        const c2sOrder = this.createC2SOrderRequest(c2sOrdersByPlace[placeId], placeId, customerDetails, authToken);
        orderPromises.push(
          this.orderAuthService.createC2SOrder(c2sOrder).toPromise()
        );
      }

      // Execute all order creation promises
      console.log(`📋 Submitting ${orderPromises.length} order(s)...`);
      const results = await Promise.all(orderPromises);

      this.handleOrderSubmissionSuccess(results);

    } catch (error) {
      this.handleOrderSubmissionError(error);
    }
  }

  /**
   * Handle successful order submission
   */
  private handleOrderSubmissionSuccess(results: any[]): void {
    console.log('✅ All orders submitted successfully:', results);

    // Save customer data
    this.saveCustomerDataToCookies();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Order Submitted',
      detail: `Successfully submitted ${results.length} order(s)!`,
      life: 5000
    });

    // Clear cart and close dialog
    this.clearCartAndForm();
  }

  /**
   * Handle order submission error
   */
  private handleOrderSubmissionError(error: any): void {
    console.error('❌ Order submission failed:', error);
    
    let errorMessage = 'Failed to submit order. Please try again.';
    
    if (error.message) {
      errorMessage = error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Order Failed',
      detail: errorMessage,
      life: 5000
    });
  }

  /**
   * Save customer data to cookies
   */
  private saveCustomerDataToCookies(): void {
    const customerDetails = this.customerForm.value;
    const authDetails = this.authForm.value;
    
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1000);
    
    this.cookieService.set('customerName', customerDetails.name, expires, '/');
    this.cookieService.set('customerEmailOrPhone', authDetails.emailOrPhone, expires, '/');
    this.cookieService.set('customerAuthType', authDetails.authType, expires, '/');
    
    if (customerDetails.address) {
      this.cookieService.set('customerAddress', customerDetails.address, expires, '/');
      this.cookieService.set('customerCity', customerDetails.city, expires, '/');
      this.cookieService.set('customerState', customerDetails.state, expires, '/');
      this.cookieService.set('customerPostalCode', customerDetails.postalCode, expires, '/');
    }
  }

  /**
   * Create S2C order request
   */
  private createS2COrderRequest(items: CartItemWithLocation[], customerDetails: any, authToken: AuthToken): CreateS2COrderRequest {
    const totalCost = items.reduce((sum, item) => sum + (item.service.servicePrice || 0) * item.quantity, 0);
    
    return {
      emailOrPhone: authToken.emailOrPhone,
      orderID: this.orderAuthService.generateOrderId(),
      orderDate: new Date().toISOString(),
      requestedDeliveryDate: this.selectedDate!.toISOString(),
      cost: totalCost,
      currency: items[0]?.service.servicePriceCurrencyUnit || 'AUD',
      addressCountry: customerDetails.country || 'Australia',
      addressState: customerDetails.state,
      addressSuburb: customerDetails.city,
      addressPostcode: customerDetails.postalCode,
      addressStreetAdr: customerDetails.address,
      deliveryNote: '',
      paymentStatus: 'Pending',
      services: items.map(item => ({
        BusinessID: item.service.businessID || this.businessInfo?.businessID || '',
        ServiceID: item.service.serviceID || ''
      }))
    };
  }

  /**
   * Create C2S order request
   */
  private createC2SOrderRequest(items: CartItemWithLocation[], placeId: string, customerDetails: any, authToken: AuthToken): CreateC2SOrderRequest {
    const totalCost = items.reduce((sum, item) => sum + (item.service.servicePrice || 0) * item.quantity, 0);
    
    return {
      emailOrPhone: authToken.emailOrPhone,
      orderID: this.orderAuthService.generateOrderId(),
      orderDate: new Date().toISOString(),
      requestedDeliveryDate: this.selectedDate!.toISOString(),
      cost: totalCost,
      currency: items[0]?.service.servicePriceCurrencyUnit || 'AUD',
      placeID: placeId,
      deliveryNote: '',
      paymentStatus: 'Pending',
      services: items.map(item => ({
        BusinessID: item.service.businessID || this.businessInfo?.businessID || '',
        ServiceID: item.service.serviceID || ''
      }))
    };
  }

  /**
   * Group C2S items by place ID
   */
  private groupC2SOrdersByPlace(items: CartItemWithLocation[]): {[placeId: string]: CartItemWithLocation[]} {
    const groups: {[placeId: string]: CartItemWithLocation[]} = {};
    
    items.forEach(item => {
      const placeId = item.selectedLocation?.placeID || 'default';
      if (!groups[placeId]) {
        groups[placeId] = [];
      }
      groups[placeId].push(item);
    });
    
    return groups;
  }

  /**
   * Clear cart and form data
   */
  private clearCartAndForm(): void {
    this.dataService.CartItems = [];
    this.dataService.updateItemsInCart();
    this.showCustomerForm = false;
    this.customerForm.reset();
    this.selectedDate = undefined;
    this.cartItemsWithLocations = [];
  }

  /**
   * TrackBy function for cart items to improve ngFor performance
   */
  trackCartItem(index: number, item: CartItemWithLocation): any {
    return item.service.serviceID || index;
  }

  /**
   * TrackBy function for locations to improve ngFor performance
   */
  trackLocation(index: number, location: ServiceLocation): any {
    return location.id || index;
  }

  /**
   * Handle location selection for cart item
   */
  onLocationSelected(cartItem: CartItemWithLocation, location: ServiceLocation): void {
    console.log('📍 Location selected:', {
      service: cartItem.service.serviceName,
      location: location.name,
      locationType: location.type
    });
    
    cartItem.selectedLocation = location;
    
    // Check if any S2C locations are selected and add address fields if needed
    // Use setTimeout to ensure DOM updates are processed
    setTimeout(() => {
    this.updateFormFieldsBasedOnSelections();
    this.validateLocationSelections();
    }, 0);
  }

  /**
   * Update form fields based on location selections
   */
  private updateFormFieldsBasedOnSelections(): void {
    const hasS2CServices = this.cartItemsWithLocations.some(item => 
      item.selectedLocation?.type === OrderType.S2C
    );

    console.log('🔍 Checking if address fields needed:', {
      hasS2CServices,
      currentAddressControl: !!this.orderForm.get('address')
    });

    if (hasS2CServices && !this.orderForm.get('address')) {
      console.log('➕ Adding address fields to form');
      this.addAddressFieldsToForm();
    } else if (!hasS2CServices && this.orderForm.get('address')) {
      console.log('➖ Removing address fields from form');
      this.removeAddressFieldsFromForm();
    }
  }

  /**
   * Add address fields to order form when S2C services are selected
   */
  private addAddressFieldsToForm(): void {
    if (!this.orderForm.get('address')) {
      this.orderForm.addControl('address', this.fb.control('', [Validators.required]));
      this.orderForm.addControl('city', this.fb.control('', [Validators.required]));
      this.orderForm.addControl('state', this.fb.control('', [Validators.required]));
      this.orderForm.addControl('postalCode', this.fb.control('', [Validators.required]));
      this.orderForm.addControl('country', this.fb.control('Australia', [Validators.required]));
      
      // Load saved address data if available
      const savedAddress = this.cookieService.get('customerAddress');
      const savedCity = this.cookieService.get('customerCity');
      const savedState = this.cookieService.get('customerState');
      const savedPostalCode = this.cookieService.get('customerPostalCode');
      
      if (savedAddress && savedCity && savedState && savedPostalCode) {
        this.orderForm.patchValue({
          address: savedAddress,
          city: savedCity,
          state: savedState,
          postalCode: savedPostalCode
        });
      }
    }
  }

  /**
   * Remove address fields from order form when no S2C services are selected
   */
  private removeAddressFieldsFromForm(): void {
    const addressFields = ['address', 'city', 'state', 'postalCode', 'country'];
    addressFields.forEach(field => {
      if (this.orderForm.get(field)) {
        this.orderForm.removeControl(field);
      }
    });
  }

  /**
   * Validate that all cart items have location selections
   */
  private validateLocationSelections(): boolean {
    return this.cartItemsWithLocations.every(item => !!item.selectedLocation);
  }

    /**
   * Get available locations for a service with caching to prevent repeated calculations
   */
  getLocationsForService(serviceId: string): { customerLocations: ServiceLocation[], businessLocations: ServiceLocation[] } {
    // Check cache first
    if (this.locationCache.has(serviceId)) {
      return this.locationCache.get(serviceId)!;
    }
    
    try {
      console.log('📍 Computing locations for service (first time):', serviceId);
      
      // Find service place assignments with flexible ID matching
      let serviceAssignments = this.servicePlaceAssignments.filter(
        assignment => assignment.serviceID === serviceId
      );
      
      // If no exact match, try flexible matching (with/without SRV_ prefix)
      if (serviceAssignments.length === 0) {
        console.log('🔍 No exact match, trying flexible ID matching...');
        
        // Try matching without SRV_ prefix
        const serviceIdWithoutPrefix = serviceId.replace(/^SRV_/, '');
        const serviceIdWithPrefix = serviceId.startsWith('SRV_') ? serviceId : `SRV_${serviceId}`;
        
        serviceAssignments = this.servicePlaceAssignments.filter(assignment => {
          const assignmentIdWithoutPrefix = assignment.serviceID.replace(/^SRV_/, '');
          const assignmentIdWithPrefix = assignment.serviceID.startsWith('SRV_') ? assignment.serviceID : `SRV_${assignment.serviceID}`;
          
          return assignment.serviceID === serviceIdWithPrefix ||
                 assignment.serviceID === serviceIdWithoutPrefix ||
                 assignmentIdWithoutPrefix === serviceIdWithoutPrefix ||
                 assignmentIdWithPrefix === serviceIdWithPrefix;
        });
        
        if (serviceAssignments.length > 0) {
          console.log('✅ Found match with flexible ID matching');
        }
      }
      
      // If still no match, try fallback matching strategies
      if (serviceAssignments.length === 0) {
        console.log('🔍 No ID match, trying fallback matching strategies...');
        
        const currentService = this.businessServices.find(s => s.serviceID === serviceId);
        if (currentService) {
          console.log('📝 Service name available for potential matching:', currentService.serviceName);
          
          // Strategy 1: If there's only one service and one assignment, match them
          if (this.businessServices.length === 1 && this.servicePlaceAssignments.length === 1) {
            console.log('🎯 Single service + single assignment detected, matching them');
            serviceAssignments = [...this.servicePlaceAssignments];
          }
          // Strategy 2: Try to match by service index (same position in arrays)
          else {
            const serviceIndex = this.businessServices.findIndex(s => s.serviceID === serviceId);
            if (serviceIndex >= 0 && serviceIndex < this.servicePlaceAssignments.length) {
              console.log(`🎯 Trying to match by index position: ${serviceIndex}`);
              serviceAssignments = [this.servicePlaceAssignments[serviceIndex]];
            }
          }
          
          if (serviceAssignments.length > 0) {
            console.log('✅ Found match using fallback strategy');
          }
        }
      }
      
      console.log(`🔗 Found ${serviceAssignments.length} place assignments for service ${serviceId}`);
      
      // Debug: show all assignment IDs vs current service ID
      if (serviceAssignments.length === 0) {
        console.log('🚨 No assignments found. All assignment serviceIDs:', 
          this.servicePlaceAssignments.map(a => a.serviceID));
        console.log('🔍 Looking for serviceID:', serviceId);
        console.log('🔍 Available services:', this.businessServices.map(s => ({ id: s.serviceID, name: s.serviceName })));
      }
      
      const customerLocations: ServiceLocation[] = [];
      const businessLocations: ServiceLocation[] = [];
      
      // Process ONLY assigned places
      serviceAssignments.forEach(assignment => {
        console.log(`🔗 Processing assignment: ${assignment.placeID}`);
        
        // Check if this placeID corresponds to an area specification (customer location)
        const area = this.areaSpecifications.find(area => area.placeID === assignment.placeID);
        if (area) {
          console.log(`✅ Found customer area: ${area.city}, ${area.state}`);
          customerLocations.push({
            id: `customer-${area.placeID}`,
            name: this.formatAreaName(area),
            type: OrderType.S2C,
            placeID: area.placeID,
            address: this.formatAreaDescription(area)
          });
        }
        
        // Check if this placeID corresponds to a specific address (business location)
        const address = this.businessAddresses.find(addr => addr.placeID === assignment.placeID);
        if (address) {
          console.log(`✅ Found business address: ${address.streetAddress}, ${address.city}`);
          businessLocations.push({
            id: `business-${address.placeID}`,
            name: `${address.city || address.streetAddress}`,
            type: OrderType.C2S,
            placeID: address.placeID,
            address: `${address.streetAddress}, ${address.city}, ${address.state} ${address.postalCode}`
          });
        }
      });
      
      const result = { customerLocations, businessLocations };
      
      console.log(`📦 Cached result for ${serviceId}: ${customerLocations.length} customer, ${businessLocations.length} business`);
      
      // Cache the result
      this.locationCache.set(serviceId, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error in getLocationsForService:', error);
      const emptyResult = { customerLocations: [], businessLocations: [] };
      this.locationCache.set(serviceId, emptyResult);
      return emptyResult;
    }
  }

  /**
   * Format area name for display
   */
  private formatAreaName(area: any): string {
    const parts = [];
    if (area.city) parts.push(area.city);
    if (area.state) parts.push(area.state);
    if (area.postalCode) parts.push(area.postalCode);
    if (area.country && area.country !== 'Australia') parts.push(area.country);
    
    return parts.join(', ') || 'Service Area';
  }

  /**
   * Format area description for display
   */
  private formatAreaDescription(area: any): string {
    const parts = [];
    if (area.city) parts.push(`City: ${area.city}`);
    if (area.state) parts.push(`State: ${area.state}`);
    if (area.postalCode) parts.push(`Postal Code: ${area.postalCode}`);
    if (area.country) parts.push(`Country: ${area.country}`);
    
    return parts.join(', ') || 'Service available in your area';
  }

  /**
   * Auto-select default location for a service (auto-select if only one option available)
   */
  private autoSelectDefaultLocation(cartItem: CartItemWithLocation): void {
    const locationData = this.getLocationsForService(cartItem.service.serviceID || '');
    const { customerLocations, businessLocations } = locationData;
    
    console.log(`🎯 Auto-selection for "${cartItem.service.serviceName}":`, {
      customerLocations: customerLocations.length,
      businessLocations: businessLocations.length
    });
    
    const totalLocations = customerLocations.length + businessLocations.length;
    
    // Auto-select if there's only one location option
    if (totalLocations === 1) {
      const singleLocation = customerLocations.length > 0 ? customerLocations[0] : businessLocations[0];
      cartItem.selectedLocation = singleLocation;
      
      // Also set the appropriate specific location for UI binding
      if (customerLocations.length > 0) {
        cartItem.selectedCustomerLocation = singleLocation;
      } else {
        cartItem.selectedBusinessLocation = singleLocation;
      }
      
      console.log(`✅ Auto-selected single location for "${cartItem.service.serviceName}": ${singleLocation.name}`);
    } else {
      // Multiple options - require user choice
      cartItem.selectedLocation = undefined;
      console.log(`⚠️ Multiple options for "${cartItem.service.serviceName}" - user must choose explicitly`);
    }
  }

  // ==================== NEW SIMPLIFIED ORDER METHODS ====================

  /**
   * Get contact placeholder text based on selected method
   */
  getContactPlaceholder(): string {
    const method = this.orderForm.get('contactMethod')?.value;
    return method === 'email' ? 'Enter your email address' : 'Enter your phone number';
  }

  /**
   * Get contact label based on selected method
   */
  getContactLabel(): string {
    const method = this.orderForm.get('contactMethod')?.value;
    return method === 'email' ? 'Email Address' : 'Phone Number';
  }

  /**
   * Check if any services require service-to-customer delivery
   */
  hasServiceToCustomerOrders(): boolean {
    return this.cartItemsWithLocations.some(item => 
      item.selectedLocation?.type === OrderType.S2C
    );
  }

  /**
   * Check if a service has any locations available
   */
  hasLocationsForService(serviceId: string): boolean {
    const locationData = this.getLocationsForService(serviceId);
    return locationData.customerLocations.length > 0 || locationData.businessLocations.length > 0;
  }

  /**
   * Get customer locations for a service
   */
  getCustomerLocationsForService(serviceId: string): ServiceLocation[] {
    const locationData = this.getLocationsForService(serviceId);
    return locationData.customerLocations;
  }

  /**
   * Get business locations for a service
   */
  getBusinessLocationsForService(serviceId: string): ServiceLocation[] {
    const locationData = this.getLocationsForService(serviceId);
    return locationData.businessLocations;
  }

  /**
   * Handle customer location selection
   */
  onCustomerLocationSelected(cartItem: CartItemWithLocation, location: ServiceLocation): void {
    cartItem.selectedCustomerLocation = location;
    cartItem.selectedBusinessLocation = undefined; // Clear other type
    cartItem.selectedLocation = location;
    console.log('📍 Customer location selected:', location.name);
  }

  /**
   * Handle business location selection
   */
  onBusinessLocationSelected(cartItem: CartItemWithLocation, location: ServiceLocation): void {
    cartItem.selectedBusinessLocation = location;
    cartItem.selectedCustomerLocation = undefined; // Clear other type
    cartItem.selectedLocation = location;
    console.log('📍 Business location selected:', location.name);
  }

  /**
   * Check if a service has multiple customer areas requiring selection
   */
  hasMultipleCustomerAreas(serviceId: string): boolean {
    const locationData = this.getLocationsForService(serviceId);
    return locationData.customerLocations.length > 1;
  }

  /**
   * Check if all cart items have locations selected
   */
  allLocationsSelected(): boolean {
    const allSelected = this.cartItemsWithLocations.every(item => !!item.selectedLocation);
    
    if (!allSelected) {
      const unselectedServices = this.cartItemsWithLocations
        .filter(item => !item.selectedLocation)
        .map(item => item.service.serviceName);
        
      console.log('⚠️ Some services missing location selection:', unselectedServices);
    }
    
    return allSelected;
  }

  /**
   * Submit order using simplified flow (no upfront authentication)
   */
  async submitOrderSimplified(): Promise<void> {
    if (!this.orderForm.valid || !this.selectedDate || !this.allLocationsSelected()) {
      // Provide specific feedback about what's missing
      const missingFields = [];
      if (!this.orderForm.valid) {
        missingFields.push('required customer information');
      }
      if (!this.selectedDate) {
        missingFields.push('service date');
      }
      if (!this.allLocationsSelected()) {
        const unselectedServices = this.cartItemsWithLocations
          .filter(item => !item.selectedLocation)
          .map(item => item.service.serviceName);
        missingFields.push(`location selection for: ${unselectedServices.join(', ')}`);
      }

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Order',
        detail: `Please complete: ${missingFields.join('; ')}.`,
        life: 7000
      });
      return;
    }

    this.isSubmittingOrder = true;

    try {
      const orderData = this.buildOrderData();
      
      // Send order to backend and request authentication
      await this.submitOrderAndRequestAuth(orderData);
      
      // Show success message based on payment preference
      const paymentPreference = orderData.paymentPreference;
      const successMessage = paymentPreference === 'pay_now' 
        ? 'Your order has been submitted! A payment link has been sent to your contact method.'
        : 'Your order has been submitted! A confirmation link has been sent to your contact method. Click to confirm and receive your payment link when ready.';
      
      this.messageService.add({
        severity: 'success',
        summary: 'Order Submitted Successfully!',
        detail: successMessage,
        life: 8000
      });

      // Clear cart and close dialog
      this.clearCartAndCloseDialog();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Order Submission Failed',
        detail: 'There was an error submitting your order. Please try again.',
        life: 5000
      });
    } finally {
      this.isSubmittingOrder = false;
    }
  }

  /**
   * Build order data from form
   */
  private buildOrderData(): any {
    const formValue = this.orderForm.value;
    
    // Add address fields if needed
    if (this.hasServiceToCustomerOrders()) {
      const addressFields = ['address', 'city', 'state', 'postalCode'];
      addressFields.forEach(field => {
        if (!this.orderForm.get(field)) {
          this.orderForm.addControl(field, this.fb.control('', [Validators.required]));
        }
      });
      
      // Re-validate with address fields
      if (!this.orderForm.valid) {
        throw new Error('Address information is required for home/mobile services');
      }
    }

    return {
      customerName: formValue.name,
      contactMethod: formValue.contactMethod,
      contactValue: formValue.contactValue,
      paymentPreference: formValue.paymentPreference, // 'pay_now' or 'pay_later'
      serviceDate: this.selectedDate,
      notes: formValue.notes || '',
      address: formValue.address || '',
      city: formValue.city || '',
      state: formValue.state || '',
      postalCode: formValue.postalCode || '',
      cartItems: this.cartItemsWithLocations.map(item => ({
        service: item.service,
        quantity: item.quantity,
        selectedLocation: item.selectedLocation,
        totalPrice: (item.service.servicePrice || 0) * item.quantity
      })),
      totalPrice: this.totalPrice
    };
  }

  /**
   * Submit order and request authentication via email/SMS
   */
  private async submitOrderAndRequestAuth(orderData: any): Promise<void> {
    // For now, simulate the backend call
    // In real implementation, this would:
    // 1. Create order in database with "pending_auth" status
    // 2. Send magic link to customer's email/phone
    // 3. When customer clicks link, order status changes to "confirmed"
    // 4. Optionally send payment link if immediate payment is desired
    
    console.log('📝 Submitting order to backend:', orderData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate magic link (in real implementation, backend would do this)
    const linkFormat = this.orderAuthService.generateMagicLinkUrl();
    
    if (orderData.contactMethod === 'email') {
      await this.orderAuthService.generateMagicLinkForEmail({
        email: orderData.contactValue,
        linkFormat
      }).toPromise();
    } else {
      await this.orderAuthService.generateMagicLinkForPhone({
        phoneNumber: orderData.contactValue,
        linkFormat
      }).toPromise();
    }
    
    console.log('✅ Order submitted and authentication link sent');
  }

  /**
   * Clear cart and close dialog after successful submission
   */
  private clearCartAndCloseDialog(): void {
    // Clear cart
    this.dataService.CartItems = [];
    this.dataService.updateItemsInCart();
    
    // Reset forms
    this.orderForm.reset({
      contactMethod: 'email',
      paymentMethod: 'payment_link'
    });
    this.cartItemsWithLocations = [];
    this.selectedDate = undefined;
    
    // Close dialog
    this.showCustomerForm = false;
    
    console.log('🛒 Cart cleared and dialog closed');
  }

  // ==================== DEBUGGING METHODS ====================

  /**
   * Test authentication flow (accessible from console)
   */
  testAuth(): void {
    console.log('🧪 Testing authentication from shopping cart...');
    this.orderAuthService.testAuthenticationFlow();
    
    // Check component state
    console.log('🛒 Shopping cart auth state:', {
      isAuthenticated: this.isAuthenticated,
      authToken: this.authToken ? this.authToken.emailOrPhone : 'None',
      currentStep: this.currentAuthStep.step
    });
  }

  /**
   * Clear authentication data (accessible from console)
   */
  clearAuth(): void {
    console.log('🧹 Clearing authentication from shopping cart...');
    this.orderAuthService.clearAllAuthData();
    
    // Reset component state
    this.isAuthenticated = false;
    this.authToken = null;
    this.currentAuthStep = { step: 'auth', title: 'Authentication' };
  }

  /**
   * Get workflow message for payment preference display
   */
  getWorkflowMessage(): string {
    const paymentPreference = this.orderForm.get('paymentPreference')?.value as PaymentPreference;
    const contactMethod = this.orderForm.get('contactMethod')?.value;
    
    if (!paymentPreference) {
      return '';
    }

    const validation = this.anonymousOrderService.validateEmailOrPhone(
      this.orderForm.get('contactValue')?.value || ''
    );
    
    return this.anonymousOrderService.getWorkflowMessage(
      paymentPreference,
      validation.type === 'email' ? 'email' : 'phone'
    );
  }

  // ==================== ANONYMOUS ORDER SUBMISSION ====================

  /**
   * Submit order using the new anonymous order system
   */
  async submitOrderAnonymous(): Promise<void> {
    console.log('🛒 Starting anonymous order submission...');
    this.isSubmittingOrder = true;

    try {
      // Build form data
      const formValue = this.orderForm.value;
      const formData: OrderFormData = {
        customerName: formValue.name,
        emailOrPhone: formValue.contactValue,
        paymentPreference: formValue.paymentPreference,
        serviceDate: this.selectedDate!,
        notes: formValue.notes,
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country || 'Australia'
      };

      // Validate form data
      const hasS2CServices = this.hasServiceToCustomerOrders();
      const validationErrors = this.anonymousOrderService.validateOrderForm(formData, hasS2CServices);
      
      if (validationErrors.length > 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: validationErrors.join(', '),
          life: 5000
        });
        return;
      }

      // Convert cart items to anonymous order format
      const orderItems: AnonymousOrderItem[] = this.cartItemsWithLocations.map(cartItem => ({
        service: {
          serviceID: cartItem.service.serviceID || '',
          businessID: cartItem.service.businessID || this.businessInfo?.businessID || '',
          serviceName: cartItem.service.serviceName || '',
          servicePrice: cartItem.service.servicePrice || 0,
          servicePriceCurrencyUnit: cartItem.service.servicePriceCurrencyUnit || 'AUD'
        },
        quantity: cartItem.quantity,
        selectedLocation: cartItem.selectedLocation ? {
          type: cartItem.selectedLocation.type === OrderType.S2C ? 'S2C' : 'C2S',
          placeID: cartItem.selectedLocation.placeID
        } : undefined
      }));

      // Group orders by type and submit
      const s2cItems = orderItems.filter(item => item.selectedLocation?.type === 'S2C');
      const c2sItems = orderItems.filter(item => item.selectedLocation?.type === 'C2S');

      const orderPromises: Promise<AnonymousOrderResponse>[] = [];

      // Submit S2C orders
      if (s2cItems.length > 0) {
        const s2cRequest = this.anonymousOrderService.buildS2COrderRequest(
          formData,
          s2cItems,
          this.calculateTotalForItems(s2cItems)
        );
        orderPromises.push(this.anonymousOrderService.createS2COrder(s2cRequest).toPromise() as Promise<AnonymousOrderResponse>);
      }

      // Submit C2S orders (group by place)
      const c2sOrdersByPlace = this.groupAnonymousC2SOrdersByPlace(c2sItems);
      for (const placeId in c2sOrdersByPlace) {
        const c2sRequest = this.anonymousOrderService.buildC2SOrderRequest(
          formData,
          c2sOrdersByPlace[placeId],
          this.calculateTotalForItems(c2sOrdersByPlace[placeId]),
          placeId
        );
        orderPromises.push(this.anonymousOrderService.createC2SOrder(c2sRequest).toPromise() as Promise<AnonymousOrderResponse>);
      }

      // Execute all order submissions
      console.log(`📋 Submitting ${orderPromises.length} anonymous order(s)...`);
      const responses = await Promise.all(orderPromises);

      // Handle successful submissions
      this.handleAnonymousOrderSuccess(responses, formData.paymentPreference);

    } catch (error: any) {
      console.error('❌ Anonymous order submission failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Order Submission Failed',
        detail: error.message || 'There was an error submitting your order. Please try again.',
        life: 5000
      });
    } finally {
      this.isSubmittingOrder = false;
    }
  }

  /**
   * Handle successful anonymous order submissions
   */
  private handleAnonymousOrderSuccess(responses: AnonymousOrderResponse[], paymentPreference: PaymentPreference): void {
    console.log('✅ Anonymous orders submitted successfully:', responses);

    // Save customer data
    this.saveAnonymousCustomerData();

    // Show success message
    const successMessage = paymentPreference === 'pay_now' 
      ? 'Your order has been submitted! A payment link has been sent to your contact method.'
      : 'Your order has been submitted! A confirmation link has been sent to your contact method. Click to confirm and receive your payment link when ready.';

    this.messageService.add({
      severity: 'success',
      summary: 'Order Submitted Successfully!',
      detail: successMessage,
      life: 8000
    });

    // Clear cart and close dialog
    this.clearAnonymousCartAndCloseDialog();
  }

  /**
   * Group C2S order items by place ID for anonymous orders
   */
  private groupAnonymousC2SOrdersByPlace(c2sItems: AnonymousOrderItem[]): { [placeId: string]: AnonymousOrderItem[] } {
    return c2sItems.reduce((groups, item) => {
      const placeId = item.selectedLocation?.placeID || 'default';
      if (!groups[placeId]) {
        groups[placeId] = [];
      }
      groups[placeId].push(item);
      return groups;
    }, {} as { [placeId: string]: AnonymousOrderItem[] });
  }

  /**
   * Calculate total cost for a set of order items
   */
  private calculateTotalForItems(items: AnonymousOrderItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.service.servicePrice * item.quantity);
    }, 0);
  }

  /**
   * Save customer data for future use (anonymous order version)
   */
  private saveAnonymousCustomerData(): void {
    const formValue = this.orderForm.value;
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    this.cookieService.set('customerName', formValue.name, expires, '/');
    
    if (formValue.contactMethod === 'email') {
      this.cookieService.set('customerEmail', formValue.contactValue, expires, '/');
    } else {
      this.cookieService.set('customerPhone', formValue.contactValue, expires, '/');
    }

    // Save address data if provided
    if (formValue.address) {
      this.cookieService.set('customerAddress', formValue.address, expires, '/');
      this.cookieService.set('customerCity', formValue.city, expires, '/');
      this.cookieService.set('customerState', formValue.state, expires, '/');
      this.cookieService.set('customerPostalCode', formValue.postalCode, expires, '/');
    }
  }

  /**
   * Clear cart and close order dialog (anonymous order version)
   */
  private clearAnonymousCartAndCloseDialog(): void {
    this.dataService.CartItems = [];
    this.dataService.updateItemsInCart();
    this.showCustomerForm = false;
    this.orderForm.reset({
      contactMethod: 'email',
      paymentPreference: 'pay_now'
    });
    this.selectedDate = undefined;
    this.cartItemsWithLocations = [];
  }

  /**
   * Validate and refresh location selections
   */
  validateAndRefreshLocationSelections(): void {
    console.log('🔍 Validating location selections...');
    
    this.cartItemsWithLocations.forEach(item => {
      // If no location is selected, try auto-selection again
      if (!item.selectedLocation) {
        this.autoSelectDefaultLocation(item);
      }
    });
    
    // Update form fields after validation
    this.updateFormFieldsBasedOnSelections();
    
    console.log('✅ Location validation completed');
  }

  /**
   * Debug method to check location selection status
   */
  debugLocationSelections(): void {
    console.log('🔍 DEBUG: Location Selection Status');
    console.log('Cart items with locations:', this.cartItemsWithLocations);
    
    this.cartItemsWithLocations.forEach((item, index) => {
      const locationData = this.getLocationsForService(item.service.serviceID || '');
      console.log(`Item ${index + 1}: ${item.service.serviceName}`, {
        hasSelectedLocation: !!item.selectedLocation,
        selectedLocation: item.selectedLocation,
        selectedCustomerLocation: item.selectedCustomerLocation,
        selectedBusinessLocation: item.selectedBusinessLocation,
        availableCustomerLocations: locationData.customerLocations.length,
        availableBusinessLocations: locationData.businessLocations.length,
        allLocationsCount: locationData.customerLocations.length + locationData.businessLocations.length
      });
    });
    
    console.log('All locations selected?', this.allLocationsSelected());
    console.log('Form valid?', this.orderForm.valid);
    console.log('Selected date?', !!this.selectedDate);
  }

}
