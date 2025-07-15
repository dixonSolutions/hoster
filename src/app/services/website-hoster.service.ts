import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { 
  BusinessRegistrationDto, 
  WebsiteHostingDto, 
  ServiceDto, 
  BusinessBasicInfoDto, 
  StaffMemberDto 
} from '../models/WebsiteHoster';

@Injectable({
  providedIn: 'root'
})
export class WebsiteHosterService {
  private baseUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/WebsiteHoster';
  
  // Cache for business registration data
  private businessRegistrationCache: Map<string, BusinessRegistrationDto> = new Map();
  private websiteHostingCache: Map<string, WebsiteHostingDto> = new Map();
  
  // Cache for available days with timestamp for cache expiration
  private availableDaysCache: Map<string, { data: Date[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Current business data (for easy access across components)
  private currentBusinessRegistration: BusinessRegistrationDto | null = null;
  private currentWebsiteHosting: WebsiteHostingDto | null = null;
  private currentWebsiteName: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get website hosting data by website name (with caching)
   * @param websiteName - The name of the website to fetch
   * @returns Observable<WebsiteHostingDto>
   */
  getWebsiteByName(websiteName: string): Observable<WebsiteHostingDto> {
    // Check cache first
    if (this.websiteHostingCache.has(websiteName)) {
      return new Observable(observer => {
        observer.next(this.websiteHostingCache.get(websiteName)!);
        observer.complete();
      });
    }

    return this.http.get<WebsiteHostingDto>(`${this.baseUrl}/${encodeURIComponent(websiteName)}`)
      .pipe(
        catchError(this.handleError),
        // Cache the result
        tap(data => {
          this.websiteHostingCache.set(websiteName, data);
          this.currentWebsiteHosting = data;
          this.currentWebsiteName = websiteName;
        })
      );
  }

  /**
   * Get business registration data by website name (with caching)
   * @param websiteName - The name of the website to fetch business data for
   * @returns Observable<BusinessRegistrationDto>
   */
  getBusinessRegistrationByWebsiteName(websiteName: string): Observable<BusinessRegistrationDto> {
    // Check cache first
    if (this.businessRegistrationCache.has(websiteName)) {
      return new Observable(observer => {
        observer.next(this.businessRegistrationCache.get(websiteName)!);
        observer.complete();
      });
    }

    return this.http.get<BusinessRegistrationDto>(`${this.baseUrl}/${encodeURIComponent(websiteName)}/business`)
      .pipe(
        catchError(this.handleError),
        // Cache the result
        tap(data => {
          this.businessRegistrationCache.set(websiteName, data);
          this.currentBusinessRegistration = data;
          this.currentWebsiteName = websiteName;
        })
      );
  }

  /**
   * Get next available days for a business based on their schedule and order-ahead settings
   * @param businessId - The business ID
   * @returns Observable array of available dates
   */
  getNextAvailableDays(businessId: string): Observable<Date[]> {
    // Check cache first and validate it's not expired
    const cached = this.availableDaysCache.get(businessId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return new Observable(observer => {
        observer.next(cached.data);
        observer.complete();
      });
    }

    return this.http.get<string[]>(`${this.baseUrl}/business/${encodeURIComponent(businessId)}/available-days`)
      .pipe(
        map(dates => dates.map(dateStr => new Date(dateStr))),
        catchError(this.handleError),
        // Cache the result with timestamp
        tap(data => {
          this.availableDaysCache.set(businessId, {
            data: data,
            timestamp: now
          });
        })
      );
  }

  /**
   * Clear available days cache for specific business
   * @param businessId - The business ID to clear from cache
   */
  clearAvailableDaysCache(businessId: string): void {
    this.availableDaysCache.delete(businessId);
  }

  /**
   * Clear all available days cache
   */
  clearAllAvailableDaysCache(): void {
    this.availableDaysCache.clear();
  }

  /**
   * Check if available days are cached for a business
   * @param businessId - The business ID
   * @returns boolean
   */
  hasAvailableDaysCache(businessId: string): boolean {
    const cached = this.availableDaysCache.get(businessId);
    const now = Date.now();
    return cached ? (now - cached.timestamp) < this.CACHE_DURATION : false;
  }

  /**
   * Get cached available days (if valid)
   * @param businessId - The business ID
   * @returns Date[] | null
   */
  getCachedAvailableDays(businessId: string): Date[] | null {
    const cached = this.availableDaysCache.get(businessId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Get current business registration data (from cache)
   * @returns BusinessRegistrationDto | null
   */
  getCurrentBusinessRegistration(): BusinessRegistrationDto | null {
    return this.currentBusinessRegistration;
  }

  /**
   * Get current website hosting data (from cache)
   * @returns WebsiteHostingDto | null
   */
  getCurrentWebsiteHosting(): WebsiteHostingDto | null {
    return this.currentWebsiteHosting;
  }

  /**
   * Get current website name
   * @returns string | null
   */
  getCurrentWebsiteName(): string | null {
    return this.currentWebsiteName;
  }

  /**
   * Set current business data (for manual updates)
   * @param websiteName - The website name
   * @param businessData - The business registration data
   */
  setCurrentBusinessData(websiteName: string, businessData: BusinessRegistrationDto): void {
    this.currentBusinessRegistration = businessData;
    this.currentWebsiteName = websiteName;
    this.businessRegistrationCache.set(websiteName, businessData);
  }

  /**
   * Clear cache for specific website
   * @param websiteName - The website name to clear from cache
   */
  clearCache(websiteName: string): void {
    this.businessRegistrationCache.delete(websiteName);
    this.websiteHostingCache.delete(websiteName);
    
    if (this.currentWebsiteName === websiteName) {
      this.currentBusinessRegistration = null;
      this.currentWebsiteHosting = null;
      this.currentWebsiteName = null;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.businessRegistrationCache.clear();
    this.websiteHostingCache.clear();
    this.availableDaysCache.clear();
    this.currentBusinessRegistration = null;
    this.currentWebsiteHosting = null;
    this.currentWebsiteName = null;
  }

  /**
   * Check if business data is available for website
   * @param websiteName - The website name
   * @returns boolean
   */
  hasBusinessData(websiteName: string): boolean {
    return this.businessRegistrationCache.has(websiteName) || this.currentWebsiteName === websiteName;
  }

  /**
   * Get business services for display
   * @returns ServiceDto[]
   */
  getCurrentBusinessServices(): ServiceDto[] {
    return this.currentBusinessRegistration?.services || [];
  }

  /**
   * Get business basic info for display
   * @returns BusinessBasicInfoDto | null
   */
  getCurrentBusinessInfo(): BusinessBasicInfoDto | null {
    return this.currentBusinessRegistration?.basicInfo || null;
  }

  /**
   * Get business staff for display
   * @returns StaffMemberDto[]
   */
  getCurrentBusinessStaff(): StaffMemberDto[] {
    return this.currentBusinessRegistration?.staff || [];
  }

  /**
   * Error handler for HTTP requests
   * @param error - The HttpErrorResponse object
   * @returns Observable<never>
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request: Website name cannot be empty';
          break;
        case 404:
          errorMessage = 'Website or business data not found';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('WebsiteHosterService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}

/*
Usage example in a component:

export class MyComponent {
  availableDays: Date[] = [];

  constructor(private websiteHosterService: WebsiteHosterService) {}

  loadBusinessData(websiteName: string) {
    this.websiteHosterService.getBusinessRegistrationByWebsiteName(websiteName)
      .subscribe({
        next: (businessData) => {
          console.log('Business Data:', businessData);
          console.log('Business Name:', businessData.basicInfo.businessName);
          console.log('Services Count:', businessData.services.length);
          console.log('Staff Count:', businessData.staff.length);
        },
        error: (error) => {
          console.error('Error loading business data:', error.message);
        }
      });
  }

  loadWebsiteData(websiteName: string) {
    this.websiteHosterService.getWebsiteByName(websiteName)
      .subscribe({
        next: (websiteData) => {
          console.log('Website Data:', websiteData);
          console.log('Website Name:', websiteData.name);
          console.log('Workspace ID:', websiteData.workspaceId);
        },
        error: (error) => {
          console.error('Error loading website data:', error.message);
        }
      });
  }

  loadAvailableDays(businessId: string) {
    this.websiteHosterService.getNextAvailableDays(businessId)
      .subscribe({
        next: (availableDays) => {
          this.availableDays = availableDays;
          console.log(`Found ${availableDays.length} available days`);
          console.log('Available days:', availableDays.map(d => d.toDateString()));
        },
        error: (error) => {
          console.error('Error loading available days:', error.message);
          // Handle error - show user-friendly message
        }
      });
  }

  // Helper method to check if a date is weekend
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  // Helper method to select a day
  selectDay(selectedDate: Date): void {
    console.log('Selected date:', selectedDate.toDateString());
    // Implement your day selection logic here
  }
}

// Template usage example:
// <div class="available-days">
//   <h3>Available Days</h3>
//   <div class="calendar-grid">
//     <div *ngFor="let day of availableDays" 
//          class="available-day"
//          [class.weekend]="isWeekend(day)"
//          (click)="selectDay(day)">
//       {{ day | date:'MMM d, EEE' }}
//     </div>
//   </div>
// </div>

// PrimeNG Calendar integration example:
// <p-calendar 
//   [(ngModel)]="selectedDate"
//   [enabledDates]="availableDays"
//   [inline]="true"
//   [showWeek]="true">
// </p-calendar>
*/ 