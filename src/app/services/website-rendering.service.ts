import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  IncomingData,
  ParsedWebsiteData,
  ProcessedPage,
  NavigationConfig,
  ComponentDefinition,
  ComponentInstance,
  RenderedWebsite,
  RenderedPage,
  PageRenderOptions,
  RenderingError,
  RenderingEvent
} from '../models/WebsiteRendering';

// Import specialized services
import { WebsiteValidationService } from './website-validation.service';
import { WebsiteCacheService } from './website-cache.service';
import { ComponentRenderingService } from './component-rendering.service';
import { NavigationRenderingService } from './navigation-rendering.service';
import { PageRenderingService } from './page-rendering.service';

@Injectable({
  providedIn: 'root'
})
export class WebsiteRenderingService {
  // Internal state
  private websiteData: ParsedWebsiteData | null = null;
  private componentDefinitions = new Map<string, ComponentDefinition>();
  private currentPageId = 'home';
  private errors: RenderingError[] = [];

  // Reactive state
  private websiteDataSubject = new BehaviorSubject<ParsedWebsiteData | null>(null);
  private currentPageSubject = new BehaviorSubject<string>('home');
  private errorsSubject = new BehaviorSubject<RenderingError[]>([]);
  private eventsSubject = new BehaviorSubject<RenderingEvent[]>([]);

  // Public observables
  public websiteData$ = this.websiteDataSubject.asObservable();
  public currentPage$ = this.currentPageSubject.asObservable();
  public errors$ = this.errorsSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();

  constructor(
    private validationService: WebsiteValidationService,
    private cacheService: WebsiteCacheService,
    private componentRenderer: ComponentRenderingService,
    private navigationRenderer: NavigationRenderingService,
    private pageRenderer: PageRenderingService
  ) {}

  /**
   * Initialize the website from incoming data
   */
  async initializeWebsite(incomingData: IncomingData): Promise<void> {
    try {
      this.emitEvent('initialization-started', { workspaceId: incomingData.workspaceId });

      // Step 1: Validate incoming data
      const validation = this.validationService.validateIncomingData(incomingData);
      if (!validation.isValid) {
        throw new Error(`Invalid website data: ${validation.errors.join(', ')}`);
      }

      // Step 2: Parse website JSON
      const parsedWebsiteJson = this.parseWebsiteJson(incomingData.websiteJson);
      
      // Step 3: Store component definitions
      this.storeComponentDefinitions(incomingData.components);

      // Step 4: Process website data
      const processedData = this.processWebsiteData(parsedWebsiteJson);

      // Step 5: Cache and store everything
      this.websiteData = processedData;
      this.websiteDataSubject.next(processedData);

      // Step 6: Warm up cache
      this.warmUpCache();

      // Step 7: Set initial page
      this.setCurrentPage(processedData.pages[0]?.id || 'home');

      this.emitEvent('initialization-completed', { 
        workspaceId: incomingData.workspaceId,
        pageCount: processedData.pages.length,
        componentCount: this.componentDefinitions.size
      });

      console.log('✅ Website initialized successfully');

    } catch (error) {
      const renderingError: RenderingError = {
        error: error instanceof Error ? error.message : 'Unknown initialization error',
        timestamp: new Date()
      };
      
      this.addError(renderingError);
      this.emitEvent('initialization-failed', { error: renderingError });
      
      throw error;
    }
  }

  /**
   * Render a specific page
   */
  renderPage(pageId: string, options: PageRenderOptions = { includeNavigation: true }): Observable<string> {
    if (!this.websiteData) {
      return throwError(() => new Error('Website not initialized'));
    }

    const page = this.getPageById(pageId);
    if (!page) {
      return throwError(() => new Error(`Page not found: ${pageId}`));
    }

    return this.pageRenderer.renderPage(
      page,
      this.websiteData.navigation,
      this.websiteData.pages,
      this.componentDefinitions,
      options
    ).pipe(
      tap(() => {
        this.setCurrentPage(pageId);
        this.emitEvent('page-rendered', { pageId, options });
      }),
      catchError(error => {
        const renderingError: RenderingError = {
          pageId,
          error: error instanceof Error ? error.message : 'Unknown page rendering error',
          timestamp: new Date()
        };
        this.addError(renderingError);
        this.emitEvent('page-render-failed', { pageId, error: renderingError });
        return throwError(() => error);
      })
    );
  }

