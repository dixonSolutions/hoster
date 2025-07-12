import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
}
*/ 