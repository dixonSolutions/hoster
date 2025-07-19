import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { CommonModule } from '@angular/common';
import { CartItem } from '../data-service.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { WebsiteHosterService } from '../services/website-hoster.service';
import { ServiceDto, BusinessBasicInfoDto } from '../models/WebsiteHoster';
import { OrderAuthService } from '../services/order-auth.service';
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

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
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
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  
  customerForm: FormGroup;
  authForm: FormGroup;
  showCustomerForm = false;
  selectedDate: Date | undefined = undefined;
  minDate!: Date;

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
  servicesWithLocations: ServiceWithLocations[] = [];
  cartItemsWithLocations: CartItemWithLocation[] = [];
  
  // Auth type selection
  authTypes = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' }
  ];

  constructor(
    private fb: FormBuilder, 
    private cookieService: CookieService
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
  }

  /**
   * Check authentication status when component initializes
   */
  private checkInitialAuthenticationStatus(): void {
    const authStatus = this.orderAuthService.getAuthenticationStatus();
    console.log('🔍 Initial authentication check:', authStatus);
    
    if (authStatus.isAuthenticated && authStatus.token) {
      this.authToken = authStatus.token;
      this.isAuthenticated = true;
      this.currentAuthStep = { step: 'details', title: 'Details' };
      
      // Pre-populate auth form with existing token data
      this.authForm.patchValue({
        authType: authStatus.token.type,
        emailOrPhone: authStatus.token.emailOrPhone
      });
      
      console.log('✅ User already authenticated:', authStatus.token.emailOrPhone);
      
      // Show time remaining
      if (authStatus.timeRemaining) {
        const minutesRemaining = Math.round(authStatus.timeRemaining / 1000 / 60);
        console.log(`⏰ Authentication expires in ${minutesRemaining} minutes`);
      }
    } else {
      console.log('ℹ️ User not authenticated:', authStatus.errorMessage || 'No token found');
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
          console.log('✅ User authenticated and has items in cart - reopening checkout');
          
          this.messageService.add({
            severity: 'success',
            summary: 'Authentication Successful',
            detail: 'You are now authenticated! Continuing with your order...',
            life: 4000
          });
          
          // Automatically reopen the checkout dialog
          setTimeout(() => {
            this.openOrderForm();
          }, 1000);
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
      console.log('🔄 User needs to request new authentication...');
      
      this.messageService.add({
        severity: 'info',
        summary: 'Authentication Required',
        detail: 'Please authenticate to continue with your order.',
        life: 4000
      });
      
      // Clean up URL parameters
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
        this.isLoadingBusinessData = false;
        console.log('Business data loaded:', data);
        
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
    if (this.dataService.CartItems.length == 0) {
      this.dataService.openSnackBar(this, 5000, 'Your cart is empty, you need to add some services to checkout', 'OK');
    } else if (!this.selectedDate) {
      this.dataService.openSnackBar(this, 5000, 'Please select a service date before proceeding to checkout', 'OK');
    } else {
      // Autofill from cookies if available
      const name = this.cookieService.get('customerName');
      const email = this.cookieService.get('customerEmail');
      const phone = this.cookieService.get('customerPhone');
      const address = this.cookieService.get('customerAddress');
      const city = this.cookieService.get('customerCity');
      const state = this.cookieService.get('customerState');
      const postalCode = this.cookieService.get('customerPostalCode');
      console.log('Patching form from cookies:', { name, email, phone, address, city, state, postalCode });
      this.customerForm.patchValue({ name, email, phone, address, city, state, postalCode });
      this.customerForm.updateValueAndValidity();
      this.showCustomerForm = true;
      
      // Force fix dialog background for checkout dialog
      setTimeout(() => {
        this.fixDialogBackground();
      }, 100);
      
      // Only try to get browser location if no saved address exists
      if (!address || !city || !state || !postalCode) {
        console.log('No complete address saved in cookies, trying geolocation...');
        this.tryPatchAddressFromLocation();
      } else {
        console.log('Complete address found in cookies, skipping geolocation.');
      }
    }
  }

  // Try to get browser location and patch address fields
  tryPatchAddressFromLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('Geolocation success:', { lat, lng });
          // Placeholder: Replace with real reverse geocoding API call
          this.reverseGeocode(lat, lng).then(addr => {
            console.log('Patching form from geolocation:', addr);
            // Only patch address-related fields to preserve existing personal information
            this.customerForm.patchValue({
              address: addr.address,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode
            });
            this.customerForm.updateValueAndValidity();
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
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

  cancelOrder() {
    this.showCustomerForm = false;
    this.customerForm.reset();
    this.selectedDate = undefined;
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
   * Initialize cart with location options
   */
  initializeCartWithLocations(): void {
    this.cartItemsWithLocations = this.dataService.CartItems.map(item => ({
      ...item,
      selectedLocation: undefined
    }));
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
    // Initialize cart with locations if not already done
    if (this.cartItemsWithLocations.length !== this.dataService.CartItems.length) {
      this.initializeCartWithLocations();
    }

    if (!this.isAuthenticated) {
      this.currentAuthStep = { step: 'auth', title: 'Authentication' };
    } else {
      this.currentAuthStep = { step: 'details', title: 'Details' };
    }
    
    this.showCustomerForm = true;
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
   * Clear cart and reset forms
   */
  private clearCartAndForm(): void {
    this.dataService.CartItems = [];
    this.dataService.updateItemsInCart();
    this.cartItemsWithLocations = [];
    this.showCustomerForm = false;
    this.customerForm.reset();
    this.selectedDate = undefined;
    this.currentAuthStep = { step: 'auth', title: 'Authentication' };
  }

  /**
   * Handle location selection for cart item
   */
  onLocationSelected(cartItem: CartItemWithLocation, location: ServiceLocation): void {
    cartItem.selectedLocation = location;
    
    // Check if any S2C locations are selected and add address fields if needed
    this.updateFormFieldsBasedOnSelections();
    
    this.validateLocationSelections();
  }

  /**
   * Update form fields based on location selections
   */
  private updateFormFieldsBasedOnSelections(): void {
    const hasS2CServices = this.cartItemsWithLocations.some(item => 
      item.selectedLocation?.type === OrderType.S2C
    );

    if (hasS2CServices) {
      this.addAddressFieldsToForm();
    }
  }

  /**
   * Add address fields to customer form when S2C services are selected
   */
  private addAddressFieldsToForm(): void {
    if (!this.customerForm.get('address')) {
      this.customerForm.addControl('address', this.fb.control('', [Validators.required]));
      this.customerForm.addControl('city', this.fb.control('', [Validators.required]));
      this.customerForm.addControl('state', this.fb.control('', [Validators.required]));
      this.customerForm.addControl('postalCode', this.fb.control('', [Validators.required]));
      this.customerForm.addControl('country', this.fb.control('Australia', [Validators.required]));
      
      // Load saved address data if available
      const savedAddress = this.cookieService.get('customerAddress');
      const savedCity = this.cookieService.get('customerCity');
      const savedState = this.cookieService.get('customerState');
      const savedPostalCode = this.cookieService.get('customerPostalCode');
      
      if (savedAddress && savedCity && savedState && savedPostalCode) {
        this.customerForm.patchValue({
          address: savedAddress,
          city: savedCity,
          state: savedState,
          postalCode: savedPostalCode
        });
      }
    }
  }

  /**
   * Validate that all cart items have location selections
   */
  private validateLocationSelections(): boolean {
    return this.cartItemsWithLocations.every(item => !!item.selectedLocation);
  }

  /**
   * Get available locations for a service
   */
  getLocationsForService(serviceId: string): ServiceLocation[] {
    // For demo purposes, return both types
    // In real implementation, this would come from business data
    return [
      {
        id: 'customer-location',
        name: 'At Customer Location',
        type: OrderType.S2C
      },
      {
        id: 'business-location-1', 
        name: 'Main Business Location',
        type: OrderType.C2S,
        placeID: 'PLACE_001',
        address: '123 Business St'
      }
    ];
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
}