  /**
   * Render all pages
   */
  renderAllPages(options: PageRenderOptions = { includeNavigation: true }): Observable<RenderedPage[]> {
    if (!this.websiteData) {
      return throwError(() => new Error('Website not initialized'));
    }

    const renderPromises = this.websiteData.pages.map(page => 
      this.renderPage(page.id, options).toPromise().then(html => ({
        id: page.id,
        name: page.name,
        route: page.route,
        html: html || ''
      }))
    );

    return new Observable(observer => {
      Promise.all(renderPromises)
        .then(renderedPages => {
          this.emitEvent('all-pages-rendered', { pageCount: renderedPages.length });
          observer.next(renderedPages);
          observer.complete();
        })
        .catch(error => {
          const renderingError: RenderingError = {
            error: error instanceof Error ? error.message : 'Unknown rendering error',
            timestamp: new Date()
          };
          this.addError(renderingError);
          observer.error(error);
        });
    });
  }

  /**
   * Get rendered website structure
   */
  getRenderedWebsite(): Observable<RenderedWebsite> {
    if (!this.websiteData) {
      return throwError(() => new Error('Website not initialized'));
    }

    return this.renderAllPages().pipe(
      map(pages => ({
        navigation: this.navigationRenderer.renderTopNavigation(
          this.websiteData!.navigation,
          this.websiteData!.pages
        ),
        pages
      }))
    );
  }

  /**
   * Get current page
   */
  getCurrentPage(): ProcessedPage | null {
    if (!this.websiteData) return null;
    return this.getPageById(this.currentPageId);
  }

  /**
   * Set current page
   */
  setCurrentPage(pageId: string): void {
    if (!this.websiteData) return;
    
    const page = this.getPageById(pageId);
    if (!page) return;

    // Update active states
    this.websiteData.pages.forEach(p => {
      p.isActive = p.id === pageId;
    });

    this.currentPageId = pageId;
    this.currentPageSubject.next(pageId);
    
    this.emitEvent('page-changed', { pageId, pageName: page.name });
  }

  /**
   * Get page by ID
   */
  getPageById(pageId: string): ProcessedPage | null {
    if (!this.websiteData) return null;
    return this.websiteData.pages.find(p => p.id === pageId) || null;
  }

  /**
   * Get all pages
   */
  getAllPages(): ProcessedPage[] {
    return this.websiteData?.pages || [];
  }

  /**
   * Get navigation config
   */
  getNavigationConfig(): NavigationConfig | null {
    return this.websiteData?.navigation || null;
  }

  /**
   * Get component definitions
   */
  getComponentDefinitions(): Map<string, ComponentDefinition> {
    return this.componentDefinitions;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cacheService.clearAllCache();
    this.emitEvent('cache-cleared', {});
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.cacheService.getStats();
  }

