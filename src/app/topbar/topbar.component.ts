import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
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

interface ThemeOption {
  name: string;
  value: string;
  badgeColor: string;
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
    AvatarGroupModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit {
  themeOptions: ThemeOption[] = [
    { name: 'Rose & Red', value: 'rose-red', badgeColor: '#e57373' },
    { name: 'Azure & Blue', value: 'azure-blue', badgeColor: '#90caf9' },
    { name: 'Magenta & Violet', value: 'magenta-violet', badgeColor: '#8e24aa' },
    { name: 'Cyan & Orange', value: 'cyan-orange', badgeColor: '#008b8b' }
  ];
  selectedTheme: ThemeOption | null = null;
  businessName: string | undefined;
  menuItems: MenuItem[] = [];
  activeSection: string = '';
  searchText: string = '';
  searchResult: any = null;

  constructor(
    private router: Router, 
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
              this.businessName = this.dataService.BasicBusinessInfo?.bussinessName;
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

  private initializeMenuItems() {
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
}
