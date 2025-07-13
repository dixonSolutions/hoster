import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DataServiceService } from '../data-service.service';
import { CommonModule } from '@angular/common';
import { CartItem } from '../data-service.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { WebsiteHosterService } from '../services/website-hoster.service';
import { ServiceDto, BusinessBasicInfoDto } from '../models/WebsiteHoster';
import { CalendarModule } from 'primeng/calendar';


// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';

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
    MatTableModule, 
    MatIconModule, 
    MatDatepickerModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    CalendarModule,
    // PrimeNG Modules
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,

    ChipModule,
    TagModule,
    DividerModule,
    MessageModule,
    ProgressSpinnerModule,
    PanelModule,
    BadgeModule,
    TooltipModule
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css',
  providers: [CookieService]
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
      },
      error: (error) => {
        console.error('Error loading business data:', error);
        this.isLoadingBusinessData = false;
        this.dataService.openSnackBar(this, 5000, 'Error loading business services: ' + error.message, 'OK');
      }
    });
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
      // Try to get browser location and patch address fields
      this.tryPatchAddressFromLocation();
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
            this.customerForm.patchValue(addr);
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
