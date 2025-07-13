import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataServiceService } from '../data-service.service';

// PrimeNG imports
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { MenuItem } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { SidebarModule } from 'primeng/sidebar';
import { MenuModule } from 'primeng/menu';
import { DividerModule } from 'primeng/divider';

interface ThemeOption {
  name: string;
  value: string;
  badgeColor: string;
}

interface WebsitePage {
  id: string;
  name: string;
  route: string;
  isDeletable: boolean;
  components: any[];
}

interface WebsiteNavigation {
  logoType: string;
  logoText: string;
  logoImage: string;
  logoShape: string;
  logoSize: string;
  backgroundColor: string;
  textColor: string;
  showShadow: boolean;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ToolbarModule,
    ButtonModule, 
    BadgeModule, 
    SelectModule,
    AvatarModule,
    AvatarGroupModule,
    SidebarModule,
    MenuModule,
    DividerModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() websiteData: any = null;
  @Input() currentPageId: string = 'home';

  // Mobile sidebar properties
  sidebarVisible: boolean = false;
  isMobile: boolean = false;

  themeOptions: ThemeOption[] = [
    { name: 'Rose & Red', value: 'rose-red', badgeColor: '#e57373' },
    { name: 'Azure & Blue', value: 'azure-blue', badgeColor: '#90caf9' },
    { name: 'Magenta & Violet', value: 'magenta-violet', badgeColor: '#8e24aa' },
    { name: 'Cyan & Orange', value: 'cyan-orange', badgeColor: '#008b8b' }
  ];
  selectedTheme: ThemeOption | null = null;
  businessName: string | undefined;
  menuItems: MenuItem[] = [];
  websitePages: WebsitePage[] = [];
  websiteNavigation: WebsiteNavigation | null = null;
  activeSection: string = '';
  searchText: string = '';
  searchResult: any = null;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private dialog: MatDialog, 
    public dataService: DataServiceService
  ) {
    // Listen to route changes to update active section
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActiveSectionFromUrl(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit() {
    this.initializeMenuItems();
    this.setActiveSectionFromUrl(this.router.url);
    this.parseWebsiteData();
    this.checkScreenSize();
    
    // Listen to window resize events
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Get user data and token
    this.dataService.getUserById(this.dataService.userID).subscribe({
      next: (response) => {
        this.dataService.User = response.user;
        this.dataService.JWTtoken = response.token.result;
        
        // After getting the token, get the business info
        if (this.dataService.JWTtoken) {
          this.dataService.getBusinessByBusinessID(this.dataService.businessID, this.dataService.JWTtoken).subscribe({
            next: (response) => {
              this.dataService.BasicBusinessInfo = response;
              // Use website navigation business name if available, otherwise use business info
              this.businessName = this.websiteNavigation?.logoText || this.dataService.BasicBusinessInfo?.bussinessName;
            },
            error: (error) => {
              console.error('Error fetching business info:', error);
            }
          });
          this.dataService.getServicesForBusiness(this.dataService.businessID, this.dataService.JWTtoken).subscribe({
            next: (response) => {
              this.dataService.services = response;
              console.log(this.dataService.services);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error fetching user:', error);
      }
    });
  }

  ngOnChanges() {
    this.parseWebsiteData();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  private parseWebsiteData() {
    if (this.websiteData) {
      try {
        const parsedData = typeof this.websiteData === 'string' ? JSON.parse(this.websiteData) : this.websiteData;
        
        // Extract navigation configuration
        if (parsedData.builtInNavigation) {
          this.websiteNavigation = parsedData.builtInNavigation;
          this.businessName = this.websiteNavigation?.logoText || this.businessName;
        }
        
        // Extract pages
        if (parsedData.pages && Array.isArray(parsedData.pages)) {
          this.websitePages = parsedData.pages;
          this.updateMenuItemsFromWebsite();
        }
      } catch (error) {
        console.error('Error parsing website data:', error);
      }
    }
  }

  private updateMenuItemsFromWebsite() {
    // Create navigation items from website pages
    const pageMenuItems: MenuItem[] = this.websitePages.map(page => ({
      label: page.name,
      icon: this.getPageIcon(page.id),
      command: () => this.navigateToPage(page)
    }));

    // Combine website pages with default menu items
    this.menuItems = [
      ...pageMenuItems,
      {
        label: 'History',
        icon: 'pi pi-history',
        command: () => this.navigateToOrderHistory()
      },
      {
        label: 'About',
        icon: 'pi pi-info-circle',
        command: () => this.openSimpleDialog()
      }
    ];
  }

  getPageIcon(pageId: string): string {
    const iconMap: { [key: string]: string } = {
      'home': 'pi pi-home',
      'about': 'pi pi-info-circle',
      'shop': 'pi pi-shopping-cart',
      'checkout': 'pi pi-credit-card',
      'past-orders': 'pi pi-history',
      'contact': 'pi pi-phone',
      'services': 'pi pi-briefcase'
    };
    return iconMap[pageId] || 'pi pi-file';
  }

  navigateToPage(page: WebsitePage) {
    this.activeSection = page.id;
    // Stay on current website URL, just update the page query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page.id },
      queryParamsHandling: 'merge' // Keep other existing query params
    });
  }

  private initializeMenuItems() {
    // Initialize with default items, will be updated when website data is available
    this.menuItems = [
      {
        label: 'History',
        icon: 'pi pi-history',
        command: () => this.navigateToOrderHistory()
      },
      {
        label: 'About',
        icon: 'pi pi-info-circle',
        command: () => this.openSimpleDialog()
      }
    ];
  }

  setActiveSectionFromUrl(url: string) {
    if (url.includes('/landing-page')) {
      this.activeSection = 'landing-page';
    } else if (url.includes('/checkout')) {
      this.activeSection = 'checkout';
    } else if (url.includes('/shopping-cart')) {
      this.activeSection = 'shopping-cart';
    } else if (url.includes('/order-history')) {
      this.activeSection = 'order-history';
    } else if (url.includes('/home')) {
      this.activeSection = 'home';
    } else {
      this.activeSection = 'landing-page'; // Default to landing page
    }
  }

  navigateToLandingPage() {
    this.activeSection = 'landing-page';
    this.router.navigate(['/landing-page']);
  }

  navigateToHome() {
    this.activeSection = 'home';
    this.router.navigate(['/home']);
  }

  navigateToCheckout() {
    this.activeSection = 'checkout';
    this.router.navigate(['/checkout']);
  }

  navigateToShoppingCart() {
    this.activeSection = 'shopping-cart';
    this.router.navigate(['/shopping-cart']);
  }

  navigateToOrderHistory() {
    this.activeSection = 'order-history';
    this.router.navigate(['/order-history']);
  }

  openSimpleDialog(): void {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      width: '300px',
      data: { message: `${this.dataService.BasicBusinessInfo?.bussinessDescription}`, title: `Welcome to ${this.dataService.BasicBusinessInfo?.bussinessName}` }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  selectTheme(option: ThemeOption) {
    this.selectedTheme = option;
    document.body.setAttribute('data-theme', option.value);
  }

  clearTheme() {
    this.selectedTheme = null;
    document.body.removeAttribute('data-theme');
  }

  onSearchChange() {
    const query = this.searchText.trim().toLowerCase();
    if (!query || !this.dataService.services) {
      this.searchResult = null;
      return;
    }
    
    // Find the best match by name or description (simple scoring)
    let bestScore = 0;
    let bestMatch = null;
    
    for (const service of this.dataService.services) {
      const name = (service.serviceName || '').toLowerCase();
      const desc = (service.serviceDescription || '').toLowerCase();
      let score = 0;
      
      if (name.includes(query)) score += 2;
      if (desc.includes(query)) score += 1;
      if (name === query) score += 3; // exact name match
      if (desc === query) score += 2; // exact desc match
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = service;
      }
    }
    
    this.searchResult = bestMatch;
    
    // For now, just log the result
    if (bestMatch) {
      console.log('Best service match:', bestMatch);
    }
  }

  getLogoSize(): string {
    if (!this.websiteNavigation || !this.websiteNavigation.logoSize) {
      return '40px'; // Default size
    }
    
    const sizeMap: { [key: string]: string } = {
      'small': '32px',
      'medium': '40px',
      'large': '48px',
      'extra-large': '56px'
    };
    
    return sizeMap[this.websiteNavigation.logoSize] || '40px';
  }

  getLogoBorderRadius(): string {
    if (!this.websiteNavigation || !this.websiteNavigation.logoShape) {
      return '4px'; // Default border radius
    }
    
    const shapeMap: { [key: string]: string } = {
      'square': '4px',
      'rounded': '8px',
      'circle': '50%'
    };
    
    return shapeMap[this.websiteNavigation.logoShape] || '4px';
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 900; // Mobile breakpoint at 900px
    if (this.isMobile) {
      this.sidebarVisible = false; // Hide sidebar on mobile
    }
  }

  onResize() {
    this.checkScreenSize();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
