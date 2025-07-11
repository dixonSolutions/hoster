import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { WebsiteParserService, WebsiteHostingDto, WorkspaceComponentDto } from '../website-parser.service';
import { WebsiteRenderingService } from '../services/website-rendering.service';
import { TopbarComponent } from '../topbar/topbar.component';
import { ShoppingCartComponent } from '../shopping-cart/shopping-cart.component';
import { OrderHistoryComponent } from '../order-history/order-history.component';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { HomeComponent } from '../home/home.component';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChipModule } from 'primeng/chip';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-dynamic-website',
  standalone: true,
  imports: [
    CommonModule, 
    TopbarComponent, 
    ShoppingCartComponent, 
    OrderHistoryComponent, 
    ContactUsComponent, 
    HomeComponent,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ChipModule,
    TabViewModule,
    AccordionModule
  ],
  template: `
    <div class="dynamic-website-container">
      <!-- Always show topbar for consistency -->
      <app-topbar 
        *ngIf="websiteData && parsedWebsiteJson"
        [websiteData]="parsedWebsiteJson"
        [currentPageId]="currentPageId">
      </app-topbar>

      <!-- Loading State -->
      <div *ngIf="loading" class="p-d-flex p-flex-column p-ai-center p-jc-center loading-container">
        <p-progressSpinner styleClass="custom-spinner"></p-progressSpinner>
        <p class="p-text-center p-mt-3">Loading website...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="p-d-flex p-flex-column p-ai-center p-jc-center error-container">
        <p-card styleClass="error-card">
          <ng-template pTemplate="header">
            <div class="p-text-center p-p-3">
              <i class="pi pi-exclamation-triangle error-icon"></i>
            </div>
          </ng-template>
          <ng-template pTemplate="content">
            <h2 class="p-text-center p-mb-3">Website Not Found</h2>
            <p class="p-text-center p-mb-4">{{ error }}</p>
            <div class="p-text-center">
              <p-button 
                label="Go to Home" 
                icon="pi pi-home" 
                styleClass="p-button-primary"
                (onClick)="goHome()">
              </p-button>
            </div>
          </ng-template>
        </p-card>
      </div>

      <!-- Main Content -->
      <div *ngIf="websiteData && !loading && !error" class="main-content">
        <!-- Angular Component Pages with proper spacing -->
        <div *ngIf="isAngularComponentPage" class="angular-component-wrapper">
          <div class="component-container">
            <app-shopping-cart *ngIf="currentAngularComponent === 'ShoppingCartComponent'"></app-shopping-cart>
            <app-order-history *ngIf="currentAngularComponent === 'OrderHistoryComponent'"></app-order-history>
            <app-contact-us *ngIf="currentAngularComponent === 'ContactUsComponent'"></app-contact-us>
            <app-home *ngIf="currentAngularComponent === 'HomeComponent'"></app-home>
          </div>
        </div>
        
        <!-- Rendered Website Content -->
        <div *ngIf="!isAngularComponentPage && safeRenderedHtml" class="rendered-website-wrapper">
          <div class="rendered-content" [innerHTML]="safeRenderedHtml"></div>
        </div>
        
        <!-- Debug View with PrimeNG styling -->
        <div *ngIf="!isAngularComponentPage && !safeRenderedHtml" class="debug-wrapper">
          <div class="p-grid p-justify-center">
            <div class="p-col-12 p-lg-10 p-xl-8">
              <p-card styleClass="debug-card">
                <ng-template pTemplate="header">
                  <div class="debug-header">
                    <h1 class="website-title">{{ websiteData.name }}</h1>
                    <p-chip 
                      label="Debug Mode" 
                      icon="pi pi-cog" 
                      styleClass="debug-chip">
                    </p-chip>
                  </div>
                </ng-template>
                
                <ng-template pTemplate="content">
                  <p-tabView>
                    <!-- Website JSON Tab -->
                    <p-tabPanel header="Website Data" leftIcon="pi pi-file-o">
                      <div *ngIf="parsedWebsiteJson">
                        <pre class="json-display">{{ parsedWebsiteJson | json }}</pre>
                      </div>
                    </p-tabPanel>
                    
                    <!-- Components Tab -->
                    <p-tabPanel 
                      header="Components" 
                      leftIcon="pi pi-th-large"
                      *ngIf="websiteData.components && websiteData.components.length > 0">
                      <div class="components-grid">
                        <p-card 
                          *ngFor="let component of websiteData.components" 
                          styleClass="component-card p-mb-3">
                          <ng-template pTemplate="header">
                            <div class="component-card-header">
                              <span class="component-type">{{ component.componentType }}</span>
                              <p-chip [label]="'ID: ' + component.id" styleClass="id-chip"></p-chip>
                            </div>
                          </ng-template>
                          <ng-template pTemplate="content">
                            <div class="component-details-grid">
                              <div class="detail-item">
                                <strong>Position:</strong> X: {{ component.xPosition }}, Y: {{ component.yPosition }}
                              </div>
                              <div class="detail-item">
                                <strong>Size:</strong> {{ component.width }}x{{ component.height }}
                              </div>
                              <div class="detail-item">
                                <strong>Z-Index:</strong> {{ component.zIndex }}
                              </div>
                              <div *ngIf="component.parameters" class="detail-item">
                                <p-accordion>
                                  <p-accordionTab header="Parameters">
                                    <pre class="parameters-display">{{ parseComponentParameters(component.parameters) | json }}</pre>
                                  </p-accordionTab>
                                </p-accordion>
                              </div>
                            </div>
                          </ng-template>
                        </p-card>
                      </div>
                    </p-tabPanel>
                  </p-tabView>
                </ng-template>
              </p-card>
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
      background-color: var(--surface-ground);
      position: relative;
    }

    /* Loading State Styling */
    .loading-container {
      min-height: calc(100vh - 100px);
      margin-top: 100px;
      background: var(--surface-card);
    }

    .custom-spinner ::ng-deep .p-progress-spinner-circle {
      stroke: var(--primary-color);
      animation: p-progress-spinner-rotate 2s linear infinite;
    }

    /* Error State Styling */
    .error-container {
      min-height: calc(100vh - 100px);
      margin-top: 100px;
      padding: 2rem;
    }

    .error-card {
      max-width: 600px;
      margin: 0 auto;
    }

    .error-icon {
      font-size: 4rem;
      color: var(--red-500);
    }

    /* Main Content Layout */
    .main-content {
      padding-top: 100px; /* Account for fixed topbar */
      min-height: calc(100vh - 100px);
      background-color: var(--surface-ground);
    }

    /* Angular Component Wrapper */
    .angular-component-wrapper {
      width: 100%;
      min-height: calc(100vh - 100px);
      background-color: var(--surface-card);
    }

    .component-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Rendered Website Content */
    .rendered-website-wrapper {
      width: 100%;
      min-height: calc(100vh - 100px);
      background-color: var(--surface-card);
    }

    .rendered-content {
      width: 100%;
      min-height: calc(100vh - 100px);
    }

    /* Debug View Styling */
    .debug-wrapper {
      padding: 2rem;
      min-height: calc(100vh - 100px);
      background-color: var(--surface-ground);
    }

    .debug-card {
      box-shadow: var(--card-shadow);
    }

    .debug-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-text) 100%);
      color: white;
      margin: -1rem -1rem 1rem -1rem;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
    }

    .website-title {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .debug-chip {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
    }

    /* Component Grid Styling */
    .components-grid {
      display: grid;
      gap: 1rem;
    }

    .component-card {
      transition: all 0.3s ease;
      border: 1px solid var(--surface-border);
    }

    .component-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow);
    }

    .component-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background-color: var(--surface-50);
      margin: -1rem -1rem 1rem -1rem;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
    }

    .component-type {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .id-chip {
      background-color: var(--surface-200) !important;
      color: var(--text-color) !important;
      font-size: 0.8rem;
    }

    .component-details-grid {
      display: grid;
      gap: 0.75rem;
    }

    .detail-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-item strong {
      color: var(--primary-color);
      font-weight: 600;
    }

    /* Code Display Styling */
    .json-display,
    .parameters-display {
      background-color: var(--surface-100);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      line-height: 1.4;
      max-height: 400px;
      overflow-y: auto;
      color: var(--text-color);
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .main-content {
        padding-top: 80px;
      }
      
      .loading-container,
      .error-container {
        margin-top: 80px;
        min-height: calc(100vh - 80px);
      }
      
      .angular-component-wrapper,
      .rendered-website-wrapper {
        min-height: calc(100vh - 80px);
      }
      
      .component-container {
        padding: 1rem;
      }
      
      .debug-wrapper {
        padding: 1rem;
        min-height: calc(100vh - 80px);
      }
      
      .debug-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .website-title {
        font-size: 1.4rem;
      }
    }

    /* Ensure no conflicts with existing styles */
    :host ::ng-deep .p-card {
      box-shadow: var(--card-shadow);
    }

    :host ::ng-deep .p-tabview .p-tabview-panels {
      background-color: var(--surface-card);
    }

    :host ::ng-deep .p-accordion .p-accordion-content {
      background-color: var(--surface-card);
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
  isAngularComponentPage = false;
  currentAngularComponent: string | null = null;
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
        // Check if this page contains Angular components
        const hasAngularComponent = currentPage.components.some(comp => comp.type === 'angular-component');
        
        if (hasAngularComponent) {
          // Find the Angular component to render
          const angularComponent = currentPage.components.find(comp => comp.type === 'angular-component');
          if (angularComponent && angularComponent.parameters?.componentName) {
            console.log(`🔧 Rendering Angular component: ${angularComponent.parameters.componentName}`);
            this.isAngularComponentPage = true;
            this.currentAngularComponent = angularComponent.parameters.componentName;
            this.safeRenderedHtml = null;
            return;
          }
        }

        // Regular HTML rendering for non-Angular component pages
        this.isAngularComponentPage = false;
        this.currentAngularComponent = null;
        
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