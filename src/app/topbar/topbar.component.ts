import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AboutUsPopupComponent } from '../about-us-popup/about-us-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgStyle, CommonModule } from '@angular/common';
import { DataServiceService } from '../data-service.service';

interface ThemeOption {
  name: string;
  value: string;
  badgeColor: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NgStyle, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatButtonToggleModule],
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

  constructor(
    private router: Router, 
    private dialog: MatDialog, 
    public dataService: DataServiceService
  ) {}

  ngOnInit() {
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

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
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

  navigateToShoppingCart() {
    this.router.navigate(['/shopping-cart']);
  }

  navigateToOrderHistory() {
    this.router.navigate(['/order-history']);
  }

  navigateToContactUs() {
    this.router.navigate(['/contact-us']);
  }
}
