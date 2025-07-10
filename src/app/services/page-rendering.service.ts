import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  ProcessedPage, 
  NavigationConfig, 
  ComponentDefinition,
  ComponentInstance,
  PageRenderOptions,
  ComponentRenderOptions
} from '../models/WebsiteRendering';
import { ComponentRenderingService } from './component-rendering.service';
import { NavigationRenderingService } from './navigation-rendering.service';
import { WebsiteCacheService } from './website-cache.service';

@Injectable({
  providedIn: 'root'
})
export class PageRenderingService {

  constructor(
    private componentRenderer: ComponentRenderingService,
    private navigationRenderer: NavigationRenderingService,
    private cacheService: WebsiteCacheService
  ) {}

  /**
   * Render a complete page with all components
   */
  renderPage(
    page: ProcessedPage,
    navigationConfig: NavigationConfig,
    pages: ProcessedPage[],
    componentDefinitions: Map<string, ComponentDefinition>,
    options: PageRenderOptions = { includeNavigation: true }
  ): Observable<string> {
    return new Observable(observer => {
      try {
        // Check cache first
        const cacheKey = this.generatePageCacheKey(page, options);
        const cached = this.cacheService.getRenderedPage(cacheKey);
        if (cached) {
          observer.next(cached);
          observer.complete();
          return;
        }

        // Render page components
        const sortedComponents = this.sortComponentsByZIndex(page.components);
        const componentsHTML = this.renderPageComponents(sortedComponents, componentDefinitions);

        // Render navigation if requested
        const navigationHTML = options.includeNavigation 
          ? this.navigationRenderer.renderTopNavigation(navigationConfig, pages)
          : '';

        // Generate complete page HTML
        const fullPageHTML = this.assembleCompletePage(
          page,
          navigationHTML,
          componentsHTML,
          options
        );

        // Cache the result
        this.cacheService.setRenderedPage(cacheKey, fullPageHTML);

        observer.next(fullPageHTML);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Render page components
   */
  private renderPageComponents(
    components: ComponentInstance[],
    componentDefinitions: Map<string, ComponentDefinition>
  ): string {
    return components.map(component => {
      const componentDef = componentDefinitions.get(component.type);
      if (!componentDef) {
        console.warn(`Component definition not found for type: ${component.type}`);
        return this.renderMissingComponentError(component);
      }

      const renderOptions: ComponentRenderOptions = {
        includeWrapper: true,
        customClasses: ['page-component']
      };

      return this.componentRenderer.renderComponent(component, componentDef, renderOptions);
    }).join('');
  }

  /**
   * Assemble complete page HTML
   */
  private assembleCompletePage(
    page: ProcessedPage,
    navigationHTML: string,
    componentsHTML: string,
    options: PageRenderOptions
  ): string {
    const pageTitle = this.generatePageTitle(page);
    const pageCSS = this.generatePageCSS(options);
    const pageJS = this.generatePageJS(options);

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${pageTitle}</title>
          <meta name="description" content="${this.generatePageDescription(page)}">
          <meta name="robots" content="index, follow">
          
          <!-- Preload critical resources -->
          <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
          
          <!-- PrimeNG CSS with working CDN fallbacks -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeng@17.18.0/resources/themes/saga-blue/theme.css" onerror="this.onerror=null;this.href='https://unpkg.com/primeng@17.18.0/resources/themes/saga-blue/theme.css';">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeng@17.18.0/resources/primeng.min.css" onerror="this.onerror=null;this.href='https://unpkg.com/primeng@17.18.0/resources/primeng.min.css';">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css" onerror="this.onerror=null;this.href='https://unpkg.com/primeicons@7.0.0/primeicons.css';">
          
          <!-- Comprehensive PrimeNG fallback styles -->
          <style>
            /* Reset and base styles */
            * {
              box-sizing: border-box;
            }
            
            .p-component {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
              font-size: 14px;
            }
            
            /* Card Component */
            .p-card {
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
              overflow: hidden;
              position: relative;
            }
            
            .p-card-body {
              padding: 1.5rem;
            }
            
            .p-card-title {
              font-size: 1.5rem;
              font-weight: 700;
              margin: 0 0 1rem 0;
            }
            
            .p-card-subtitle {
              font-weight: 400;
              margin: 0 0 0.5rem 0;
              color: #6c757d;
            }
            
            .p-card-content {
              padding: 0;
            }
            
            .p-card-footer {
              padding: 1rem 1.5rem;
              border-top: 1px solid #e9ecef;
            }
            
            /* Button Component */
            .p-button {
              background: #2196F3;
              border: 1px solid #2196F3;
              color: #ffffff;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0.75rem 1rem;
              font-size: 1rem;
              text-decoration: none;
              overflow: hidden;
              position: relative;
              border-radius: 6px;
              transition: all 0.2s ease;
              font-family: inherit;
              user-select: none;
              outline: 0 none;
            }
            
            .p-button:not(:disabled):hover {
              background: #1976D2;
              border-color: #1976D2;
              color: #ffffff;
            }
            
            .p-button:not(:disabled):active {
              background: #1565C0;
              border-color: #1565C0;
            }
            
            .p-button:focus {
              outline: 0 none;
              outline-offset: 0;
              box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.5);
            }
            
            .p-button:disabled {
              cursor: default;
              opacity: 0.6;
            }
            
            .p-button-icon {
              margin-right: 0.5rem;
            }
            
            .p-button-icon-only .p-button-icon {
              margin: 0;
            }
            
            .p-button-text {
              background: transparent;
              border-color: transparent;
              color: #2196F3;
            }
            
            .p-button-text:not(:disabled):hover {
              background: rgba(33, 150, 243, 0.04);
              border-color: transparent;
              color: #2196F3;
            }
            
            .p-button-outlined {
              background: transparent;
              color: #2196F3;
              border: 1px solid #2196F3;
            }
            
            .p-button-outlined:not(:disabled):hover {
              background: #2196F3;
              color: #ffffff;
            }
            
            .p-button-rounded {
              border-radius: 2rem;
            }
            
            .p-button-sm {
              font-size: 0.875rem;
              padding: 0.5rem 0.75rem;
            }
            
            .p-button-lg {
              font-size: 1.125rem;
              padding: 0.875rem 1.25rem;
            }
            
            /* Form Controls */
            .p-inputtext {
              font-family: inherit;
              font-size: 1rem;
              color: #495057;
              background: #ffffff;
              padding: 0.75rem 0.75rem;
              border: 1px solid #ced4da;
              transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
              appearance: none;
              border-radius: 6px;
            }
            
            .p-inputtext:enabled:focus {
              outline: 0 none;
              outline-offset: 0;
              box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.2);
              border-color: #2196F3;
            }
            
            /* Layout utilities */
            .p-d-flex { display: flex !important; }
            .p-flex-column { flex-direction: column !important; }
            .p-align-items-center { align-items: center !important; }
            .p-justify-content-center { justify-content: center !important; }
            .p-justify-content-between { justify-content: space-between !important; }
            .p-text-center { text-align: center !important; }
            .p-m-0 { margin: 0 !important; }
            .p-mt-3 { margin-top: 1rem !important; }
            .p-mb-3 { margin-bottom: 1rem !important; }
            .p-p-3 { padding: 1rem !important; }
            
            /* PrimeIcons fallback - essential icons */
            .pi {
              font-family: 'primeicons';
              speak: none;
              font-style: normal;
              font-weight: normal;
              font-variant: normal;
              text-transform: none;
              line-height: 1;
              display: inline-block;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              font-size: 1rem;
            }
            
            /* When primeicons font fails, use fallback symbols */
            .pi-check:before { content: "✓"; }
            .pi-times:before { content: "×"; }
            .pi-plus:before { content: "+"; }
            .pi-minus:before { content: "−"; }
            .pi-image:before { content: "🖼"; }
            .pi-facebook:before { content: "📘"; }
            .pi-twitter:before { content: "🐦"; }
            .pi-linkedin:before { content: "💼"; }
            .pi-instagram:before { content: "📷"; }
            .pi-home:before { content: "🏠"; }
            .pi-user:before { content: "👤"; }
            .pi-phone:before { content: "📞"; }
            .pi-envelope:before { content: "✉"; }
            .pi-star:before { content: "⭐"; }
            .pi-heart:before { content: "♥"; }
            .pi-search:before { content: "🔍"; }
            .pi-shopping-cart:before { content: "🛒"; }
            .pi-calendar:before { content: "📅"; }
            .pi-clock:before { content: "🕐"; }
            .pi-map-marker:before { content: "📍"; }
            .pi-download:before { content: "⬇"; }
            .pi-upload:before { content: "⬆"; }
            .pi-external-link:before { content: "🔗"; }
            .pi-arrow-right:before { content: "→"; }
            .pi-arrow-left:before { content: "←"; }
            .pi-arrow-up:before { content: "↑"; }
            .pi-arrow-down:before { content: "↓"; }
            
            /* Responsive image handling */
            img {
              max-width: 100%;
              height: auto;
            }
            
            /* Basic layout helpers */
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
            }
            
            .row {
              display: flex;
              flex-wrap: wrap;
              margin: 0 -0.5rem;
            }
            
            .col {
              flex: 1;
              padding: 0 0.5rem;
            }
            
            @media (max-width: 768px) {
              .col {
                flex: 100%;
                margin-bottom: 1rem;
              }
            }
          </style>
          
          <!-- Page styles -->
          ${pageCSS}
          ${options.customCSS || ''}
          
          <!-- Navigation styles -->
          ${options.includeNavigation ? this.navigationRenderer.generateNavigationCSS() : ''}
        </head>
        <body class="page-body" data-page-id="${page.id}">
          <!-- Skip to main content for accessibility -->
          
          <!-- Navigation -->
          ${navigationHTML}
          
          <!-- Page content -->
          <main id="main-content" class="page-content" style="
            ${options.includeNavigation ? 'margin-top: 80px;' : ''}
            min-height: calc(100vh - ${options.includeNavigation ? '80px' : '0px'});
            position: relative;
          ">
            <!-- Page header -->
            <div class="page-header" style="display: none;">
              <h1>${this.sanitizeHtml(page.name)}</h1>
            </div>
            
            <!-- Components container -->
            <div class="components-container" style="
              position: relative;
              width: 100%;
              min-height: 100%;
            ">
              ${componentsHTML}
            </div>
          </main>
          
          <!-- Page scripts -->
          ${pageJS}
          ${options.customJS || ''}
          
          <!-- Navigation scripts -->
          ${options.includeNavigation ? this.navigationRenderer.generateNavigationJS() : ''}
          
          <!-- Performance and analytics -->
          <script>
            // Performance monitoring
            window.addEventListener('load', function() {
              const loadTime = performance.now();
              console.log('Page load time:', Math.round(loadTime) + 'ms');
            });
            
            // Error tracking
            window.addEventListener('error', function(event) {
              console.error('Page error:', event.error);
            });
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Generate page-specific CSS
   */
  private generatePageCSS(options: PageRenderOptions): string {
    return `
      <style>
        /* CSS Reset and Base Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html {
          font-size: 16px;
          scroll-behavior: smooth;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #fff;
          overflow-x: hidden;
        }
        
        /* Skip link for accessibility */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 10000;
        }
        
        .skip-link:focus {
          top: 6px;
        }
        
        /* Page layout */
        .page-content {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }
        
        .components-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
        }
        
        /* Component wrapper styles */
        .component-wrapper {
          position: absolute;
          box-sizing: border-box;
        }
        
        .page-component {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .page-component:hover {
          transform: translateZ(0);
        }
        
        /* Responsive component behavior */
        @media (max-width: 768px) {
          .component-wrapper {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            margin-bottom: 1rem;
          }
          
          .components-container {
            padding: 1rem;
          }
        }
        
        /* Print styles */
        @media print {
          .page-content {
            margin-top: 0 !important;
          }
          
          .component-wrapper {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            page-break-inside: avoid;
          }
          
          .skip-link {
            display: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .component-wrapper {
            border: 1px solid currentColor;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .page-component {
            transition: none;
          }
          
          html {
            scroll-behavior: auto;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a;
            color: #e0e0e0;
          }
        }
        
        /* Focus styles for accessibility */
        .component-wrapper:focus-within {
          outline: 2px solid #4A90E2;
          outline-offset: 2px;
        }
        
        /* PrimeNG Component Enhancements */
        .p-card {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background: #ffffff;
          color: #333333;
          transition: all 0.3s ease;
        }
        
        .p-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .p-card .p-card-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .p-card .p-card-content {
          color: #666666;
          line-height: 1.6;
        }
        
        .p-button {
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .p-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .p-button:active {
          transform: translateY(0);
        }
        
        .p-button:focus {
          outline: 2px solid #4A90E2;
          outline-offset: 2px;
        }
        
        .text-block-component {
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .text-block-component:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .prime-card-component {
          transition: all 0.3s ease;
        }
        
        .prime-card-component:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        /* Component-specific animations */
        .component-wrapper {
          transition: all 0.3s ease;
        }
        
        .component-wrapper:hover {
          z-index: 999;
        }
        
        /* Loading states */
        .component-loading {
          opacity: 0.6;
          pointer-events: none;
        }
        
        .component-loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-top: 2px solid #4A90E2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        /* Error states */
        .component-error {
          background-color: #ffe6e6;
          border: 2px dashed #ff4444;
          color: #cc0000;
          padding: 1rem;
          text-align: center;
          font-size: 12px;
        }
        
        /* Utility classes */
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .clearfix::after {
          content: '';
          display: table;
          clear: both;
        }
      </style>
    `;
  }

  /**
   * Generate page-specific JavaScript
   */
  private generatePageJS(options: PageRenderOptions): string {
    return `
      <script>
        // Page utilities
        const PageUtils = {
          // Lazy load images
          lazyLoadImages: function() {
            const images = document.querySelectorAll('img[loading="lazy"]');
            if ('IntersectionObserver' in window) {
              const imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('component-loading');
                    imageObserver.unobserve(img);
                  }
                });
              });
              
              images.forEach(img => imageObserver.observe(img));
            }
          },
          
          // Handle component interactions
          handleComponentClick: function(event) {
            const component = event.target.closest('.component-wrapper');
            if (component) {
              const componentId = component.dataset.componentId;
              const componentType = component.className.match(/component-([^\\s]+)/)?.[1];
              
              // Track interaction
              console.log('Component interaction:', { componentId, componentType });
              
              // Handle button clicks
              if (componentType === 'button') {
                const link = component.querySelector('a');
                if (link && link.href && !link.href.startsWith('#')) {
                  window.location.href = link.href;
                }
              }
            }
          },
          
          // Responsive component handling
          handleResize: function() {
            const components = document.querySelectorAll('.component-wrapper');
            const isMobile = window.innerWidth <= 768;
            
            components.forEach(component => {
              if (isMobile) {
                component.style.position = 'relative';
                component.style.left = 'auto';
                component.style.top = 'auto';
                component.style.width = '100%';
              } else {
                // Restore original positioning for desktop
                const originalStyle = component.dataset.originalStyle;
                if (originalStyle) {
                  component.style.cssText = originalStyle;
                }
              }
            });
          },
          
          // Initialize page
          init: function() {
            // Store original component styles
            document.querySelectorAll('.component-wrapper').forEach(component => {
              component.dataset.originalStyle = component.style.cssText;
            });
            
            // Set up event listeners
            document.addEventListener('click', this.handleComponentClick);
            window.addEventListener('resize', this.handleResize);
            
            // Initialize features
            this.lazyLoadImages();
            this.handleResize();
            
            // Announce page load for screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'visually-hidden';
            announcement.textContent = 'Page loaded successfully';
            document.body.appendChild(announcement);
            
            setTimeout(() => {
              announcement.remove();
            }, 1000);
          }
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            PageUtils.init();
          });
        } else {
          PageUtils.init();
        }
      </script>
    `;
  }

  /**
   * Generate page title
   */
  private generatePageTitle(page: ProcessedPage): string {
    return `${this.sanitizeHtml(page.name)} | Website`;
  }

  /**
   * Generate page description
   */
  private generatePageDescription(page: ProcessedPage): string {
    return `${this.sanitizeHtml(page.name)} page`;
  }

  /**
   * Sort components by z-index
   */
  private sortComponentsByZIndex(components: ComponentInstance[]): ComponentInstance[] {
    return [...components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  /**
   * Render missing component error
   */
  private renderMissingComponentError(component: ComponentInstance): string {
    return `
      <div class="component-error" style="
        position: absolute;
        left: ${component.x}px;
        top: ${component.y}px;
        width: ${component.width}px;
        height: ${component.height}px;
        z-index: ${component.zIndex};
        background-color: #ffe6e6;
        border: 2px dashed #ff4444;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #cc0000;
        font-size: 12px;
        text-align: center;
        padding: 1rem;
        box-sizing: border-box;
      ">
        <div>
          <strong>Missing Component</strong><br>
          Type: ${component.type}<br>
          ID: ${component.id}
        </div>
      </div>
    `;
  }

  /**
   * Generate page cache key
   */
  private generatePageCacheKey(page: ProcessedPage, options: PageRenderOptions): string {
    const optionsHash = JSON.stringify(options);
    const componentsHash = JSON.stringify(page.components.map(c => ({ id: c.id, type: c.type, params: c.parameters })));
    return `page_${page.id}_${btoa(optionsHash + componentsHash).substring(0, 8)}`;
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
} 