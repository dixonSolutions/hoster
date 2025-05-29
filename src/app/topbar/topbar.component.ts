import { Component } from '@angular/core';
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
export class TopbarComponent {
  themeOptions: ThemeOption[] = [
    { name: 'Rose & Red', value: 'rose-red', badgeColor: '#e57373' },
    { name: 'Azure & Blue', value: 'azure-blue', badgeColor: '#90caf9' },
    { name: 'Magenta & Violet', value: 'magenta-violet', badgeColor: '#8e24aa' },
    { name: 'Cyan & Orange', value: 'cyan-orange', badgeColor: '#008b8b' }
  ];
  selectedTheme: ThemeOption | null = null;

  constructor(private router: Router, private dialog: MatDialog) {}

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
  navigateToHome() {
    this.router.navigate(['/home']);
  }
  openSimpleDialog(): void {
    const dialogRef = this.dialog.open(AboutUsPopupComponent, {
      width: '300px',
      data: { message: 'About your business section is here!', title: 'About Us' }
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
}
