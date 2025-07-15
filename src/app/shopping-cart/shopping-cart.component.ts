import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { CommonModule } from '@angular/common';
import { CartItem } from '../data-service.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { WebsiteHosterService } from '../services/website-hoster.service';
import { ServiceDto, BusinessBasicInfoDto } from '../models/WebsiteHoster';

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
import { MessageService } from 'primeng/api';
import { ReviewsComponent } from '../reviews/reviews.component';

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

interface OrderData {
  customerDetails: CustomerDetails;
  selectedDate: Date;
  cartItems: CartItem[];
  totalPrice: number;
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
    ReviewsComponent
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css',
  providers: [CookieService],
  encapsulation: ViewEncapsulation.None
})
export class ShoppingCartComponent implements OnInit{
  public dataService = inject(DataServiceService);
  public websiteHosterService = inject(WebsiteHosterService);
  customerForm: FormGroup;
  showCustomerForm = false;
  selectedDate: Date | undefined = undefined;
  minDate!: Date;
  
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

  constructor(private fb: FormBuilder, private cookieService: CookieService) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    // Set minimum date to tomorrow
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    
    this.loadBusinessData();
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
      
      // Save name, email, phone, and address fields as cookies with 1000-year expiration
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1000);
      this.cookieService.set('customerName', customerDetails.name, expires, '/');
      this.cookieService.set('customerEmail', customerDetails.email, expires, '/');
      this.cookieService.set('customerPhone', customerDetails.phone, expires, '/');
      this.cookieService.set('customerAddress', customerDetails.address, expires, '/');
      this.cookieService.set('customerCity', customerDetails.city, expires, '/');
      this.cookieService.set('customerState', customerDetails.state, expires, '/');
      this.cookieService.set('customerPostalCode', customerDetails.postalCode, expires, '/');

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
}
