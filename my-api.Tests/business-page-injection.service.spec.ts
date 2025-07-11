import { TestBed } from '@angular/core/testing';
import { BusinessPageInjectionService } from '../src/app/services/business-page-injection.service';
import { ProcessedPage } from '../src/app/models/WebsiteRendering';

describe('BusinessPageInjectionService', () => {
  let service: BusinessPageInjectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessPageInjectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should preserve Home and About pages', () => {
    const mockPages: ProcessedPage[] = [
      {
        id: 'home',
        name: 'Home',
        route: '/',
        isDeletable: false,
        isActive: false,
        components: [
          {
            id: 'comp1',
            type: 'text-block',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            zIndex: 1,
            parameters: { title: 'Welcome' }
          }
        ]
      },
      {
        id: 'about',
        name: 'About',
        route: '/about',
        isDeletable: false,
        isActive: false,
        components: []
      }
    ];

    const result = service.processBusinessPages(mockPages);
    
    // Should preserve original home and about pages
    expect(result.length).toBeGreaterThanOrEqual(2);
    const homePage = result.find(p => p.id === 'home');
    const aboutPage = result.find(p => p.id === 'about');
    
    expect(homePage).toBeTruthy();
    expect(aboutPage).toBeTruthy();
    expect(homePage?.components.length).toBe(1); // Original component preserved
    expect(homePage?.components[0].type).toBe('text-block');
  });

  it('should replace Shop page with Angular component', () => {
    const mockPages: ProcessedPage[] = [
      {
        id: 'shop',
        name: 'Shop',
        route: '/shop',
        isDeletable: true,
        isActive: false,
        components: [
          {
            id: 'comp1',
            type: 'text-block',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            zIndex: 1,
            parameters: { title: 'Shop Content' }
          }
        ]
      }
    ];

    const result = service.processBusinessPages(mockPages);
    
    const shopPage = result.find(p => p.id === 'shop');
    expect(shopPage).toBeTruthy();
    expect(shopPage?.components.length).toBe(1);
    expect(shopPage?.components[0].type).toBe('angular-component');
    expect(shopPage?.components[0].parameters?.componentName).toBe('ShoppingCartComponent');
  });

  it('should add missing standard pages', () => {
    const mockPages: ProcessedPage[] = [
      {
        id: 'home',
        name: 'Home',
        route: '/',
        isDeletable: false,
        isActive: false,
        components: []
      }
    ];

    const result = service.processBusinessPages(mockPages);
    
    // Should have added missing standard pages like Shop, Past Orders, etc.
    expect(result.length).toBeGreaterThan(1);
    
    const shopPage = result.find(p => p.id === 'shop');
    const orderHistoryPage = result.find(p => p.id === 'past-orders' || p.id === 'order-history');
    const contactPage = result.find(p => p.id === 'contact' || p.id === 'contact-us');
    
    expect(shopPage).toBeTruthy();
    expect(orderHistoryPage).toBeTruthy();
    expect(contactPage).toBeTruthy();
    
    // Check that added pages have Angular components
    expect(shopPage?.components[0].type).toBe('angular-component');
    expect(orderHistoryPage?.components[0].type).toBe('angular-component');
    expect(contactPage?.components[0].type).toBe('angular-component');
  });

  it('should check if pages are preserved correctly', () => {
    expect(service.isPreservedPage('home')).toBe(true);
    expect(service.isPreservedPage('about')).toBe(true);
    expect(service.isPreservedPage('shop')).toBe(false);
    expect(service.isPreservedPage('checkout')).toBe(false);
  });

  it('should return business page mappings', () => {
    const mappings = service.getBusinessPageMappings();
    expect(mappings.length).toBeGreaterThan(0);
    
    const shopMapping = mappings.find(m => m.pageId === 'shop');
    expect(shopMapping).toBeTruthy();
    expect(shopMapping?.existingComponent).toBe('ShoppingCartComponent');
    expect(shopMapping?.shouldReplace).toBe(true);
  });

  it('should return preserved pages list', () => {
    const preservedPages = service.getPreservedPages();
    expect(preservedPages).toContain('home');
    expect(preservedPages).toContain('about');
    expect(preservedPages.length).toBe(2);
  });
}); 