  /**
   * Get rendering errors
   */
  getErrors(): RenderingError[] {
    return this.errors;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.errorsSubject.next([]);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Parse website JSON string
   */
  private parseWebsiteJson(websiteJson: string): any {
    try {
      return JSON.parse(websiteJson);
    } catch (error) {
      throw new Error(`Failed to parse website JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store component definitions
   */
  private storeComponentDefinitions(components: ComponentDefinition[]): void {
    this.componentDefinitions.clear();
    components.forEach(component => {
      // Store by both id and componentType for better matching
      this.componentDefinitions.set(component.id, component);
      
      // Also store by componentType if it exists and is different from id
      if (component.componentType && component.componentType !== component.id) {
        this.componentDefinitions.set(component.componentType, component);
      }
    });
    
    console.log('Stored component definitions:', Array.from(this.componentDefinitions.keys()));
  }

  /**
   * Process website data
   */
  private processWebsiteData(parsedData: any): ParsedWebsiteData {
    // Process navigation
    const navigation = this.processBuiltInNavigation(parsedData.builtInNavigation);
    
    // Process pages
    const pages = this.processPages(parsedData.pages);
    
    return {
      navigation,
      pages,
      components: this.componentDefinitions
    };
  }

  /**
   * Process built-in navigation
   */
  private processBuiltInNavigation(navData: any): NavigationConfig {
    return {
      logoType: navData.logoType || 'text',
      logoText: navData.logoText || 'Your Business',
      logoImage: navData.logoImage || '',
      logoShape: navData.logoShape || 'square',
      logoSize: navData.logoSize || 'normal',
      backgroundColor: navData.backgroundColor || '#f8f9fa',
      textColor: navData.textColor || '#2c3e50',
      showShadow: navData.showShadow !== undefined ? navData.showShadow : true
    };
  }

  /**
   * Process pages
   */
  private processPages(pagesData: any[]): ProcessedPage[] {
    return pagesData.map(page => {
      const processedPage: ProcessedPage = {
        id: page.id,
        name: page.name,
        route: page.route,
        isDeletable: page.isDeletable !== undefined ? page.isDeletable : true,
        isActive: false,
        components: this.processPageComponents(page.components || [])
      };

      // Cache page components
      this.cacheService.setPageComponents(page.id, processedPage.components);

      return processedPage;
    });
  }

  /**
   * Process page components
   */
  private processPageComponents(componentsData: any[]): ComponentInstance[] {
    return componentsData.map(comp => {
      const componentInstance: ComponentInstance = {
        id: comp.id,
        type: comp.type,
        x: comp.x || 0,
        y: comp.y || 0,
        width: comp.width || 200,
        height: comp.height || 100,
        zIndex: comp.zIndex || 1,
        parameters: this.processComponentParameters(comp.type, comp.parameters || {})
      };

      return componentInstance;
    });
  }

  /**
   * Process component parameters
   */
  private processComponentParameters(componentType: string, instanceParams: any): any {
    const componentDef = this.componentDefinitions.get(componentType);
    if (!componentDef) {
      console.warn(`No definition found for component type: ${componentType}`);
      return instanceParams;
    }

    // Parse default parameters from either parameters or defaultParameters field
    let defaultParams = {};
    try {
      const paramsString = componentDef.parameters || componentDef.defaultParameters || '{}';
      defaultParams = JSON.parse(paramsString);
    } catch (error) {
      console.warn(`Failed to parse default parameters for ${componentDef.id}:`, error);
    }

    // Merge with instance parameters
    return { ...defaultParams, ...instanceParams };
  }

  /**
   * Warm up cache
   */
  private warmUpCache(): void {
    if (!this.websiteData) return;

    // Warm component cache
    this.cacheService.warmComponentCache(Array.from(this.componentDefinitions.values()));
    
    // Warm page cache
    this.cacheService.warmPageCache(this.websiteData.pages);
  }

  /**
   * Add rendering error
   */
  private addError(error: RenderingError): void {
    this.errors.push(error);
    this.errorsSubject.next([...this.errors]);
  }

  /**
   * Emit rendering event
   */
  private emitEvent(type: RenderingEvent['type'], data: any): void {
    const event: RenderingEvent = {
      type,
      data,
      timestamp: new Date()
    };

    // Add to events stream
    const currentEvents = this.eventsSubject.value;
    const newEvents = [...currentEvents, event].slice(-50); // Keep last 50 events
    this.eventsSubject.next(newEvents);
  }
} 