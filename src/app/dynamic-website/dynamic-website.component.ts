import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WebsiteParserService, WebsiteHostingDto, WorkspaceComponentDto } from '../website-parser.service';

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
        <div class="website-header">
          <h1>{{ websiteData.name }}</h1>
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
  `,
  styles: [`
    .dynamic-website-container {
      padding: 20px;
      min-height: 100vh;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      text-align: center;
      padding: 40px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 20px 0;
    }

    .error-container h2 {
      color: #dc3545;
      margin-bottom: 16px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .website-content {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .website-header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .website-header h1 {
      color: #333;
      margin: 0;
    }

    .website-json-content {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .components-container {
      margin-top: 20px;
    }

    .component-item {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .component-id {
      font-size: 12px;
      color: #6c757d;
    }

    .component-details {
      font-size: 14px;
    }

    .component-parameters {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #dee2e6;
    }

    .component-parameters pre {
      background-color: #fff;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }

    pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }
  `]
})
export class DynamicWebsiteComponent implements OnInit, OnDestroy {
  websiteData: WebsiteHostingDto | null = null;
  loading = false;
  error: string | null = null;
  parsedWebsiteJson: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private websiteParserService: WebsiteParserService
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

    this.websiteParserService.getWebsiteByName(websiteName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.websiteData = data;
          this.parsedWebsiteJson = this.websiteParserService.parseWebsiteJson(data.websiteJson);
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
          console.error('Error loading website:', error);
        }
      });
  }

  parseComponentParameters(parameters: string | null): any {
    return this.websiteParserService.parseComponentParameters(parameters);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
} 