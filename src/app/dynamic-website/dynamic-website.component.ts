import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { WebsiteParserService, WebsiteHostingDto, WorkspaceComponentDto } from '../website-parser.service';
import { WebsiteRenderingService } from '../services/website-rendering.service';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-dynamic-website',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  template: `
    <div class="dynamic-website-container">
      <!-- Include topbar with website data -->
      <app-topbar 
        *ngIf="websiteData && parsedWebsiteJson"
        [websiteData]="parsedWebsiteJson"
        [currentPageId]="currentPageId">
      </app-topbar>

      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading website...</p>
      </div>

      <div *ngIf="error" class="error-container">
        <h2>Website Not Found</h2>
        <p>{{ error }}</p>
        <button (click)="goHome()" class="btn btn-primary">Go to Home</button>
      </div>

      <div *ngIf="websiteData && !loading && !error" class="website-content">
        <!-- Render the actual website with trusted HTML -->
        <div *ngIf="safeRenderedHtml" class="rendered-website" [innerHTML]="safeRenderedHtml"></div>
        
        <!-- Fallback to debug view if no HTML -->
        <div *ngIf="!safeRenderedHtml" class="website-debug">
          <div class="website-header">
            <h1>{{ websiteData.name }}</h1>
            <p class="debug-notice">Debug View - Website rendering in progress...</p>
          </div>
          
          <div class="website-body">
            <div *ngIf="parsedWebsiteJson" class="website-json-content">
              <!-- Render the website JSON content -->
              <pre>{{ parsedWebsiteJson | json }}</pre>
            </div>
            
            <div *ngIf="websiteData.components && websiteData.components.length > 0" class="components-container">
              <h3>Components:</h3>
              <div *ngFor="let component of websiteData.components" class="component-item">
                <div class="component-header">
                  <strong>{{ component.componentType }}</strong>
                  <span class="component-id">ID: {{ component.id }}</span>
                </div>
                <div class="component-details">
                  <p><strong>Position:</strong> X: {{ component.xPosition }}, Y: {{ component.yPosition }}</p>
                  <p><strong>Size:</strong> {{ component.width }}x{{ component.height }}</p>
                  <p><strong>Z-Index:</strong> {{ component.zIndex }}</p>
                  <div *ngIf="component.parameters" class="component-parameters">
                    <strong>Parameters:</strong>
                    <pre>{{ parseComponentParameters(component.parameters) | json }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-website-container {
      padding: 0;
      margin: 0;
      min-height: 100vh;
      background-color: #ffffff;
      position: relative;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-top: 80px; /* Account for topbar */
    }

    .loading-spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #ffffff;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    .loading-container p {
      font-size: 18px;
      margin: 0;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      color: white;
      border-radius: 12px;
      margin: 120px auto 40px; /* Account for topbar */
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .error-container h2 {
      color: white;
      margin-bottom: 16px;
      font-size: 28px;
      font-weight: 700;
    }

    .error-container p {
      font-size: 16px;
      opacity: 0.9;
      line-height: 1.6;
    }

    .btn {
      padding: 12px 30px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      margin-top: 20px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    .website-content {
      background-color: transparent;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
      margin: 0;
      padding-top: 80px; /* Account for fixed topbar */
    }

    .rendered-website {
      width: 100%;
      min-height: calc(100vh - 80px);
      padding: 0;
      margin: 0;
      border-radius: 0;
      background-color: #ffffff;
      box-shadow: none;
      position: relative;
    }

    .website-debug {
      padding: 40px;
      background-color: #ffffff;
      border-radius: 12px;
      margin: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-top: 100px; /* Account for topbar */
    }

    .debug-notice {
      color: #6c757d;
      font-style: italic;
      margin: 0;
      font-size: 14px;
    }

    .website-header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      padding: 20px;
      border-radius: 8px;
    }

    .website-header h1 {
      color: #333;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .website-body {
      background-color: #f8f9fa;
      padding: 30px;
      border-radius: 12px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .website-json-content {
      background-color: #ffffff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .website-json-content pre {
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
      font-size: 12px;
      line-height: 1.4;
      max-height: 400px;
      overflow-y: auto;
      color: #495057;
    }

    .components-container {
      background-color: #ffffff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .components-container h3 {
      color: #495057;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .component-item {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      transition: all 0.3s ease;
    }

    .component-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #dee2e6;
    }

    .component-header strong {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
    }

    .component-id {
      font-size: 12px;
      color: #6c757d;
      background-color: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
    }

    .component-details {
      color: #495057;
      font-size: 14px;
    }

    .component-details p {
      margin: 5px 0;
      line-height: 1.4;
    }

    .component-parameters {
      margin-top: 10px;
      padding: 10px;
      background-color: #ffffff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .component-parameters strong {
      color: #495057;
      font-size: 13px;
    }

    .component-parameters pre {
      margin: 5px 0 0 0;
      padding: 8px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      font-size: 11px;
      line-height: 1.3;
      max-height: 200px;
      overflow-y: auto;
      color: #495057;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .website-debug {
        margin: 10px;
        padding: 20px;
        margin-top: 90px;
      }
      
      .error-container {
        margin: 100px 20px 20px;
        padding: 40px 20px;
      }
      
      .website-content {
        padding-top: 70px;
      }
    }

    /* Fix any potential dark elements or chips */
    * {
      box-sizing: border-box;
    }
    
    /* Ensure no dark backgrounds leak through */
    .dynamic-website-container::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      z-index: -1;
    }
  `]
})
export class DynamicWebsiteComponent implements OnInit, OnDestroy {
  websiteData: WebsiteHostingDto | null = null;
  loading = false;
  error: string | null = null;
  parsedWebsiteJson: any = null;
  renderedPageHtml: string | null = null;
  safeRenderedHtml: SafeHtml | null = null;
  currentPageId: string = 'home';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private websiteParserService: WebsiteParserService,
    private websiteRenderingService: WebsiteRenderingService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Get the website name from the URL segments (original approach)
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      if (segments.length > 0) {
        const websiteName = segments[0].path;
        this.loadWebsiteData(websiteName);
      }
    });
    
    // Get the page ID from query parameters and re-render when it changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
      const newPageId = queryParams['page'] || 'home';
      if (newPageId !== this.currentPageId) {
        this.currentPageId = newPageId;
        // Re-render the page if website is already loaded
        if (this.websiteData && this.websiteRenderingService.getAllPages().length > 0) {
          this.renderCurrentPage();
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWebsiteData(websiteName: string) {
    this.loading = true;
    this.error = null;
    this.websiteData = null;
    this.safeRenderedHtml = null;

    this.websiteParserService.getWebsiteByName(websiteName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.websiteData = data;
          this.parsedWebsiteJson = this.websiteParserService.parseWebsiteJson(data.websiteJson);
          this.renderWebsite(data);
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
          console.error('Error loading website:', error);
        }
      });
  }

  private async renderWebsite(websiteData: WebsiteHostingDto) {
    try {
      // Transform the website data into IncomingData format for the rendering service
      const incomingData = {
        workspaceId: websiteData.workspaceId,
        name: websiteData.name,
        websiteJson: websiteData.websiteJson || '{}',
        components: (websiteData.components || []).map(comp => ({
          ...comp,
          parameters: comp.parameters || undefined // Convert null to undefined
        }))
      };

      console.log('🚀 Initializing website rendering with data:', incomingData);
      
      await this.websiteRenderingService.initializeWebsite(incomingData);
      
      // Get all pages and render the current page
      const pages = this.websiteRenderingService.getAllPages();
      console.log('📄 Available pages:', pages.map(p => ({ id: p.id, name: p.name })));
      
      if (pages.length > 0) {
        // Render the current page instead of always the first page
        this.renderCurrentPage();
      } else {
        console.warn('⚠️ No pages found to render');
      }
    } catch (error) {
      console.error('❌ Failed to initialize website rendering service:', error);
      // Keep the debug view as fallback
    }
  }

  private renderCurrentPage() {
    const pages = this.websiteRenderingService.getAllPages();
    if (pages.length > 0) {
      const currentPage = pages.find(p => p.id === this.currentPageId);
      if (currentPage) {
        this.websiteRenderingService.renderPage(currentPage.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (html) => {
              this.renderedPageHtml = html;
              this.safeRenderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
              console.log('✅ Current page rendered successfully');
            },
            error: (error) => {
              console.error('❌ Failed to render current page:', error);
              // Keep the debug view as fallback
            }
          });
      } else {
        console.warn('⚠️ Current page not found:', this.currentPageId);
      }
    } else {
      console.warn('⚠️ No pages available to render current page:', this.currentPageId);
    }
  }

  parseComponentParameters(parameters: string | null): any {
    return this.websiteParserService.parseComponentParameters(parameters);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
} 