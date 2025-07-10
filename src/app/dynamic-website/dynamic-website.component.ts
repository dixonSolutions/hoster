import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { WebsiteParserService, WebsiteHostingDto, WorkspaceComponentDto } from '../website-parser.service';
import { WebsiteRenderingService } from '../services/website-rendering.service';

@Component({
  selector: 'app-dynamic-website',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dynamic-website-container">
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
      background-color: #f5f5f5;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
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
      margin: 40px auto;
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
    }

    .rendered-website {
      width: 100%;
      min-height: 100vh;
      padding: 0;
      margin: 0;
      border-radius: 0;
      background-color: #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }

    .website-debug {
      padding: 40px;
      background-color: #ffffff;
      border-radius: 12px;
      margin: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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

    .website-json-content {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      border: 1px solid #dee2e6;
    }

    .components-container {
      margin-top: 30px;
    }

    .components-container h3 {
      color: #333;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .component-item {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }

    .component-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .component-header strong {
      color: #333;
      font-size: 16px;
      font-weight: 700;
    }

    .component-id {
      font-size: 12px;
      color: #6c757d;
      background-color: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .component-details {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
    }

    .component-details p {
      margin: 8px 0;
    }

    .component-details strong {
      color: #333;
      font-weight: 600;
    }

    .component-parameters {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #dee2e6;
    }

    .component-parameters pre {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      padding: 15px;
      border-radius: 8px;
      font-size: 12px;
      overflow-x: auto;
      border: 1px solid #e9ecef;
      color: #333;
    }

    pre {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      padding: 15px;
      border-radius: 8px;
      font-size: 12px;
      overflow-x: auto;
      border: 1px solid #e9ecef;
      color: #333;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .website-debug {
        padding: 20px;
        margin: 10px;
      }
      
      .website-header h1 {
        font-size: 24px;
      }
      
      .component-item {
        padding: 15px;
      }
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
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private websiteParserService: WebsiteParserService,
    private websiteRenderingService: WebsiteRenderingService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      if (segments.length > 0) {
        const websiteName = segments[0].path;
        this.loadWebsiteData(websiteName);
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
      
      // Get the first page and render it
      const pages = this.websiteRenderingService.getAllPages();
      console.log('📄 Available pages:', pages.map(p => ({ id: p.id, name: p.name })));
      
      if (pages.length > 0) {
        this.websiteRenderingService.renderPage(pages[0].id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (html) => {
              this.renderedPageHtml = html;
              // Sanitize the HTML but trust it since it's from our rendering service
              this.safeRenderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
              console.log('✅ Website rendered successfully');
            },
            error: (error) => {
              console.error('❌ Failed to render website with new service:', error);
              // Keep the debug view as fallback
            }
          });
      } else {
        console.warn('⚠️ No pages found to render');
      }
    } catch (error) {
      console.error('❌ Failed to initialize website rendering service:', error);
      // Keep the debug view as fallback
    }
  }

  parseComponentParameters(parameters: string | null): any {
    return this.websiteParserService.parseComponentParameters(parameters);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
} 