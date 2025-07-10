import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

// Website Hosting DTOs
export interface WebsiteHostingDto {
  workspaceId: string;
  name: string;
  websiteJson: string | null;
  components: WorkspaceComponentDto[];
}

export interface WorkspaceComponentDto {
  id: string;
  workspaceId: string;
  pageId: string;
  componentId: string;
  componentType: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  zIndex: number;
  parameters: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebsiteParserService {
  private apiUrl = 'https://servicefuzzapi-atf8b4dqawc8dsa9.australiaeast-01.azurewebsites.net/api';
  
  constructor(private http: HttpClient) {}

  /**
   * Fetch website data by name for hosting/preview
   * Called when user navigates to /name_provided and it's not a known route
   * @param websiteName - The name/slug of the website to fetch
   * @returns Observable<WebsiteHostingDto>
   */
  getWebsiteByName(websiteName: string): Observable<WebsiteHostingDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<WebsiteHostingDto>(
      `${this.apiUrl}/Website/GetByName/${encodeURIComponent(websiteName)}`,
      { headers }
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Get website components by workspace ID
   * @param workspaceId - The workspace ID to fetch components for
   * @returns Observable<WorkspaceComponentDto[]>
   */
  getWorkspaceComponents(workspaceId: string): Observable<WorkspaceComponentDto[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<WorkspaceComponentDto[]>(
      `${this.apiUrl}/Workspace/${encodeURIComponent(workspaceId)}/Components`,
      { headers }
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Check if a website name is available/exists
   * @param websiteName - The name to check
   * @returns Observable<boolean>
   */
  checkWebsiteNameExists(websiteName: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<boolean>(
      `${this.apiUrl}/Website/CheckNameExists/${encodeURIComponent(websiteName)}`,
      { headers }
    ).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Parse and render website JSON structure
   * @param websiteJson - The JSON string containing website structure
   * @returns Parsed website object
   */
  parseWebsiteJson(websiteJson: string | null): any {
    if (!websiteJson) {
      return null;
    }

    try {
      return JSON.parse(websiteJson);
    } catch (error) {
      console.error('Error parsing website JSON:', error);
      return null;
    }
  }

  /**
   * Parse component parameters
   * @param parameters - The parameters string to parse
   * @returns Parsed parameters object
   */
  parseComponentParameters(parameters: string | null): any {
    if (!parameters) {
      return {};
    }

    try {
      return JSON.parse(parameters);
    } catch (error) {
      console.error('Error parsing component parameters:', error);
      return {};
    }
  }

  /**
   * Error handler for HTTP requests
   * @param error - The error object
   * @returns Observable<never>
   */
  private handleError = (error: any): Observable<never> => {
    console.error('WebsiteParserService Error:', error);
    
    let errorMessage = 'An error occurred while fetching website data.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 404:
          errorMessage = 'Website not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
} 