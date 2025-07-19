import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderAuthService } from '../services/order-auth.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-magic-link-handler',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    CardModule,
    MessageModule,
    ButtonModule
  ],
  template: `
    <div class="magic-link-container">
      <p-card styleClass="auth-card">
        <ng-template pTemplate="header">
          <div class="auth-header">
            <i class="pi pi-key"></i>
            <h2>Authenticating...</h2>
          </div>
        </ng-template>

        <div class="auth-content" *ngIf="isProcessing">
          <p-progressSpinner styleClass="auth-spinner"></p-progressSpinner>
          <p>Processing your authentication link...</p>
        </div>

        <div class="auth-content" *ngIf="!isProcessing && authSuccess">
          <p-message severity="success" text="Authentication successful! You can now place orders."></p-message>
          <p class="auth-details">
            Authenticated as: <strong>{{ authenticatedAs }}</strong>
          </p>
          <div class="auto-redirect-info" *ngIf="redirectCountdown > 0">
            <p class="countdown-text">
              <i class="pi pi-clock"></i>
              Redirecting you back to continue shopping in {{ redirectCountdown }} seconds...
            </p>
            <p-button 
              label="Continue Now" 
              icon="pi pi-arrow-right" 
              (onClick)="navigateToShopping()"
              styleClass="p-button-sm p-button-outlined">
            </p-button>
          </div>
        </div>

        <div class="auth-content" *ngIf="!isProcessing && !authSuccess">
          <p-message 
            severity="error" 
            [text]="errorMessage">
          </p-message>
        </div>

        <ng-template pTemplate="footer" *ngIf="!isProcessing">
          <div class="auth-actions">
            <p-button 
              label="Continue Shopping"
              icon="pi pi-shopping-cart"
              (onClick)="navigateToShopping()"
              styleClass="p-button-success"
              *ngIf="authSuccess">
            </p-button>
            
            <p-button 
              label="Request New Link"
              icon="pi pi-refresh"
              (onClick)="requestNewLink()"
              styleClass="p-button-outlined"
              *ngIf="!authSuccess">
            </p-button>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [`
    .magic-link-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .auth-header {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 6px 6px 0 0;
    }

    .auth-header i {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }

    .auth-header h2 {
      margin: 0;
      font-weight: 300;
    }

    .auth-content {
      text-align: center;
      padding: 2rem;
    }

    .auth-spinner {
      margin: 1rem 0;
    }

    .auth-details {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #28a745;
    }

    .auth-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .auto-redirect-info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
      text-align: center;
    }

    .countdown-text {
      margin: 0 0 1rem 0;
      color: #1976d2;
      font-weight: 500;
      font-size: 1.1rem;
    }

    .countdown-text i {
      margin-right: 0.5rem;
    }

    @media (max-width: 576px) {
      .auth-actions {
        flex-direction: column;
      }
      
      .auth-actions .p-button {
        width: 100%;
      }

      .auto-redirect-info {
        margin-top: 1rem;
        padding: 1rem;
      }

      .countdown-text {
        font-size: 1rem;
      }
    }
  `]
})
export class MagicLinkHandlerComponent implements OnInit, OnDestroy {
  isProcessing = true;
  authSuccess = false;
  errorMessage = '';
  authenticatedAs = '';
  redirectCountdown = 0;
  countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderAuthService: OrderAuthService
  ) {}

  ngOnInit(): void {
    this.processUrl();
  }

  ngOnDestroy(): void {
    // Clean up the countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private processUrl(): void {
    console.log('🔍 Magic Link Handler - Starting URL processing...');
    
    // Get the current URL and route information
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    console.log('📍 Current URL:', currentUrl);
    console.log('📍 Current Path:', currentPath);
    
    // Log route parameters for debugging
    console.log('🔍 Route params:', this.route.snapshot.paramMap.keys.map(key => ({
      key,
      value: this.route.snapshot.paramMap.get(key)
    })));
    
    // Extract JWT token from URL path
    const token = this.extractTokenFromUrl(currentPath);
    console.log('🎫 Extracted Token:', token ? token.substring(0, 50) + '...' : 'No token found');
    
    if (!token) {
      console.error('❌ No JWT token found in URL');
      this.handleProcessingResult(false, 'No authentication token found in the link.');
      return;
    }
    
    // Validate token format first
    if (!this.isValidJWTFormat(token)) {
      console.error('❌ Invalid JWT format');
      this.handleProcessingResult(false, 'Invalid authentication token format.');
      return;
    }
    
    // Process the magic link using both strategies
    let success = false;
    
    // Strategy 1: Use the extracted token directly
    if (token) {
      console.log('🔄 Attempting direct token processing...');
      success = this.orderAuthService.processJWTToken(token);
    }
    
    // Strategy 2: Fallback to full URL processing
    if (!success) {
      console.log('🔄 Fallback to full URL processing...');
      success = this.orderAuthService.processMagicLinkUrl(currentUrl);
    }
    
    setTimeout(() => {
      this.handleProcessingResult(success, success ? null : 'Invalid or expired authentication link. Please request a new one.');
    }, 1000); // Reduced delay for better UX
  }

  private extractTokenFromUrl(path: string): string | null {
    console.log('🔧 Extracting token from path:', path);
    
    // Strategy 1: Try to get token from route parameters first
    const routeToken = this.route.snapshot.paramMap.get('token');
    if (routeToken && this.isValidJWTFormat(routeToken)) {
      console.log('✅ Token found from route parameter (length):', routeToken.length);
      return routeToken;
    }
    
    // Strategy 2: Get websiteName from route parameters for reference
    const websiteName = this.route.snapshot.paramMap.get('websiteName');
    console.log('🌐 Website name from route:', websiteName);
    
    // Strategy 3: Extract from URL structure: /websiteName/auth/JWT_TOKEN
    // This is the most reliable method for JWT tokens
    const segments = path.split('/').filter(segment => segment.length > 0);
    console.log('📂 URL Segments:', segments);
    
    const authIndex = segments.findIndex(segment => segment === 'auth');
    console.log('🔍 Auth segment index:', authIndex);
    
    if (authIndex !== -1 && authIndex < segments.length - 1) {
      // Get everything after /auth/ as the token (handles long JWT tokens)
      const tokenParts = segments.slice(authIndex + 1);
      const token = tokenParts.join('/'); // Rejoin in case JWT was split by additional slashes
      console.log('✅ Token found at auth+1, parts count:', tokenParts.length, 'length:', token.length);
      
      if (this.isValidJWTFormat(token)) {
        // Handle potential URL encoding issues
        try {
          const decodedToken = decodeURIComponent(token);
          console.log('🔓 Decoded token length:', decodedToken.length);
          return decodedToken;
        } catch (e) {
          console.log('📝 Token not URL encoded, using as-is');
          return token;
        }
      }
    }
    
    // Strategy 4: Try to extract from the last segment if it looks like a JWT
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && this.isValidJWTFormat(lastSegment) && lastSegment !== 'auth') {
      console.log('✅ Token found using last segment strategy');
      return lastSegment;
    }
    
    // Strategy 5: Try to find any segment that looks like a JWT
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (this.isValidJWTFormat(segment)) {
        console.log('✅ JWT found in segment', i, ':', segment.substring(0, 50) + '...');
        return segment;
      }
    }
    
    console.warn('⚠️ No JWT token found using any strategy');
    console.log('🔍 Debug - all segments checked:', segments.map(s => ({ 
      segment: s.substring(0, 20) + (s.length > 20 ? '...' : ''), 
      length: s.length, 
      isJWT: this.isValidJWTFormat(s) 
    })));
    return null;
  }

  private isValidJWTFormat(token: string): boolean {
    if (!token) return false;
    const parts = token.split('.');
    const isValid = parts.length === 3;
    console.log('🧪 JWT format validation:', { tokenLength: token.length, parts: parts.length, isValid });
    return isValid;
  }

  private handleProcessingResult(success: boolean, errorMessage: string | null): void {
    this.isProcessing = false;
    
    if (success) {
      this.authSuccess = true;
      const token = this.orderAuthService.getAuthToken();
      this.authenticatedAs = token?.emailOrPhone || 'Unknown';
      console.log('🎉 Authentication successful for:', this.authenticatedAs);
      
      // Start countdown for auto-redirect
      this.redirectCountdown = 5;
      this.countdownInterval = setInterval(() => {
        this.redirectCountdown--;
        if (this.redirectCountdown <= 0) {
          clearInterval(this.countdownInterval);
          console.log('🔄 Auto-redirecting user back to shopping...');
          this.navigateToShopping();
        }
      }, 1000);
    } else {
      this.authSuccess = false;
      this.errorMessage = errorMessage || 'Authentication failed';
      console.error('❌ Authentication failed:', this.errorMessage);
    }
  }

  navigateToShopping(): void {
    // Clear the countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Navigate back to the website, preserving the website name
    const websiteName = this.getWebsiteNameFromRoute();
    if (websiteName) {
      // Navigate to shopping cart with a flag to indicate we're returning from auth
      this.router.navigate([`/${websiteName}`], { 
        queryParams: { 
          returnFromAuth: 'true',
          timestamp: Date.now()
        }
      });
    } else {
      this.router.navigate(['/'], { 
        queryParams: { 
          returnFromAuth: 'true',
          timestamp: Date.now()
        }
      });
    }
  }

  requestNewLink(): void {
    // Navigate back to the website, preserving the website name
    const websiteName = this.getWebsiteNameFromRoute();
    if (websiteName) {
      this.router.navigate([`/${websiteName}`], {
        queryParams: {
          requestNewAuth: 'true'
        }
      });
    } else {
      this.router.navigate(['/'], {
        queryParams: {
          requestNewAuth: 'true'
        }
      });
    }
  }

  private getWebsiteNameFromRoute(): string | null {
    // Extract website name from current route or URL
    const websiteName = this.route.snapshot.paramMap.get('websiteName');
    if (websiteName) {
      return websiteName;
    }
    
    // Fallback to extracting from URL
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    return segments.length > 0 ? segments[0] : null;
  }
} 