import { Injectable } from '@angular/core';
import { ProcessedPage, ComponentInstance } from '../models/WebsiteRendering';

export interface BusinessPageMapping {
  pageId: string;
  pageName: string;
  route: string;
  existingComponent: string;
  shouldReplace: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessPageInjectionService {

  // Define mappings for standard business pages to existing Angular components
  private readonly businessPageMappings: BusinessPageMapping[] = [
    {
      pageId: 'shop',
      pageName: 'Shop',
      route: '/shop',
      existingComponent: 'ShoppingCartComponent',
      shouldReplace: true
    },
    {
      pageId: 'checkout',
      pageName: 'Checkout', 
      route: '/checkout',
      existingComponent: 'ShoppingCartComponent',
      shouldReplace: true
    },
    {
      pageId: 'past-orders',
      pageName: 'Past Orders',
      route: '/past-orders',
      existingComponent: 'OrderHistoryComponent',
      shouldReplace: true
    },
    {
      pageId: 'order-history',
      pageName: 'Order History',
      route: '/order-history',
      existingComponent: 'OrderHistoryComponent',
      shouldReplace: true
    },
    {
      pageId: 'contact',
      pageName: 'Contact',
      route: '/contact',
      existingComponent: 'ContactUsComponent',
      shouldReplace: true
    },
    {
      pageId: 'contact-us',
      pageName: 'Contact Us',
      route: '/contact-us',
      existingComponent: 'ContactUsComponent',
      shouldReplace: true
    }
  ];

  // Pages that should NOT be replaced (keep business custom content)
  private readonly preservedPages = ['home', 'about'];

  constructor() {}

  /**
   * Process business website pages and inject existing Angular components for standard pages
   */
  processBusinessPages(pages: ProcessedPage[]): ProcessedPage[] {
    console.log('🔧 Processing business pages for component injection...');
    
    const processedPages = pages.map(page => {
      // Skip processing for preserved pages (Home and About)
      if (this.preservedPages.includes(page.id.toLowerCase())) {
        console.log(`✅ Preserving business page: ${page.name} (${page.id})`);
        return page;
      }

      // Check if this page should be replaced with existing component
      const mapping = this.findPageMapping(page);
      if (mapping && mapping.shouldReplace) {
        console.log(`🔄 Replacing business page "${page.name}" with ${mapping.existingComponent}`);
        return this.createAngularComponentPage(page, mapping);
      }

      // Keep original page if no mapping found
      console.log(`📄 Keeping original business page: ${page.name} (${page.id})`);
      return page;
    });

    // Check for missing standard pages and add them if needed
    const addedPages = this.addMissingStandardPages(processedPages);
    
    console.log(`✅ Processed ${processedPages.length} pages, added ${addedPages.length} missing pages`);
    return [...processedPages, ...addedPages];
  }

  /**
   * Find page mapping for a given page
   */
  private findPageMapping(page: ProcessedPage): BusinessPageMapping | null {
    // Try exact ID match first
    let mapping = this.businessPageMappings.find(m => m.pageId === page.id.toLowerCase());
    
    // Try route match if no ID match
    if (!mapping) {
      mapping = this.businessPageMappings.find(m => m.route === page.route.toLowerCase());
    }
    
    // Try name match if no route match
    if (!mapping) {
      mapping = this.businessPageMappings.find(m => 
        m.pageName.toLowerCase() === page.name.toLowerCase()
      );
    }

    return mapping || null;
  }

  /**
   * Create a page that uses an existing Angular component
   */
  private createAngularComponentPage(originalPage: ProcessedPage, mapping: BusinessPageMapping): ProcessedPage {
    return {
      ...originalPage,
      name: mapping.pageName, // Use standardized name
      route: mapping.route,   // Use standardized route
      components: [
        {
          id: `angular-${mapping.pageId}`,
          type: 'angular-component',
          x: 0,
          y: 0,
          width: window.innerWidth || 1200,
          height: window.innerHeight || 800,
          zIndex: 1,
          parameters: {
            componentName: mapping.existingComponent,
            componentSelector: this.getComponentSelector(mapping.existingComponent),
            fullPage: true,
            containerClass: `${mapping.pageId}-page-container`
          }
        }
      ]
    };
  }

  /**
   * Get Angular component selector from component name
   */
  private getComponentSelector(componentName: string): string {
    const selectorMap: { [key: string]: string } = {
      'ShoppingCartComponent': 'app-shopping-cart',
      'OrderHistoryComponent': 'app-order-history', 
      'ContactUsComponent': 'app-contact-us',
      'HomeComponent': 'app-home',
      'LandingPageComponent': 'app-landing-page'
    };

    return selectorMap[componentName] || 'app-unknown';
  }

  /**
   * Add missing standard business pages that weren't in the business JSON
   */
  private addMissingStandardPages(existingPages: ProcessedPage[]): ProcessedPage[] {
    const addedPages: ProcessedPage[] = [];
    
    // Check each standard page mapping
    for (const mapping of this.businessPageMappings) {
      const exists = existingPages.some(page => 
        page.id.toLowerCase() === mapping.pageId ||
        page.route.toLowerCase() === mapping.route ||
        page.name.toLowerCase() === mapping.pageName.toLowerCase()
      );

      if (!exists) {
        console.log(`➕ Adding missing standard page: ${mapping.pageName}`);
        const newPage: ProcessedPage = {
          id: mapping.pageId,
          name: mapping.pageName,
          route: mapping.route,
          isDeletable: false, // Standard pages shouldn't be deletable
          isActive: false,
          components: [
            {
              id: `angular-${mapping.pageId}`,
              type: 'angular-component',
              x: 0,
              y: 0,
              width: window.innerWidth || 1200,
              height: window.innerHeight || 800,
              zIndex: 1,
              parameters: {
                componentName: mapping.existingComponent,
                componentSelector: this.getComponentSelector(mapping.existingComponent),
                fullPage: true,
                containerClass: `${mapping.pageId}-page-container`
              }
            }
          ]
        };
        addedPages.push(newPage);
      }
    }

    return addedPages;
  }

  /**
   * Check if a page should be preserved (not replaced)
   */
  isPreservedPage(pageId: string): boolean {
    return this.preservedPages.includes(pageId.toLowerCase());
  }

  /**
   * Get all business page mappings
   */
  getBusinessPageMappings(): BusinessPageMapping[] {
    return [...this.businessPageMappings];
  }

  /**
   * Get preserved page IDs
   */
  getPreservedPages(): string[] {
    return [...this.preservedPages];
  }
} 