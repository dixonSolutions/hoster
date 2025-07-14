import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { 
  ServiceReview, 
  CreateServiceReviewRequest, 
  UpdateServiceReviewRequest, 
  ServiceReviewSummary,
  ServiceReviewResponse,
  ServiceReviewListResponse 
} from '../models/ServiceReview';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api/WebsiteHoster';

  constructor(private http: HttpClient) {}

  /**
   * Get all reviews for a specific service
   * @param serviceId - The ID of the service
   * @returns Observable<ServiceReview[]>
   */
  getReviewsForService(serviceId: string): Observable<ServiceReview[]> {
    const headers = this.getHeaders();
    return this.http.get<ServiceReview[]>(`${this.apiUrl}/reviews/service/${serviceId}`, { headers })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Add a new review for a service
   * @param review - The review data to add
   * @returns Observable<ServiceReview>
   */
  addReview(review: CreateServiceReviewRequest): Observable<ServiceReview> {
    const headers = this.getHeaders();
    return this.http.post<ServiceReviewResponse>(`${this.apiUrl}/reviews`, review, { headers })
      .pipe(
        retry(2),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to add review');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing review
   * @param reviewId - The ID of the review to update
   * @param review - The updated review data
   * @returns Observable<ServiceReview>
   */
  updateReview(reviewId: string, review: UpdateServiceReviewRequest): Observable<ServiceReview> {
    const headers = this.getHeaders();
    return this.http.put<ServiceReviewResponse>(`${this.apiUrl}/reviews/${reviewId}`, review, { headers })
      .pipe(
        retry(2),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to update review');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a review
   * @param reviewId - The ID of the review to delete
   * @returns Observable<any>
   */
  deleteReview(reviewId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<ServiceReviewResponse>(`${this.apiUrl}/reviews/${reviewId}`, { headers })
      .pipe(
        retry(2),
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to delete review');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get review summary for a service (average rating, total count, etc.)
   * @param serviceId - The ID of the service
   * @returns Observable<ServiceReviewSummary>
   */
  getReviewSummary(serviceId: string): Observable<ServiceReviewSummary> {
    const headers = this.getHeaders();
    return this.http.get<ServiceReviewSummary>(`${this.apiUrl}/reviews/service/${serviceId}/summary`, { headers })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get reviews for multiple services (for batch operations)
   * @param serviceIds - Array of service IDs
   * @returns Observable<{[serviceId: string]: ServiceReview[]}>
   */
  getReviewsForMultipleServices(serviceIds: string[]): Observable<{[serviceId: string]: ServiceReview[]}> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('serviceIds', serviceIds.join(','));
    return this.http.get<{[serviceId: string]: ServiceReview[]}>(`${this.apiUrl}/reviews/services`, { headers, params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get review summaries for multiple services
   * @param serviceIds - Array of service IDs
   * @returns Observable<{[serviceId: string]: ServiceReviewSummary}>
   */
  getReviewSummariesForMultipleServices(serviceIds: string[]): Observable<{[serviceId: string]: ServiceReviewSummary}> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('serviceIds', serviceIds.join(','));
    return this.http.get<{[serviceId: string]: ServiceReviewSummary}>(`${this.apiUrl}/reviews/services/summaries`, { headers, params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Validate review data before submission
   * @param review - The review data to validate
   * @returns {isValid: boolean, errors: string[]}
   */
  validateReview(review: CreateServiceReviewRequest | UpdateServiceReviewRequest): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];

    // Validate stars (1-5 range)
    if (!review.stars || review.stars < 1 || review.stars > 5) {
      errors.push('Stars must be between 1 and 5');
    }

    // Validate name
    if (!review.name || review.name.trim().length === 0) {
      errors.push('Name is required');
    } else if (review.name.trim().length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }

    // Validate description (optional but has limits)
    if (review.description && review.description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    // Additional validation for create request
    if ('businessID' in review) {
      const createReview = review as CreateServiceReviewRequest;
      if (!createReview.businessID || createReview.businessID.trim().length === 0) {
        errors.push('Business ID is required');
      }
      if (!createReview.serviceID || createReview.serviceID.trim().length === 0) {
        errors.push('Service ID is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get HTTP headers with content type and authorization
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  /**
   * Handle HTTP errors
   * @param error - The HttpErrorResponse
   * @returns Observable<never>
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid review data. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Review or service not found.';
          break;
        case 409:
          errorMessage = 'Review already exists for this service.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        default:
          errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }
    
    console.error('ReviewService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
} 